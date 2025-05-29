import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class ZoomAuth {
    constructor() {
        this.clientId = process.env.ZOOM_CLIENT_ID;
        this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
        this.accountId = process.env.ZOOM_ACCOUNT_ID;

        this.accessToken = null;
        this.tokenExpiry = null;

        // Debug: Masked credentials
        console.log('🔍 Zoom Server-to-Server OAuth Credentials:');
        console.log(`Client ID: ${this.clientId ? this.clientId.substring(0, 8) + '...' : 'NOT SET'}`);
        console.log(`Client Secret: ${this.clientSecret ? this.clientSecret.substring(0, 8) + '...' : 'NOT SET'}`);
        console.log(`Account ID: ${this.accountId ? this.accountId.substring(0, 8) + '...' : 'NOT SET'}`);

        if (this.isConfigured()) {
            console.log('✅ All Zoom Server-to-Server OAuth credentials are present');
        } else {
            console.error('❌ Missing Zoom credentials in environment variables');
        }
    }

    isConfigured() {
        return !!(this.clientId && this.clientSecret && this.accountId);
    }

    // Get OAuth token using manual Basic Auth header, params in query string (like your working curl/Postman)
    async getOAuthToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        console.log('🔐 Requesting Zoom OAuth token...');
        try {
            // Remove encodeURIComponent - use raw client secret
            const basicAuthString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await axios({
                method: 'POST',
                url: 'https://zoom.us/oauth/token',
                headers: {
                    'Authorization': `Basic ${basicAuthString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {  // Parameters in query string
                    grant_type: 'account_credentials',
                    account_id: this.accountId
                },
                timeout: 10000
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
            console.log('✅ Zoom OAuth token obtained successfully');
            return this.accessToken;

        } catch (error) {
            const resp = error.response;
            console.error('❌ OAuth Error Details:');
            if (resp) {
                console.error('Status:', resp.status);
                console.error('Status Text:', resp.statusText);
                console.error('Response Data:', JSON.stringify(resp.data, null, 2));
            } else {
                console.error(error.message);
            }
            throw new Error(
                resp?.data?.error_description ||
                resp?.data?.reason ||
                error.message
            );
        }
    }

    // Get headers for API requests using Bearer token
    async getAuthHeaders() {
        const token = await this.getOAuthToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Make authenticated API request
    async makeAuthenticatedRequest(url, options = {}) {
        const headers = await this.getAuthHeaders();
        return axios({
            url,
            headers: {
                ...headers,
                ...(options.headers || {})
            },
            ...options
        });
    }

    // Test credentials with actual API call
    async testCredentials() {
        try {
            console.log('🧪 Testing Zoom Server-to-Server OAuth credentials...');
            const token = await this.getOAuthToken();
            console.log('✅ Token obtained successfully');
            console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);

            // Test API call
            const response = await this.makeAuthenticatedRequest('https://api.zoom.us/v2/users/me', {
                method: 'GET'
            });

            console.log('✅ API call successful');
            console.log(`User ID: ${response.data.id}`);
            console.log(`Email: ${response.data.email}`);
            return true;

        } catch (error) {
            console.error('❌ Credentials test failed:', error.message);
            if (error.response?.data) {
                console.error('Error details:', JSON.stringify(error.response.data, null, 2));
            }
            return false;
        }
    }

    // Generate a curl command matching your working Postman/curl request
    generateCurlCommand() {
        const basicAuthString = Buffer.from(
            `${this.clientId}:${this.clientSecret}`
        ).toString('base64');
        return `curl --location --request POST 'https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}' \\
--header 'Authorization: Basic ${basicAuthString}'`;
    }
}

export default ZoomAuth;
