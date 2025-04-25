// services/ThinkificService.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_BASE = 'https://api.thinkific.com/api/public/v1';

// Configure retry logic for rate limits
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // 1s, 2s, 3s delays
    },
    retryCondition: (error) => {
        return error.response?.status === 429; // Retry only on 429 errors
    }
});

class ThinkificService {
    static headers() {
        return {
            'X-Auth-API-Key': process.env.THINKIFIC_API_KEY,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        };
    }
    static async getGroups() {
        try {
            const response = await axios.get(`${API_BASE}/groups`, {
                headers: this.headers(),
                params: {
                    page: 1,
                    limit: 100
                }
            });
            return response.data.items;
        } catch (error) {
            console.log('Thinkific API Response:', error);
            this.handleError(error, 'Failed to fetch groups');
        }
    }
    static async createGroup(groupData) {
        try {
            const response = await axios.post(`${API_BASE}/groups`, groupData, {
                headers: this.headers()
            });

            console.log('Thinkific API Response:', response.data);
            return response.data;

        } catch (error) {
            console.error('Thinkific API Request Failed:', {
                config: error.config,
                response: error.response?.data
            });
            this.handleError(error, 'Failed to create group');
        }
    }

    static async addUserToGroup(thinkificUserId, groupId) {
        let groupName; // Declare outside try/catch scope
        try {
            const groupResponse = await this.getGroup(groupId);
            const groupName = groupResponse.group?.name; // Correctly access the name
            console.log('Group Name:', groupName);

            await axios.post(
                `${API_BASE}/group_users`,
                { user_id: thinkificUserId, group_names: [groupName] },
                { headers: this.headers() }
            );
            return true;
        } catch (error) {
            console.error('Thinkific API Error Details:', {
                userIdUsed: thinkificUserId,
                groupIdUsed: groupId,
                groupNameAttempted: groupName || 'N/A', // ✅ Use captured value
                errorResponse: error.response?.data
            });
            throw new Error(`Failed to add user to group: ${error.response?.data?.error || error.message}`);
        }
    }

    static async getGroup(groupId) {
        try {
            const response = await axios.get(`${API_BASE}/groups/${groupId}`, {
                headers: this.headers()
            });
            console.log('Thinkific API Response to get group from id:', response.data);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch group: ${error.message}`);
        }
    }

    static async groupExists(groupId) {
        try {
            await axios.get(`${API_BASE}/groups/${groupId}`, {
                headers: this.headers()
            });
            return true;
        } catch (error) {
            if (error.response?.status === 404) return false;
            this.handleError(error, 'Group existence check failed');
        }
    }

    static handleError(error, context) {
        const errorInfo = {
            context,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        };
        console.error('Thinkific API Error:', errorInfo);
        throw new Error(`${context}: ${error.message}`);
    }
}

export default ThinkificService;
