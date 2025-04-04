import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';

const router = express.Router();
const THINKIFIC_GRAPHQL_ENDPOINT = `https://api.thinkific.com/stable/graphql`;

// PKCE Code Generation for Enhanced Security
const generatePKCE = () => {
    const codeVerifier = crypto.randomBytes(64).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    return { codeVerifier, codeChallenge };
};

// Initiate OAuth with Required Permissions
router.get('/thinkific', (req, res) => {
    try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(32).toString('hex');

        req.session.regenerate((err) => {
            if (err) throw err;

            req.session.codeVerifier = codeVerifier;
            req.session.oauthState = state;

            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Session storage failed' });
                }

                const authParams = new URLSearchParams({
                    client_id: process.env.THINKIFIC_CLIENT_ID,
                    redirect_uri: process.env.THINKIFIC_REDIRECT_URI,
                    response_type: 'code',
                    scope: 'users:read site:read',
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                    state
                });

                res.redirect(`https://${process.env.THINKIFIC_SUBDOMAIN}.thinkific.com/oauth2/authorize?${authParams}`);
            });
        });
    } catch (err) {
        console.error('Authorization error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// GraphQL Query to Fetch Current User
const GET_USER_QUERY = `query GetUser {me { id email firstName lastName}}`;

// Callback Handler for OAuth2
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;



        // Handle errors from the authorization endpoint
        if (error) throw new Error(`${error}: ${error_description}`);


        console.log('Authorization code:', code);

        // Exchange Authorization Code for Access Token
        const tokenResponse = await axios.post(
            `https://${process.env.THINKIFIC_SUBDOMAIN}.thinkific.com/oauth2/token`,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.THINKIFIC_CLIENT_ID,
                client_secret: process.env.THINKIFIC_CLIENT_SECRET,
                redirect_uri: process.env.THINKIFIC_REDIRECT_URI,
                code_verifier: req.session.codeVerifier
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(
                        `${process.env.THINKIFIC_CLIENT_ID}:${process.env.THINKIFIC_CLIENT_SECRET}`
                    ).toString('base64')}`,
                    'User-Agent': 'ThinkificManager/1.0'
                }

            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log('OAuth Token Exchange Success:', tokenResponse.data);

        // Make a GraphQL Request to Fetch Current User
        const graphqlResponse = await axios.post(
            THINKIFIC_GRAPHQL_ENDPOINT,
            {
                query: GET_USER_QUERY
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (graphqlResponse.data.errors) {
            throw new Error(graphqlResponse.data.errors.map((err) => err.message).join(', '));
        }

        console.log('GraphQL Response:', graphqlResponse.data);

        const userData = graphqlResponse.data.data.me;

        console.log('User Data:', userData);

        // Update the User in Your Local Database
        const user = await User.findOneAndUpdate(
            { thinkificId: userData.id },
            {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                lastLogin: new Date(),
                isOAuthUser: true  // Ensure this is set
            },
            { upsert: true, new: true }
        );

        req.session.destroy(); // Clear session data after successful login

        res.json({
            success: true,
            user: {
                id: user.thinkificId,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            }
        });
        // Generate JWT token
        const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        // Set HTTP-only cookie and redirect to frontend
        res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        // Redirect to frontend callback handler
        res.redirect(`${process.env.FRONTEND_BASE_URL}/callback`);
    } catch (err) {
        console.error('OAuth Callback Error:', err);

        res.status(401).json({
            error: 'Authentication failed',
            details: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('session');
    res.json({ success: true });
});

// Profile Endpoint
router.get('/profile', async (req, res) => {
    try {
        const token = req.cookies.session;
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.sub).select('-accessToken -refreshToken -__v');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user.thinkificId,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
        });
    } catch (err) {
        console.error('Profile Error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

export default router;
