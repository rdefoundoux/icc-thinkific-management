import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from 'react-router-dom'; // Import useLocation
import axios from 'axios';
import {
    ActionIcon, Avatar, Badge, Box, Button, Card, Flex, Group,
    Progress, Text, Menu, LoadingOverlay, Select, ScrollArea, useMantineTheme
} from '@mantine/core';
import { IconEdit, IconUsers, IconCertificate, IconUserPlus, IconRefresh } from '@tabler/icons-react';
import { MantineReactTable } from 'mantine-react-table';
import { getClassesByTeacher } from '../api/classes';
import { useTranslation } from 'react-i18next';
import AssignCoordinatorModal from '../components/AssignCoordinatorModal';
import AssignSFModal from '../components/AssignSFModal';
import AssignRSFModal from '../components/AssignRSFModal';
import AssignStudentsModal from '../components/AssignStudentsModal';
import AssignStudentsToSFOrRSFModal from '../components/AssignStudentsToSFOrRSFModal';
import { useMediaQuery } from '@mantine/hooks';
import "../styles/dashboard.css";

const TeacherClasses = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation(); // Use location for page focus detection
    const [activeModal, setActiveModal] = useState({ type: null, classId: null });
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);

    const [assignModal, setAssignModal] = useState({
        open: false,
        staffType: '',
        classObj: null,
        staffList: [],
    });

    // Check if user has Teacher role using includes for array of roles
    const isTeacherRole = user?.roles?.includes('teacher') || user?.role === 'teacher';

    const { data: classes, isLoading, refetch } = useQuery({
        queryKey: ['teacherClasses', user._id, location.pathname],
        queryFn: () => getClassesByTeacher(user._id),
        select: data => data?.map(cls => ({
            ...cls,
            coordinator: cls.coordinator ? (Array.isArray(cls.coordinator) ? cls.coordinator : [cls.coordinator]) : [],
            students: cls.students?.map(student => ({
                ...student,
                classId: cls._id,
                classSf: cls.sf || [],
                classRsf: cls.rsf || [],
                classData: cls, // Reference to parent class
                sfId: student.sfId || null,
                rsfId: student.rsfId || null,
                canProgress: checkProgression(student, cls.courseCode)
            })) || []
        })) || [],
        enabled: !!user._id && isTeacherRole,
        staleTime: 0, // Make data always stale to ensure refetch
        cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnMount: 'always', // Always refetch on mount
        refetchOnWindowFocus: false
    });

    const checkProgression = (student, currentCourse) => {
        const requiredAverage = currentCourse === '201' ? 80 : 70;
        const average = student.results?.average || 0;
        return average >= requiredAverage;
    };

    // Add this effect to clear the cache when navigating away
    useEffect(() => {
        // Cleanup function runs when component unmounts
        return () => {
            // Remove this query from cache when navigating away
            queryClient.removeQueries(['teacherClasses', user._id]);
        };
    }, [queryClient, user._id]);

    useEffect(() => {
        // Only refetch if we already have data (meaning we've navigated away and back)
        if (classes) {
            refetch();
        }
    }, [location.pathname]); // Only depend on pathname changes, not refetch


    const updateClassMutation = useMutation({
        mutationFn: (updatedClass) =>
            axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${updatedClass._id}`, updatedClass),
        onSuccess: () => queryClient.invalidateQueries(['teacherClasses', user._id])
    });

    const studentColumns = useMemo(() => [
        {
            accessorKey: 'student',
            header: t('common.student'),
            size: 250,
            accessorFn: row => `${row.firstName} ${row.lastName}`,
            Cell: ({ row }) => (
                <Group spacing="sm">
                    <Avatar src={row.original.avatarUrl} size={40} radius="xl" />
                    <div>
                        <Text fw={500}>{row.original.firstName} {row.original.lastName}</Text>
                        <Text size="sm" c="dimmed">{row.original.email}</Text>
                    </div>
                </Group>
            ),
            enableEditing: false,
        },
        {
            id: 'sf',
            header: t('common.sf'),
            size: 150,
            accessorFn: row => {
                const assignedSf = row.classSf?.find(sf =>
                    sf.managedStudents?.some(sId => sId.toString() === row._id.toString())
                );
                return assignedSf ? `${assignedSf.lastName} ${assignedSf.firstName}` : '';
            },
            Cell: ({ row }) => {
                const assignedSf = row.original.classSf?.find(sf =>
                    sf.managedStudents?.some(sId => sId.toString() === row.original._id.toString())
                );
                return assignedSf ? (
                    <Badge color="blue" variant="light">
                        {assignedSf.firstName} {assignedSf.lastName}
                    </Badge>
                ) : (
                    <Badge color="gray">{t('common.unassigned')}</Badge>
                );
            },
            Edit: ({ row }) => {
                const currentSf = row.original.classSf?.find(sf =>
                    sf.managedStudents?.includes(row.original._id)
                );
                const [selectedSf, setSelectedSf] = useState(currentSf?._id || '');

                const handleChange = async (value) => {
                    setSelectedSf(value);

                    // Remove from old SF
                    if (currentSf) {
                        await axios.patch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${currentSf._id}/students`,
                            {
                                classId: row.original.classId,
                                studentIds: [row.original._id],
                                action: 'remove'
                            }
                        );
                    }

                    // Add to new SF
                    if (value) {
                        await axios.patch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${value}/students`,
                            {
                                classId: row.original.classId,
                                studentIds: [row.original._id]
                            }
                        );
                    }

                    queryClient.invalidateQueries(['teacherClasses', user._id]);
                };

                return (
                    <Select
                        data={row.original.classSf.map(sf => ({
                            value: sf._id,
                            label: `${sf.firstName} ${sf.lastName}`
                        }))}
                        value={selectedSf}
                        onChange={handleChange}
                        clearable
                        placeholder={t('common.selectSF')}
                    />
                );
            }
        },
        {
            id: 'rsf',
            header: t('common.rsf'),
            size: 150,
            accessorFn: row => {
                const assignedRsf = row.classRsf?.find(rsf =>
                    rsf.managedStudents?.some(sId => sId.toString() === row._id.toString())
                );
                return assignedRsf ? `${assignedRsf.lastName} ${assignedRsf.firstName}` : '';
            },
            Cell: ({ row }) => {
                const assignedRsf = row.original.classRsf?.find(rsf =>
                    rsf.managedStudents?.some(sId => sId.toString() === row.original._id.toString())
                );
                return assignedRsf ? (
                    <Badge color="orange" variant="light">
                        {assignedRsf.firstName} {assignedRsf.lastName}
                    </Badge>
                ) : (
                    <Badge color="gray">{t('common.unassigned')}</Badge>
                );
            },
            Edit: ({ row }) => {
                const currentRsf = row.original.classRsf?.find(rsf =>
                    rsf.managedStudents?.includes(row.original._id)
                );
                const [selectedRsf, setSelectedRsf] = useState(currentRsf?._id || '');

                const handleChange = async (value) => {
                    setSelectedRsf(value);

                    // Remove from old RSF
                    if (currentRsf) {
                        await axios.patch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${currentRsf._id}/students-rsf`,
                            {
                                classId: row.original.classId,
                                studentIds: [row.original._id],
                                action: 'remove'
                            }
                        );
                    }

                    // Add to new RSF
                    if (value) {
                        await axios.patch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${value}/students-rsf`,
                            {
                                classId: row.original.classId,
                                studentIds: [row.original._id]
                            }
                        );
                    }

                    queryClient.invalidateQueries(['teacherClasses', user._id]);
                };

                return (
                    <Select
                        data={row.original.classRsf.map(rsf => ({
                            value: rsf._id,
                            label: `${rsf.firstName} ${rsf.lastName}`
                        }))}
                        value={selectedRsf}
                        onChange={handleChange}
                        clearable
                        placeholder={t('common.selectRSF')}
                    />
                );
            }
        },
        {
            accessorKey: 'results.average',
            header: t('common.progression'),
            size: 180,
            Cell: ({ row }) => (
                <Progress
                    value={row.original.results?.average || 0}
                    label={`${Math.round(row.original.results?.average || 0)}%`}
                    size="md"
                    color={row.original.canProgress ? 'green' : 'orange'}
                />
            ),
            enableEditing: false,
        }
    ], [t, queryClient, user._id]);

    // Helper for role assignment modals
    const handleRoleAssignment = (classId, type, value) => {
        queryClient.invalidateQueries(['teacherClasses', user._id]);
        setActiveModal({ type: null });
    };

    return (
        <Box p="md" className="teacher-dashboard">
            <Flex align="center" justify="space-between" mb="md">
                <Text size="xl" fw={700} className="dashboard-title">
                    {isTeacherRole ? t('teacherDashboard.myClasses') : 'Toutes les Classes'}
                </Text>
                <Button
                    leftIcon={<IconRefresh size={16} />}
                    variant="light"
                    onClick={() => refetch()}
                    loading={isLoading}
                >
                    Actualiser
                </Button>
            </Flex>

            <LoadingOverlay visible={isLoading} overlayBlur={2} />

            {!isLoading && classes?.length === 0 && (
                <Text>Aucune classe trouvée</Text>
            )}

            {classes?.map((cls) => (
                <Card key={cls._id} mb="xl" shadow="sm" padding="lg" radius="md" className="class-card">
                    <Group position="apart" mb="md" wrap="wrap">
                        <Group spacing="xs">
                            <Text fw={600} className="class-name">
                                {cls.thinkificGroupName}
                            </Text>
                            <Badge color="blue" variant="light">
                                {cls.students.length} {t('common.students')}
                            </Badge>
                        </Group>

                        <Group spacing="xl" wrap="wrap">
                            <Menu shadow="md" position="bottom-end">
                                <Menu.Target>
                                    <Button variant="light" leftIcon={<IconUserPlus size={16} />}>
                                        {t('common.assignRoles')}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        icon={<IconCertificate size={14} />}
                                        onClick={() => setActiveModal({ type: 'coordinator', classId: cls._id })}
                                    >
                                        {t('common.assignCoordinator')}
                                    </Menu.Item>
                                    <Menu.Item
                                        icon={<IconUsers size={14} />}
                                        onClick={() => setActiveModal({ type: 'sf', classId: cls._id })}
                                    >
                                        {t('common.assignSF')}
                                    </Menu.Item>
                                    <Menu.Item
                                        icon={<IconUsers size={14} />}
                                        onClick={() => setActiveModal({ type: 'rsf', classId: cls._id })}
                                    >
                                        {t('common.assignRSF')}
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>

                            <Button
                                leftIcon={<IconUsers size={16} />}
                                onClick={() => setActiveModal({ type: 'students', classId: cls._id })}
                            >
                                {t('common.assignStudents')}
                            </Button>
                            <Menu shadow="md" position="bottom-end">
                                <Menu.Target>
                                    <Button variant="light" leftIcon={<IconUserPlus size={16} />}>
                                        {t('common.assignStudentsTo')}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        icon={<IconUsers size={14} />}
                                        onClick={() =>
                                            setAssignModal({
                                                open: true,
                                                staffType: 'sf',
                                                classObj: cls,
                                                staffList: cls.sf || [],
                                            })
                                        }
                                        disabled={!cls.sf || cls.sf.length === 0}
                                    >
                                        {t('common.sf')}
                                    </Menu.Item>
                                    <Menu.Item
                                        icon={<IconUsers size={14} />}
                                        onClick={() =>
                                            setAssignModal({
                                                open: true,
                                                staffType: 'rsf',
                                                classObj: cls,
                                                staffList: cls.rsf || [],
                                            })
                                        }
                                        disabled={!cls.rsf || cls.rsf.length === 0}
                                    >
                                        {t('common.rsf')}
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Group>

                    <Group spacing="xl" mb="md" wrap="wrap">
                        <div className="role-section">
                            <Text size="sm" c="dimmed">{t('common.coordinators')}:</Text>
                            <Group spacing="xs">
                                {cls.coordinator?.length > 0 ? (
                                    cls.coordinator.map(c => (
                                        <Badge key={c._id} color="violet" variant="outline">
                                            {c.firstName} {c.lastName}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge color="gray">{t('common.unassigned')}</Badge>
                                )}
                            </Group>
                        </div>

                        <div className="role-section">
                            <Text size="sm" c="dimmed">{t('common.sf')}:</Text>
                            <Group spacing="xs">
                                {cls.sf?.length > 0 ? (
                                    cls.sf.map(sf => (
                                        <Badge key={sf._id} color="blue" variant="outline">
                                            {sf.firstName} {sf.lastName}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge color="gray">{t('common.unassigned')}</Badge>
                                )}
                            </Group>
                        </div>

                        <div className="role-section">
                            <Text size="sm" c="dimmed">{t('common.rsf')}:</Text>
                            <Group spacing="xs">
                                {cls.rsf?.length > 0 ? (
                                    cls.rsf.map(rsf => (
                                        <Badge key={rsf._id} color="orange" variant="outline">
                                            {rsf.firstName} {rsf.lastName}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge color="gray">{t('common.unassigned')}</Badge>
                                )}
                            </Group>
                        </div>
                    </Group>

                    <ScrollArea type="auto" style={{ maxWidth: '100vw', minWidth: isMobile ? 0 : 700 }}>
                        <MantineReactTable
                            columns={studentColumns}
                            data={cls.students}
                            enableColumnResizing
                            enableEditing
                            editingMode="row"
                            mantineTableContainerProps={{
                                className: "student-table-container",
                                style: { maxHeight: 'calc(100vh - 310px)' }
                            }}
                            renderRowActions={({ row }) => (
                                <ActionIcon onClick={() => row.toggleEditMode()}>
                                    <IconEdit size={20} />
                                </ActionIcon>
                            )}
                        />
                    </ScrollArea>
                </Card>
            ))}

            {/* Modals */}
            <AssignCoordinatorModal
                opened={activeModal.type === 'coordinator'}
                onClose={() => setActiveModal({ type: null })}
                classObj={classes?.find(c => c._id === activeModal.classId)}
                onAssigned={() => handleRoleAssignment(activeModal.classId, 'coordinator')}
            />

            <AssignSFModal
                opened={activeModal.type === 'sf'}
                onClose={() => setActiveModal({ type: null })}
                classObj={classes?.find(c => c._id === activeModal.classId)}
                onAssigned={() => handleRoleAssignment(activeModal.classId, 'sf')}
            />

            <AssignRSFModal
                opened={activeModal.type === 'rsf'}
                onClose={() => setActiveModal({ type: null })}
                classObj={classes?.find(c => c._id === activeModal.classId)}
                onAssigned={() => handleRoleAssignment(activeModal.classId, 'rsf')}
            />

            <AssignStudentsModal
                opened={activeModal.type === 'students'}
                onClose={() => setActiveModal({ type: null })}
                classObj={classes?.find(c => c._id === activeModal.classId)}
                onAssigned={() => queryClient.invalidateQueries(['teacherClasses', user._id])}
            />
            <AssignStudentsToSFOrRSFModal
                opened={assignModal.open}
                onClose={() =>
                    setAssignModal({ open: false, staffType: '', classObj: null, staffList: [] })
                }
                classObj={assignModal.classObj}
                staffType={assignModal.staffType}
                staffList={assignModal.staffList}
                onAssigned={() => {
                    queryClient.invalidateQueries(['teacherClasses', user._id]);
                }}
            />
        </Box>
    );
};

export default TeacherClasses;
