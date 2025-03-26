// services/thinkificService.js
import axios from 'axios';

const API_CONFIG = {
    headers: {
        'X-Auth-API-Key': process.env.REACT_APP_THINKIFIC_KEY,
        'X-Auth-Subdomain': process.env.REACT_APP_THINKIFIC_SUBDOMAIN
    }
};

export const fetchThinkificCourses = async () => {
    const response = await axios.get('https://api.thinkific.com/api/public/v1/courses', API_CONFIG);
    return response.data.items.filter(course => ['001', '101', '201'].includes(course.code));
};

export const createThinkificGroup = async (className, courseId) => {
    const response = await axios.post('https://api.thinkific.com/api/public/v1/groups', {
        name: className,
        meta: { linked_course: courseId }
    }, API_CONFIG);
    return response.data.id;
};

export const assignTeacherToGroup = async (teacherId, groupId) => {
    if (typeof window === 'undefined') return;

    await axios.post(
        `https://api.thinkific.com/api/public/v1/group_analysts/${teacherId}/groups`,
        { group_ids: [groupId] },
        {
            headers: {
                'X-Auth-API-Key': import.meta.env.VITE_THINKIFIC_API_KEY,
                'X-Auth-Subdomain': import.meta.env.VITE_THINKIFIC_SUBDOMAIN
            }
        }
    );
};
