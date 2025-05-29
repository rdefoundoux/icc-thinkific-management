
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

        // Debug: Log credentials (masked for security)
        console.log('🔍 Zoom Credentials Debug:');
        console.log(`API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
        console.log(`API Secret: ${this.apiSecret ? this.apiSecret.substring(0, 8) + '...' : 'NOT SET'}`);
        console.log(`Account ID: ${this.accountId ? this.accountId.substring(0, 8) + '...' : 'NOT SET'}`);
    }

    // Generate JWT token for Zoom API authentication (legacy - kept for backward compatibility)
    generateJWT() {
        const payload = {
            iss: this.apiKey,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
        };
        return jwt.sign(payload, this.apiSecret);
    }

    // Get OAuth token (for Server-to-Server OAuth) - DEBUGGING VERSION
    async getOAuthToken() {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            console.log('🔄 Using cached Zoom token');
            return this.accessToken;
        }

        console.log('🔐 Attempting to get new Zoom OAuth token...');
        console.log(`Using Account ID: ${this.accountId}`);

        try {
            // Method 1: Using URLSearchParams (most compatible)
            const params = new URLSearchParams();
            params.append('grant_type', 'account_credentials');
            params.append('account_id', this.accountId);

            const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

            const response = await axios.post('https://zoom.us/oauth/token', params, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            // Set expiry time (usually 1 hour, subtract 5 minutes for safety)
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

            console.log('✅ Zoom OAuth token obtained successfully');
            console.log(`Token expires in: ${response.data.expires_in} seconds`);
            return this.accessToken;
        } catch (error) {
            console.error('❌ Error getting OAuth token:', error.response?.data || error.message);
            console.error('Request details:', {
                url: 'https://zoom.us/oauth/token',
                accountId: this.accountId,
                apiKeyPrefix: this.apiKey?.substring(0, 8) + '...',
                statusCode: error.response?.status,
                headers: error.response?.headers
            });

            // Clear cached token on error
            this.accessToken = null;
            this.tokenExpiry = null;

            throw new Error(`Zoom OAuth authentication failed: ${error.response?.data?.reason || error.message}`);
        }
    }

    // Alternative method to test with different approach
    async getOAuthTokenAlternative() {
        console.log('🔐 Trying alternative OAuth method...');

        try {
            const response = await axios({
                method: 'POST',
                url: 'https://zoom.us/oauth/token',
                data: `grant_type=account_credentials&account_id=${this.accountId}`,
                auth: {
                    username: this.apiKey,
                    password: this.apiSecret
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

            console.log('✅ Alternative OAuth method successful');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Alternative OAuth method failed:', error.response?.data || error.message);
            throw error;
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
        try {
            const token = await this.getOAuthToken();
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        } catch (error) {
            console.log('🔄 Primary OAuth failed, trying alternative method...');
            try {
                const token = await this.getOAuthTokenAlternative();
                return {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            } catch (altError) {
                console.error('❌ Both OAuth methods failed');
                throw error; // Throw original error
            }
        }
    }

    // Method to test credentials without making API calls
    async testCredentials() {
        console.log('🧪 Testing Zoom credentials...');

        try {
            const token = await this.getOAuthToken();
            console.log('✅ Credentials test passed');
            return true;
        } catch (error) {
            console.error('❌ Credentials test failed:', error.message);
            return false;
        }
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
