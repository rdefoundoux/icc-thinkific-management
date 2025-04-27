// services/ThinkificService.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_BASE = 'https://api.thinkific.com/api/public/v1';
const THINKIFIC_GRAPHQL_ENDPOINT = `https://api.thinkific.com/stable/graphql`;
const GET_GROUP_USERS = `
  query GetGroupUsers($groupId: ID!, $first: Int) {
  group(id: $groupId) {
    users(first: $first) {
      edges {
        node {
          id
          email
          firstName
          lastName
           email
          courses(first: $first) {
            edges {
              node {
                name
                title
                id
              }
            }
          }
        }
      }
    }
  }
}

`;
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
    static graphqlHeaders() {
        return {
            Authorization: `Bearer ${process.env.THINKIFIC_API2_TOKEN}`,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        };
    }
    static headers() {
        return {
            'X-Auth-API-Key': process.env.THINKIFIC_API_KEY,
            'X-Auth-Subdomain': process.env.THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        };
    }
    static async getGroups() {
        try {
            console.log('Thinkific API Request: get groups entering ')
            const response = await axios.get(`${API_BASE}/groups`, {
                headers: this.headers(),
                params: { page: 1, limit: 100 }
            });

            // Verify response structure
            if (!response.data?.items) {
                throw new Error('Invalid Thinkific API response structure');
            }


            return response.data.items.map(group => ({
                id: group.id,
                name: group.name,
                users_count: group.users_count
            }));

        } catch (error) {
            console.error('Thinkific API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new Error('Failed to fetch groups from Thinkific');
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

    static async getCourses() {
        try {
            const response = await axios.get(`${API_BASE}/courses`, {
                headers: this.headers(),
                params: { page: 1, limit: 100 }
            });
            return response.data.items;
        } catch (error) {
            this.handleError(error, 'Failed to fetch courses');
        }
    }

    static async getGroup(groupId) {
        try {
            const response = await axios.get(`${API_BASE}/groups/${groupId}`, {
                headers: this.headers()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching Thinkific group:', error.response?.data || error.message);
            return { name: 'N/A' }; // Return safe default
        }
    }

    static async getGroupUsers(groupId) {
        try {
            const response = await axios.post(
                THINKIFIC_GRAPHQL_ENDPOINT,
                {
                    query: GET_GROUP_USERS,
                    variables: { groupId: groupId.toString(), first: 100 }
                },
                { headers: this.graphqlHeaders() }
            );

            return response.data?.data?.group?.users?.edges?.map(edge => ({
                ...edge.node
            })) || [];
        } catch (error) {
            console.error('Error fetching Thinkific users:', error.response?.data || error.message);
            return [];
        }
    }

    static async enrollUserInCourse(userId, courseId) {
        try {
            await axios.post(`${API_BASE}/enrollments`, {
                user_id: userId,
                course_id: courseId,
                activated_at: new Date().toISOString()
            }, { headers: this.headers() });
            return true;
        } catch (error) {
            if (error.response?.data?.error === 'User is already enrolled in this course') {
                return true; // Ignore duplicate enrollments
            }
            this.handleError(error, 'Failed to enroll user');
        }
    }

    // Bulk enroll users (parallel, but not too many at once)
    static async bulkEnrollUsers(courseId, userIds) {
        const BATCH_SIZE = 10;
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(userId => this.enrollUserInCourse(userId, courseId)));
        }
        return true;
    }

    static async getUser(userId) {
        try {
            const response = await axios.get(`${API_BASE}/users/${userId}`, {
                headers: this.headers()
            });
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'Failed to fetch user');
        }
    }

    static async getGroupUsersCount(groupId) {
        try {
            const users = await this.getGroupUsers(groupId);
            return users.length;
        } catch (error) {
            this.handleError(error, 'Failed to fetch group user count');
        }
    }
    static async getCourse(courseId) {
        try {
            const response = await axios.get(`${API_BASE}/courses/${courseId}`, {
                headers: this.headers()
            });
            return response.data;
        } catch (error) {
            this.handleError(error, 'Failed to fetch course');
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
