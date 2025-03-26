// frontend/src/components/StudentManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchStudents = async () => {
        const response = await axios.get('/api/users?role=student');
        setStudents(response.data);
    };

    const fetchClasses = async () => {
        const response = await axios.get('/api/classes');
        setClasses(response.data);
    };

    const assignStudentToClass = async (studentId, classId) => {
        try {
            await axios.post(`/api/classes/${classId}/students`, { studentId });
            await axios.post('https://api.thinkific.com/api/public/v1/enrollments', {
                user_id: studentId,
                course_id: classes.find(c => c._id === classId).courseCode
            }, {
                headers: {
                    'X-Auth-API-Key': process.env.REACT_APP_THINKIFIC_KEY,
                    'X-Auth-Subdomain': process.env.REACT_APP_THINKIFIC_SUBDOMAIN
                }
            });
            fetchStudents();
        } catch (error) {
            console.error('Assignment failed:', error);
        }
    };

    return (
        <div className="student-manager">
            <h2>Student List</h2>
            <table>
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Class</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {students.map(student => (
                    <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                            <select
                                value={student.class?._id || ''}
                                onChange={e => assignStudentToClass(student._id, e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls._id}>
                                        {cls.name} ({cls.courseCode})
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <button onClick={() => viewStudentProfile(student._id)}>
                                Profile
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};
