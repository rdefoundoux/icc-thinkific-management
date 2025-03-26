// ClassManager.jsx
import React, { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { DataTable, ClassForm, ScheduleWizard } from '../components/ClassManagement';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Box, Button, Title, Flex } from '@mantine/core';

const ClassManager = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [opened, { open, close }] = useDisclosure(false);
    const [currentClass, setCurrentClass] = useState(null);

    useEffect(() => { loadClasses(); }, []);

    const loadClasses = async () => {
        const { data } = await api.get('/classes?include=teacher,course');
        setClasses(data);
    };

    const handleSubmit = async (values) => {
        try {
            const method = values._id ? 'put' : 'post';
            const url = values._id ? `/classes/${values._id}` : '/classes';
            const { data } = await api[method](url, values);

            setClasses(prev => values._id
                ? prev.map(c => c._id === data._id ? data : c)
                : [...prev, data]
            );
            close();
        } catch (error) {
            console.error('Error saving class:', error);
        }
    };

    return (
        <Box p="md">
            <Flex justify="space-between" mb="md">
                <Title order={1}>Gestion des Classes</Title>
                {user?.role === 'admin' && (
                    <Button color="blue" onClick={open}>
                        Nouvelle Classe
                    </Button>
                )}
            </Flex>

            <DataTable
                data={classes}
                columns={[
                    { header: 'Nom', accessor: 'name' },
                    { header: 'Cours', accessor: 'course.code' },
                    { header: 'Enseignant', accessor: 'teacher.name' },
                    { header: 'Horaires', accessor: 'schedule' },
                    { header: 'Étudiants', accessor: 'students.length' }
                ]}
                onEdit={c => { setCurrentClass(c); open(); }}
            />

            <ClassForm
                opened={opened}
                onClose={() => { setCurrentClass(null); close(); }}
                initialValues={currentClass}
                onSubmit={handleSubmit}
            />
        </Box>
    );
};
export default ClassManager;
