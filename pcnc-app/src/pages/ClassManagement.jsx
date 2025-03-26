// pages/ClassManagement.jsx
import React, { useState, useEffect } from 'react';
import { fetchThinkificCourses, createThinkificGroup } from '../services/thinkificService';
import ClassCreator from '../components/ClassAssignment/ClassCreator';

const ClassManagement = () => {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const thinkificCourses = await fetchThinkificCourses();
            setCourses(thinkificCourses);
        };
        loadData();
    }, []);

    const handleClassCreation = async (newClass) => {
        try {
            // Création du groupe Thinkific
            const groupId = await createThinkificGroup(
                `${newClass.course.code}-${new Date().getTime()}`,
                newClass.course.thinkificId
            );

            // Assignation de l'enseignant
            await assignTeacherToClass(newClass.teacher, groupId);

            // Mise à jour de la base de données locale
            const createdClass = await api.post('/classes', {
                ...newClass,
                thinkificGroupId: groupId
            });

            setClasses([...classes, createdClass]);
        } catch (error) {
            console.error('Erreur de création:', error);
        }
    };

    return (
        <div className="class-management">
            <h1>Gestion des Rentrées</h1>
            <ClassCreator
                courses={courses}
                onCreate={handleClassCreation}
            />

            <div className="class-list">
                {classes.map(cls => (
                    <ClassCard
                        key={cls._id}
                        classData={cls}
                        onUpdate={handleClassUpdate}
                    />
                ))}
            </div>
        </div>
    );
};
