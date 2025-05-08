import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';
import {
    ActionIcon, Avatar, Badge, Box, Checkbox, Flex, Group,
    NumberInput, Progress, Text, TextInput, Tooltip, Card, Button
} from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconPlus, IconCertificate } from '@tabler/icons-react';
import { MantineReactTable } from 'mantine-react-table';
import { getClassesByCoordinator, updateStudentResults } from '../api/classes';
import { useTranslation } from 'react-i18next';
import "../styles/dashboard.css";

const CoordinatorDashboard = () => {
    const { i18n } = useTranslation();
    const currentLanguageCode = i18n.language;
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: classes, refetch } = useQuery({
        queryKey: ['coordinatorClasses', user._id],
        queryFn: () => getClassesByCoordinator(user._id),
        select: data => data.map(cls => ({
            ...cls,
            students: cls.students.map(student => ({
                ...student,
                enrolledCourses: student.enrolledCourses || [],
                results: student.results || { tests: [], average: 0 },
                canProgress: checkProgression(student, cls.courseCode),
                classId: cls._id
            }))
        }))
    });

    const checkProgression = (student, currentCourse) => {
        const requiredAverage = currentCourse === '201' ? 80 : 70;
        const average = student.results?.average || 0;
        return average >= requiredAverage;
    };

    const saveMutation = useMutation({
        mutationFn: async ({ row, values }) => {
            const enrollmentChanges = values.enrollmentChanges || { added: [], removed: [] };
            await updateStudentResults(row.original._id, {
                attendance: values.attendance,
                results: { tests: values.results?.tests || [] },
                enrolledCourses: [
                    ...(row.original.enrolledCourses || []),
                    ...enrollmentChanges.added
                ].filter(c => !enrollmentChanges.removed.includes(c))
            });
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/sync-enrollment`, {
                studentId: row.original._id,
                enrollmentChanges,
                language: currentLanguage,
                classId: row.original.classId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['coordinatorClasses', user._id]);
        }
    });

    const handleSaveResults = async ({ row, values, table }) => {
        await saveMutation.mutateAsync({ row, values });
        table.setEditingRow(null);
        await refetch();
    };

    // Reuse the exact same columns array from SfDashboard
    const columns = useMemo(() => [
        {
            accessorKey: 'avatar',
            header: 'ÉTUDIANT',
            size: 250,
            Cell: ({ row }) => (
                <Group spacing="sm">
                    <Avatar src={row.original.avatarUrl} size={40} radius="xl" />
                    <div>
                        <Text className="student-name">{row.original.firstName} {row.original.lastName}</Text>
                        <Text size="sm" c="dimmed">{row.original.email}</Text>
                    </div>
                </Group>
            ),
            enableEditing: false,
        },
        {
            accessorKey: 'whatsappNumber',
            header: 'WHATSAPP',
            size: 150,
            Cell: ({ row }) => (
                <Text className="whatsapp-number">
                    {row.original.whatsappNumber?.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                </Text>
            )
        },
        {
            accessorKey: 'city',
            header: 'VILLE',
            size: 150,
            Cell: ({ row }) => <Text>{row.original.city}, {row.original.country}</Text>
        },
        {
            accessorKey: 'gender',
            header: 'Genre',
            Cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.gender === 'M' ? 'Masculin' : 'Féminin'}
                </Badge>
            )
        },
        {
            accessorKey: 'iccMember',
            header: 'Membre ICC',
            Cell: ({ row }) => (
                <Badge color={row.original.iccMember ? 'green' : 'gray'}>
                    {row.original.iccMember ? 'Oui' : 'Non'}
                </Badge>
            )
        },
        {
            accessorKey: 'attendance',
            header: 'PRÉSENCE',
            size: 200,
            Cell: ({ row }) => (
                <div className="attendance-container">
                    {(row.original.attendance || []).map((att, i) => {
                        const percentage = att.totalDays > 0
                            ? (att.presentDays / att.totalDays) * 100
                            : 0;
                        return (
                            <div key={i} className="attendance-item">
                                <Text size="xs" fw={500}>{att.name}</Text>
                                <Badge color="blue" size="sm" variant="light">
                                    {att.presentDays}/{att.totalDays}
                                </Badge>
                                <Progress
                                    value={percentage}
                                    w={60}
                                    size="xs"
                                    color={percentage >= 70 ? 'green' : 'orange'}
                                />
                            </div>
                        );
                    })}
                </div>
            ),
            Edit: ({ row }) => {
                const [attendance, setAttendance] = useState([...(row.original.attendance || [])]);
                useEffect(() => { row._valuesCache.attendance = attendance; }, [attendance]);
                return (
                    <Flex direction="column" gap="sm" className="attendance-edit">
                        {attendance.map((att, i) => (
                            <Box key={i} className="attendance-edit-box">
                                <Text size="xs" fw={500} mb={4}>Session {i + 1}</Text>
                                <Flex direction="column" gap="xs">
                                    <TextInput
                                        label="Nom"
                                        value={att.name}
                                        onChange={e => {
                                            const newAttendance = [...attendance];
                                            newAttendance[i].name = e.target.value;
                                            setAttendance(newAttendance);
                                        }}
                                        w="100%"
                                    />
                                    <NumberInput
                                        label="Présents"
                                        value={att.presentDays}
                                        onChange={val => {
                                            const newAttendance = [...attendance];
                                            newAttendance[i].presentDays = val;
                                            setAttendance(newAttendance);
                                        }}
                                        min={0}
                                        w="100%"
                                    />
                                    <NumberInput
                                        label="Total"
                                        value={att.totalDays}
                                        onChange={val => {
                                            const newAttendance = [...attendance];
                                            newAttendance[i].totalDays = val;
                                            setAttendance(newAttendance);
                                        }}
                                        min={att.presentDays}
                                        w="100%"
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        onClick={() => setAttendance(attendance.filter((_, idx) => idx !== i))}
                                        mt={4}
                                    >
                                        <IconX size={16} />
                                    </ActionIcon>
                                </Flex>
                            </Box>
                        ))}
                        <Button
                            leftIcon={<IconPlus size={16} />}
                            variant="light"
                            color="blue"
                            size="xs"
                            onClick={() => setAttendance([...attendance, { name: '', presentDays: 0, totalDays: 0 }])}
                            mt={6}
                        >
                            Ajouter Session
                        </Button>
                    </Flex>
                );
            }
        },
        {
            accessorKey: 'results',
            header: 'RÉSULTATS',
            size: 200,
            Cell: ({ row }) => (
                <div className="results-container">
                    {(row.original.results.tests || []).map((test, i) => (
                        <div key={i} className="test-result">
                            <Text size="xs">{test.name}</Text>
                            <Badge
                                variant="light"
                                color={test.score >= 70 ? 'green' : 'orange'}
                                className="test-score"
                            >
                                {test.score}%
                            </Badge>
                        </div>
                    ))}
                </div>
            ),
            Edit: ({ row }) => {
                const [tests, setTests] = useState([...(row.original.results?.tests || [])]);
                useEffect(() => { row._valuesCache.results = { tests }; }, [tests]);
                return (
                    <Flex direction="column" gap="sm" className="results-edit">
                        {tests.map((test, i) => (
                            <Box key={i} className="results-edit-box">
                                <Text size="xs" fw={500} mb={4}>Test {i + 1}</Text>
                                <Flex direction="column" gap="xs">
                                    <TextInput
                                        label="Nom"
                                        value={test.name}
                                        onChange={e => {
                                            const newTests = [...tests];
                                            newTests[i].name = e.target.value;
                                            setTests(newTests);
                                        }}
                                        w="100%"
                                    />
                                    <NumberInput
                                        label="Score"
                                        value={test.score}
                                        onChange={val => {
                                            const newTests = [...tests];
                                            newTests[i].score = val;
                                            setTests(newTests);
                                        }}
                                        min={0}
                                        max={100}
                                        w="100%"
                                    />
                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        onClick={() => setTests(tests.filter((_, idx) => idx !== i))}
                                        mt={4}
                                    >
                                        <IconX size={16} />
                                    </ActionIcon>
                                </Flex>
                            </Box>
                        ))}
                        <Button
                            leftIcon={<IconPlus size={16} />}
                            variant="light"
                            color="blue"
                            size="xs"
                            onClick={() => setTests([...tests, { name: '', score: 0 }])}
                            mt={6}
                        >
                            Ajouter Test
                        </Button>
                    </Flex>
                );
            }
        },
        {
            accessorKey: 'enrolledCourses',
            header: 'INSCRIPTION AU COURS',
            size: 200,
            Cell: ({ row }) => {
                const enrolled = row.original.enrolledCourses || [];
                return (
                    <div className="course-enrollment-container">
                        {['001', '101', '201'].map(courseCode => (
                            <div
                                key={courseCode}
                                className={`course-checkbox ${enrolled.includes(courseCode) ? 'enrolled' : ''}`}
                            >
                                <Checkbox
                                    checked={enrolled.includes(courseCode)}
                                    readOnly
                                    className="enrollment-checkbox"
                                />
                                <div className="course-label">
                                    <Text className="course-code">{courseCode}</Text>
                                    <Text className="course-lang">({currentLanguageCode.toUpperCase()})</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            },
            Edit: ({ row }) => {
                const initialCourses = row.original.enrolledCourses || [];
                const [checkedCourses, setCheckedCourses] = useState([...initialCourses]);

                return (
                    <div className="course-enrollment-edit">
                        {['001', '101', '201'].map(courseCode => (
                            <div key={courseCode} className="course-edit-item">
                                <Checkbox
                                    checked={checkedCourses.includes(courseCode)}
                                    onChange={(e) => {
                                        const newCourses = e.currentTarget.checked
                                            ? [...checkedCourses, courseCode]
                                            : checkedCourses.filter(c => c !== courseCode);
                                        setCheckedCourses(newCourses);
                                        row._valuesCache.enrollmentChanges = {
                                            added: newCourses.filter(c => !initialCourses.includes(c)),
                                            removed: initialCourses.filter(c => !newCourses.includes(c))
                                        };
                                    }}
                                    className="enrollment-edit-checkbox"
                                />
                                <div className="course-edit-label">
                                    <Text className="course-code">{courseCode}</Text>
                                    <Text className="course-lang">({currentLanguageCode.toUpperCase()})</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
        },
        {
            accessorKey: 'progression',
            header: 'PROGRESSION',
            size: 180,
            Cell: ({ row }) => (
                <Badge
                    color={row.original.canProgress ? 'green' : 'red'}
                    variant="filled"
                    className="progression-badge"
                >
                    {row.original.canProgress ? 'Prêt pour la suite' : 'Révision nécessaire'}
                </Badge>
            ),
            enableEditing: false,
        }
    ], [currentLanguageCode]);

    return (
        <Box p="md" className="coordinator-dashboard">
            <Text size="xl" fw={700} mb="md" className="dashboard-title">
                {user.role === 'coordinator' ? 'Mes Classes Coordonnées' : 'Toutes les Classes'}
            </Text>
            {classes?.map((cls, index) => (
                <Card key={index} mb="xl" shadow="sm" padding="lg" radius="md" className="class-card">
                    <Group position="apart" mb="md">
                        <Group spacing="xs">
                            <Text fw={600} className="class-name">
                                {cls.thinkificGroupName}
                            </Text>
                            <Badge color="blue" variant="light">
                                {cls.students.length} étudiants
                            </Badge>
                        </Group>
                        <Group spacing="xl">
                            <Text fw={500}>
                                Enseignant: {cls.teacher?.firstName} {cls.teacher?.lastName}
                            </Text>
                            <Text fw={500}>
                                SF: {cls.sf?.map(sf => `${sf.firstName} ${sf.lastName}`).join(', ')}
                            </Text>
                        </Group>
                    </Group>
                    <MantineReactTable
                        columns={columns}
                        data={cls.students}
                        enableRowVirtualization
                        enableColumnResizing
                        enableEditing
                        editDisplayMode="row"
                        mantineTableContainerProps={{
                            className: "student-table-container",
                            style: { maxHeight: 'calc(100vh - 210px)' }
                        }}
                        mantineEditTextInputProps={{ variant: 'filled' }}
                        onEditingRowSave={handleSaveResults}
                        renderRowActions={({ row, table }) => (
                            <Flex gap="md">
                                {table.getState().editingRow?.id === row.id ? (
                                    <>
                                        <Tooltip label="Enregistrer">
                                            <ActionIcon
                                                color="green"
                                                onClick={() => handleSaveResults({ row, values: row._valuesCache, table })}
                                            >
                                                <IconCheck />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Annuler">
                                            <ActionIcon color="red" onClick={() => table.setEditingRow(null)}>
                                                <IconX />
                                            </ActionIcon>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Tooltip label="Modifier">
                                        <ActionIcon onClick={() => table.setEditingRow(row)}>
                                            <IconEdit />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Flex>
                        )}
                    />
                </Card>
            ))}
        </Box>
    );
};

export default CoordinatorDashboard;
