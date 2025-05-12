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
    static async paginatedGet(endpoint, params = {}) {
        let allItems = [];
        let page = 1;
        const limit = 250; // Max allowed by Thinkific API
        let hasMore = true;

        while (hasMore) {
            try {
                const response = await axios.get(endpoint, {
                    headers: this.headers(),
                    params: { ...params, page, limit }
                });

                if (response.data?.items) {
                    allItems = allItems.concat(response.data.items);
                }

                // Check pagination metadata
                const meta = response.data?.meta?.pagination;
                hasMore = meta?.total_pages > page;
                page++;

            } catch (error) {
                this.handleError(error, `Failed to paginate ${endpoint}`);
                break;
            }
        }

        return allItems;
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
    static async updateGroup(groupId, { name, description = '' }) {
        try {
            const response = await axios.put(
                `${API_BASE}/groups/${groupId}`,
                { name, description },
                {
                    headers: this.headers()
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating Thinkific group:', error.response?.data || error.message);
            throw new Error('Failed to update Thinkific group');
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
            return await this.paginatedGet(`${API_BASE}/courses`);
        } catch (error) {
            this.handleError(error, 'Failed to fetch courses');
            return [];
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
    static async courseExists(courseId) {
        try {
            await this.getCourse(courseId);
            return true;
        } catch (error) {
            return false;
        }
    }
    static async getProductByCourseId(courseId) {
        try {
            const allProducts = await this.paginatedGet(`${API_BASE}/products`);

            let product= allProducts.find(product => {

                return product.productable_type === 'Course'&&
                    String(product.productable_id) === String(courseId);
            });

            return product;
        } catch (error) {
            console.error('Error fetching products:', error);
            return null;
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
    // Add to ThinkificService.js
    static async unenrollUserFromCourse(userId, courseId) {
        try {
            // First get the enrollment ID
            const enrollmentId = await this.getEnrollmentId(userId, courseId);
            if (!enrollmentId) {
                console.log('Enrollment not found, nothing to delete');
                return true;
            }

            await axios.delete(`${API_BASE}/enrollments/${enrollmentId}`, {
                headers: this.headers()
            });
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('Enrollment already removed');
                return true;
            }
            this.handleError(error, 'Failed to unenroll user');
        }
    }

    // Helper method to find enrollment ID
    static async getEnrollmentId(userId, courseId) {
        try {
            const response = await axios.get(`${API_BASE}/enrollments`, {
                headers: this.headers(),
                params: {
                    'query[user_id]': userId,
                    'query[course_id]': courseId
                }
            });

            if (response.data.items?.length > 0) {
                return response.data.items[0].id;
            }
            return null;
        } catch (error) {
            this.handleError(error, 'Failed to find enrollment');
            return null;
        }
    }
    static async createUser(userData) {
        try {
            const response = await axios.post(`${API_BASE}/users`, {
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email
            }, {
                headers: this.headers()
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Thinkific user:', error.response?.data || error.message);
            throw error;
        }
    }

}

export default ThinkificService;
