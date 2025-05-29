
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

class ZoomAuth {
    constructor() {
        this.apiKey = process.env.ZOOM_API_KEY;
        this.apiSecret = process.env.ZOOM_API_SECRET;
        this.accountId = process.env.ZOOM_ACCOUNT_ID;
        this.baseURL = 'https://api.zoom.us/v2';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Generate JWT token for Zoom API authentication (legacy - kept for backward compatibility)
    generateJWT() {
        const payload = {
            iss: this.apiKey,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
        };
        return jwt.sign(payload, this.apiSecret);
    }

    // Get OAuth token (for Server-to-Server OAuth) - CORRECTED VERSION
    async getOAuthToken() {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await axios.post('https://zoom.us/oauth/token', null, {
                params: {
                    grant_type: 'account_credentials',
                    account_id: this.accountId
                },
                auth: {
                    username: this.apiKey,
                    password: this.apiSecret
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            // Set expiry time (usually 1 hour, subtract 5 minutes for safety)
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

            console.log('✅ Zoom OAuth token obtained successfully');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Error getting OAuth token:', error.response?.data || error.message);

            // Clear cached token on error
            this.accessToken = null;
            this.tokenExpiry = null;

            throw new Error(`Zoom OAuth authentication failed: ${error.response?.data?.reason || error.message}`);
        }
    }

    // Legacy method for JWT headers (deprecated)
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.generateJWT()}`,
            'Content-Type': 'application/json'
        };
    }

    // OAuth headers (recommended method)
    async getOAuthHeaders() {
        const token = await this.getOAuthToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    // Method to clear cached token (useful for testing or forced refresh)
    clearToken() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Method to check if credentials are configured
    isConfigured() {
        return !!(this.apiKey && this.apiSecret && this.accountId);
    }
}

export default ZoomAuth;
