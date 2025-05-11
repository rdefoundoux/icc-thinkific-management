import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getAdminClasses = async () => {
    const response = await axios.get(`${API_BASE}/api/v1/admin/classes`);
    return response.data; // Ensure this returns the data directly
};

// Update other API functions similarly to return raw data
export const getPendingStudents = async () => {
    const response = await axios.get(`${API_BASE}/api/v1/admin/pending-students`);
    return response.data; // Remove any .data.data nesting
};

export const validateStudents = async (studentIds) => {
    const response = await axios.post(`${API_BASE}/api/v1/admin/validate-students`, { studentIds });
    return response.data;
};

export const syncThinkificUsers = async (studentIds) => {
    const response = await axios.post(`${API_BASE}/api/v1/admin/sync-thinkific`, { studentIds });
    return response.data;
};

export const getCoordinators = async () => {
    const response = await axios.get(`${API_BASE}/api/v1/admin/coordinators`);
    return response.data;
};

export const getSFs = async () => {
    const response = await axios.get(`${API_BASE}/api/v1/admin/sfs`);
    return response.data;
};

export const assignStudentsToClasses = async (assignments) => {
    const response = await axios.post(`${API_BASE}/api/v1/admin/assign-students`, { assignments });
    return response.data;
};
