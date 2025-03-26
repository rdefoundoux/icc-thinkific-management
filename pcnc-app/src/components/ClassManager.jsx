// frontend/src/components/ClassManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassManager = () => {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses] = useState(['001', '101', '201']);
    const [newClass, setNewClass] = useState({
        name: '',
        courseCode: '',
        schedule: { days: [], timeSlot: '' },
        teacher: ''
    });

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        const response = await axios.get('/api/classes');
        setClasses(response.data);
    };

    const fetchTeachers = async () => {
        const response = await axios.get('/api/users?role=teacher');
        setTeachers(response.data);
    };

    const createClass = async () => {
        try {
            const response = await axios.post('/api/classes', {
                ...newClass,
                thinkificGroupId: await createThinkificGroup()
            });
            setClasses([...classes, response.data]);
        } catch (error) {
            console.error('Error creating class:', error);
        }
    };

    const createThinkificGroup = async () => {
        const response = await axios.post('https://api.thinkific.com/api/public/v1/groups', {
            name: `${newClass.courseCode}-${Date.now()}`,
            meta: { linked_course: newClass.courseCode }
        }, {
            headers: {
                'X-Auth-API-Key': process.env.REACT_APP_THINKIFIC_KEY,
                'X-Auth-Subdomain': process.env.REACT_APP_THINKIFIC_SUBDOMAIN
            }
        });
        return response.data.id;
    };

    return (
        <div className="class-manager">
            <h2>Create New Class</h2>
            <div className="form-group">
                <label>Course Code:</label>
                <select
                    value={newClass.courseCode}
                    onChange={e => setNewClass({...newClass, courseCode: e.target.value})}
                >
                    <option value="">Select Course</option>
                    {courses.map(code => (
                        <option key={code} value={code}>{code}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Teacher:</label>
                <select
                    value={newClass.teacher}
                    onChange={e => setNewClass({...newClass, teacher: e.target.value})}
                >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                        </option>
                    ))}
                </select>
            </div>

            <button onClick={createClass}>Create Class</button>

            <h2>Existing Classes</h2>
            <div className="class-list">
                {classes.map(cls => (
                    <div key={cls._id} className="class-card">
                        <h3>{cls.name} ({cls.courseCode})</h3>
                        <p>Teacher: {cls.teacher?.name}</p>
                        <p>Schedule: {cls.schedule.days.join(', ')} {cls.schedule.timeSlot}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default ClassManager; // Ajouter cette ligne
