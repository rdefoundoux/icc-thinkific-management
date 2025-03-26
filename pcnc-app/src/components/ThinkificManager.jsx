import React, { useState, useEffect } from 'react';
import {
    Table,
    Select,
    Button,
    Title,
    LoadingOverlay,
    Notification,
    Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle, IconChecklist } from '@tabler/icons-react';
import axios from 'axios';

const ThinkificManager = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState({});
    const [loading, { open: startLoading, close: stopLoading }] = useDisclosure(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const API_CONFIG = {
        headers: {
            'X-Auth-API-Key': typeof window !== 'undefined'
                ? import.meta.env.VITE_THINKIFIC_API_KEY
                : '',
            'X-Auth-Subdomain': typeof window !== 'undefined'
                ? import.meta.env.VITE_THINKIFIC_SUBDOMAIN
                : ''
        }
    };

    useEffect(() => {
        fetchPaginatedData('users?role=student', setStudents);
        fetchPaginatedData('courses', setCourses);
    }, []);

    const fetchPaginatedData = async (endpoint, setter) => {
        startLoading();
        try {
            let allItems = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await axios.get(
                    `https://api.thinkific.com/api/public/v1/${endpoint}`,
                    {
                        ...API_CONFIG,
                        params: { page, limit: 100 }
                    }
                );

                allItems = [...allItems, ...response.data.items];
                hasMore = response.data.meta?.pagination?.has_more;
                page++;
            }
            setter(allItems);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            stopLoading();
        }
    };

    const handleEnrollment = async (studentId) => {
        startLoading();
        try {
            await axios.post(
                'https://api.thinkific.com/api/public/v1/enrollments',
                {
                    user_id: studentId,
                    course_id: selectedCourses[studentId]
                },
                API_CONFIG
            );
            setSuccess(`Successfully enrolled student in course`);
            setError(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Enrollment failed');
        } finally {
            stopLoading();
        }
    };

    const customFieldHeaders = [
        ...new Set(
            students.flatMap(student =>
                student.custom_profile_fields?.map(field => field.label) || []
            )
        )
    ];

    return (
        <Box p="md">
            <Title order={2} mb="xl" display="flex" c="blue.5">
                <IconChecklist style={{ marginRight: 10 }} />
                Thinkific Student Management
            </Title>

            {error && (
                <Notification
                    icon={<IconAlertCircle />}
                    color="red"
                    onClose={() => setError(null)}
                    mb="md"
                >
                    {error}
                </Notification>
            )}

            {success && (
                <Notification
                    icon={<IconChecklist />}
                    color="green"
                    onClose={() => setSuccess(null)}
                    mb="md"
                >
                    {success}
                </Notification>
            )}

            <LoadingOverlay visible={loading} zIndex={1000} />

            <Table.ScrollContainer minWidth={800}>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Student</Table.Th>
                            <Table.Th>Email</Table.Th>
                            {customFieldHeaders.map(header => (
                                <Table.Th key={header}>{header}</Table.Th>
                            ))}
                            <Table.Th>Course</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {students.map(student => (
                            <Table.Tr key={student.id}>
                                <Table.Td>{student.first_name} {student.last_name}</Table.Td>
                                <Table.Td>{student.email}</Table.Td>

                                {customFieldHeaders.map(header => (
                                    <Table.Td key={header}>
                                        {student.custom_profile_fields?.find(f => f.label === header)?.value || '-'}
                                    </Table.Td>
                                ))}

                                <Table.Td>
                                    <Select
                                        data={courses.map(course => ({
                                            value: course.id,
                                            label: course.name,
                                            description: course.code
                                        }))}
                                        value={selectedCourses[student.id]}
                                        onChange={(value) => setSelectedCourses(prev => ({
                                            ...prev,
                                            [student.id]: value
                                        }))}
                                        placeholder="Select course"
                                        searchable
                                        nothingFoundMessage="No courses found"
                                    />
                                </Table.Td>

                                <Table.Td>
                                    <Button
                                        variant="light"
                                        onClick={() => handleEnrollment(student.id)}
                                        disabled={!selectedCourses[student.id]}
                                    >
                                        Enroll
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Box>
    );
};

export default ThinkificManager;
