import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassroomManager = () => {
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [students, setStudents] = useState([]);
    const [newClassroom, setNewClassroom] = useState({
        name: '',
        courseId: '',
        teacherId: ''
    });

    const API_CONFIG = {
        headers: {
            'X-Auth-API-Key': import.meta.env.VITE_THINKIFIC_API_KEY,
            'X-Auth-Subdomain': import.meta.env.VITE_THINKIFIC_SUBDOMAIN,
            'Content-Type': 'application/json'
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchCourses();
        fetchClassrooms();
        fetchStudents();
    }, []);

    const fetchTeachers = async () => {
        const { data } = await axios.get(
            'https://api.thinkific.com/api/public/v1/users?role=instructor',
            API_CONFIG
        );
        setTeachers(data.items.filter(user =>
            user.custom_profile_fields?.find(f => f.label === 'Type' && f.value === 'TEACHER')
        ));
    };

    const fetchCourses = async () => {
        const { data } = await axios.get(
            'https://api.thinkific.com/api/public/v1/courses',
            API_CONFIG
        );
        setCourses(data.items);
    };

    const fetchClassrooms = async () => {
        const { data } = await axios.get(
            'https://api.thinkific.com/api/public/v1/groups',
            API_CONFIG
        );
        setClassrooms(data.items.map(group => ({
            ...group,
            courseId: group.meta?.course_id || ''
        })));
    };

    const fetchStudents = async () => {
        const { data } = await axios.get(
            'https://api.thinkific.com/api/public/v1/users?role=student',
            API_CONFIG
        );
        setStudents(data.items);
    };

    const createClassroom = async () => {
        const { data } = await axios.post(
            'https://api.thinkific.com/api/public/v1/groups',
            {
                name: newClassroom.name,
                meta: { course_id: newClassroom.courseId }
            },
            API_CONFIG
        );

        await axios.post(
            `https://api.thinkific.com/api/public/v1/group_analysts/${newClassroom.teacherId}/groups`,
            { group_ids: [data.id] },
            API_CONFIG
        );

        fetchClassrooms();
    };

    const manageClassroomStudents = async (classroomId, studentIds, action) => {
        // Add/remove students from group
        await axios.post(
            `https://api.thinkific.com/api/public/v1/group_users`,
            {
                user_ids: studentIds,
                group_ids: [classroomId],
                _method: action === 'remove' ? 'delete' : 'post'
            },
            API_CONFIG
        );

        // Handle course enrollment
        const classroom = classrooms.find(c => c.id === classroomId);
        if (classroom?.courseId) {
            await axios.post(
                'https://api.thinkific.com/api/public/v1/enrollments/bulk',
                {
                    user_ids: studentIds,
                    course_id: classroom.courseId,
                    _method: action === 'remove' ? 'delete' : 'post'
                },
                API_CONFIG
            );
        }
    };

    return (
        <div className="classroom-manager">
            <h1>Classroom Management</h1>

            {/* Create Classroom Section */}
            <div className="create-classroom">
                <h2>Create New Classroom</h2>
                <input
                    placeholder="Classroom Name"
                    value={newClassroom.name}
                    onChange={e => setNewClassroom({...newClassroom, name: e.target.value})}
                />
                <select
                    value={newClassroom.teacherId}
                    onChange={e => setNewClassroom({...newClassroom, teacherId: e.target.value})}
                >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                        </option>
                    ))}
                </select>
                <select
                    value={newClassroom.courseId}
                    onChange={e => setNewClassroom({...newClassroom, courseId: e.target.value})}
                >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
                <button onClick={createClassroom}>Create Classroom</button>
            </div>

            {/* Classroom List */}
            {classrooms.map(classroom => (
                <div key={classroom.id} className="classroom">
                    <h3>{classroom.name}</h3>
                    <p>Teacher: {
                        teachers.find(t => t.id === classroom.analyst_ids?.[0])?.first_name || 'Unassigned'
                    }</p>
                    <p>Course: {
                        courses.find(c => c.id === classroom.meta?.course_id)?.name || 'No course linked'
                    }</p>

                    <div className="student-management">
                        <h4>Manage Students</h4>
                        <table>
                            <thead>
                            <tr>
                                <th>Student</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td>{student.first_name} {student.last_name}</td>
                                    <td>
                                        <button
                                            onClick={() => manageClassroomStudents(
                                                classroom.id,
                                                [student.id],
                                                classroom.student_ids?.includes(student.id) ? 'remove' : 'add'
                                            )}
                                        >
                                            {classroom.student_ids?.includes(student.id) ? 'Remove' : 'Add'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClassroomManager;
