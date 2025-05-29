
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
    }

    // Generate JWT token for Zoom API authentication
    generateJWT() {
        const payload = {
            iss: this.apiKey,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
        };
        return jwt.sign(payload, this.apiSecret);
    }

    // Get OAuth token (for Server-to-Server OAuth)
    async getOAuthToken() {
        const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

        try {
            const response = await axios.post('https://zoom.us/oauth/token',
                `grant_type=account_credentials&account_id=${this.accountId}`,
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            return response.data.access_token;
        } catch (error) {
            console.error('Error getting OAuth token:', error.response?.data || error.message);
            throw error;
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.generateJWT()}`,
            'Content-Type': 'application/json'
        };
    }

    async getOAuthHeaders() {
        const token = await this.getOAuthToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

export default ZoomAuth;
