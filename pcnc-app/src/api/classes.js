import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

export const getClasses = async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_BASE}/classes`, {
        params: { page, limit }
    });
    return response.data;
};

export const getClassDetails = async (classId) => {
    const response = await axios.get(`${API_BASE}/classes/${classId}`);
    return response.data;
};

export const getClassesForRegistration = async (page = 1, limit = 10) => {
    const response = await axios.get(`${API_BASE}/classes/registration`, {
        params: { page, limit }
    });
    return response.data;
};

export const createClass = async (classData) => {
    const response = await axios.post(`${API_BASE}/classes`, classData);
    return response.data;
};

export const updateClass = async (classId, classData) => {
    const response = await axios.put(`${API_BASE}/classes/${classId}`, classData);
    return response.data;
};

export const getClassesByTeacher = async (teacherId) => {
    const response = await axios.get(`${API_BASE}/classes/teacher/${teacherId}`);
    return response.data.data;
}
// SF-specific API calls
export const getClassesBySF = async (sfId) => {
    const response = await axios.get(`${API_BASE}/classes/sf/${sfId}`);
    return response.data.data;
};

export const getClassesByCoordinator = async (coId) => {
    const response = await axios.get(`${API_BASE}/classes/coordinator/${coId}`);
    return response.data.data;
};

export const assignStudentsToClass = async (classId, studentIds) => {
    const response = await axios.post(`${API_BASE}/classes/${classId}/students`, {
        students: studentIds
    });
    return response.data;
};

export const updateStudentResults = async (studentId, resultsData) => {
    const response = await axios.patch(
        `${API_BASE}/classes/students/${studentId}/results`,
        resultsData );
    return response.data;
};

// Thinkific integration functions
export const getThinkificGroups = async () => {
    const response = await axios.get(`${API_BASE}/classes/groups`);
    return response.data;
};

export const getGroupUsers = async (groupId) => {
    const response = await axios.get(`${API_BASE}/classes/groups/${groupId}/users`);
    return response.data;
};

export const getThinkificCourses = async () => {
    const response = await axios.get(`${API_BASE}/classes/courses`);
    return response.data;
};
