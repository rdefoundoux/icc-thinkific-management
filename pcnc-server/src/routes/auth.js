import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthController } from '../controllers/authController.js';
import { userSyncService } from '../services/user-syncService.js';

const router = express.Router();
const authController = new AuthController();

// PKCE Code Verifier & Code Challenge
const codeVerifier = crypto.randomBytes(32).toString('hex');
const toBase64UrlEncoded = (str) =>
    str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const codeChallenge = toBase64UrlEncoded(
    crypto.createHash('sha256').update(codeVerifier).digest('base64')
);

// OAuth: Initialize Thinkific login
router.get('/thinkific', (req, res) => {
    try {
        let { subdomain } = req.query;

        // Fallback to environment variable if subdomain is not passed
        subdomain = subdomain || process.env.THINKIFIC_SUBDOMAIN;

        if (!subdomain) {
            return res
                .status(400)
                .json({ error: 'Subdomain query parameter is required.' });
        }

        const authorizeUrl = `${process.env.PROTOCOL}://${subdomain}.${process.env.ENVIRONMENT}/oauth2/authorize?client_id=${process.env.THINKIFIC_CLIENT_ID}&response_type=code&redirect_uri=${process.env.THINKIFIC_OAUTH_REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        res.redirect(authorizeUrl);
    } catch (err) {
        console.error('Error in Thinkific OAuth initiation:', err);
        res.status(500).json({ error: 'Unexpected error while initiating OAuth flow.' });
    }
});

// OAuth Callback: Exchange Code for Tokens
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        let { subdomain } = req.query;
console.log('before',subdomain);
        // Fallback to default subdomain if dynamic subdomain is not passed
        subdomain = subdomain || process.env.THINKIFIC_SUBDOMAIN;
        console.log('after',subdomain)
        if (!code || !subdomain) {
            return res.status(400).json({
                error: 'Code and subdomain query parameters are required.',
            });
        }
        console.log('token',subdomain);
        const tokenUrl = `${process.env.PROTOCOL}://${subdomain}.${process.env.ENVIRONMENT}/oauth2/token`;
        console.log('tokenUrl',tokenUrl);
        const options = {
            grant_type: 'authorization_code',
            code_verifier: codeVerifier,
            code,
        };

        const authParams = {
            auth: {
                username: process.env.THINKIFIC_CLIENT_ID,
            },
        };

        // Exchange authorization code for tokens
        const tokenResponse = await authController.exchangeCodeForToken(
            code,
            tokenUrl,
            options,
            authParams
        );

        if (!tokenResponse) {
            throw new Error('Could not retrieve token from Thinkific.');
        }

        const { access_token: accessToken, gid } = tokenResponse;

        // Find or create the user locally
        let user = await User.findOne({ subdomain });
        if (!user) {
            user = await User.create({ subdomain, gid, accessToken });
        } else {
            user.accessToken = accessToken; // Update access token if re-authenticating
            await user.save();
        }

        // Generate a local JWT and redirect or respond appropriately
        const localJwt = authController.generateLocalJWT(user);

        res.cookie('authToken', localJwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: process.env.JWT_EXPIRE,
        });

        const appSubviewUrl = `${process.env.PROTOCOL}://${subdomain}.${process.env.ENVIRONMENT}/manage/apps/${process.env.SLUG}#embedded-app`;

        res.redirect(appSubviewUrl);
    } catch (err) {
        console.error('Error in OAuth callback:', err);
        res.redirect(
            `/error?message=${encodeURIComponent('OAuth callback failed. Please try again.')}`
        );
    }
});

// Logout User
router.post('/logout', (req, res) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(204).send();
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed.' });
    }
});

// Retrieve Current User Details
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ user: null });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -__v');

        res.status(200).json({ user });
    } catch (err) {
        console.error('Error in retrieving user info:', err);
        res.status(500).json({ user: null });
    }
});

export default router;
