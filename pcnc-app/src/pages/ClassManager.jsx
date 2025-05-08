import React, { useState, useEffect } from 'react';
import {
    Table, Button, Group, Text, Loader, ActionIcon,
    Tooltip, Pagination, Box, Paper, Avatar, Badge
} from '@mantine/core';
import {
    IconPlus, IconEdit, IconUsers, IconUserPlus, IconBook,
    IconUserCheck  // Add this
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import ClassForm from '../components/ClassForm';
import useClasses from '../hooks/useClasses';
import AssignTeacherModal from '../components/AssignTeacherModal';
import AssignCoordinatorModal from '../components/AssignCoordinatorModal';
import AssignSFModal from '../components/AssignSFModal';
import AssignRSFModal from '../components/AssignRSFModal';
import CourseAssignmentModal from '../components/CourseAssignmentModal';
import AssignStudentsModal from '../components/AssignStudentsModal';
import ClassDetailsModal from '../components/ClassDetailsModal';

const columnStyles = [
    { minWidth: 90 },   // Type
    { minWidth: 110 },  // Region
    { minWidth: 120 },  // Course Code
    { minWidth: 90 },   // Month
    { minWidth: 70 },   // Year
    { minWidth: 220 },  // Thinkific Group
    { minWidth: 180 },  // Teacher
    { minWidth: 150 },  // Assigned Courses
    { minWidth: 100 },  // Students
    { minWidth: 130 }   // Actions
];

const ClassManager = () => {
    const [showForm, setShowForm] = useState(false);
    const [existingGroups, setExistingGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const { classes, loading, page, total, fetchClasses } = useClasses();
    const { t } = useTranslation();
    const [selectedClass, setSelectedClass] = useState(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [groupUsers, setGroupUsers] = useState({});
    const [assignCoordinatorModalOpen, setAssignCoordinatorModalOpen] = useState(false);
    const [assignSFModalOpen, setAssignSFModalOpen] = useState(false);
    const [assignRSFModalOpen, setAssignRSFModalOpen] = useState(false);
    const [assignStudentsModalOpen, setAssignStudentsModalOpen] = useState(false);

    useEffect(() => {
        const fetchGroups = async (retries = 3) => {
            setGroupsLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/groups`
                );

                if (!response.ok) {
                    if (retries > 0 && response.status >= 500) {
                        console.log(`Retrying... ${retries} attempts left`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return fetchGroups(retries - 1);
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Groups fetched:', data);
                setExistingGroups(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error('Error fetching groups:', error);
                setExistingGroups([]);
                // Show error to user
                showNotification({
                    title: 'Connection Error',
                    message: 'Failed to load Thinkific groups',
                    color: 'red'
                });
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);
    // Fetch users when class is selected for details
    useEffect(() => {
        const fetchGroupUsers = async (groupId) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/groups/${groupId}/users`
                );
                const data = await response.json();
                setGroupUsers(prev => ({ ...prev, [groupId]: data }));
            } catch (error) {
                console.error('Error fetching group users:', error);
            }
        };

        if (selectedClass?.thinkificGroupId) {
            fetchGroupUsers(selectedClass.thinkificGroupId);
        }
    }, [selectedClass]);

    const handleCreate = async (values) => {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        setShowForm(false);
        fetchClasses();
    };

    return (
        <>
            <Box className="classter-container">
                <Group position="apart" mb="xl" className="smooth-transition">
                    <Text size="xl" weight={700} className="gradient-text">
                        {t('classManager.classManagement')}
                    </Text>
                    <Button
                        leftIcon={<IconPlus />}
                        onClick={() => setShowForm(true)}
                        className="hover-scale"
                        radius="xl"
                        variant="gradient"
                        gradient={{ from: '#662D91', to: '#00B0CA' }}
                    >
                        {t('classManager.newClass')}
                    </Button>
                </Group>

                <ClassForm
                    opened={showForm}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleCreate}
                    existingGroups={existingGroups}
                />

                <Paper withBorder radius="md" p="md" shadow="sm" className="smooth-shadow">
                    {loading ? (
                        <Loader size="lg" variant="dots" />
                    ) : (
                        <Box className="classter-table-wrapper">
                            <Table
                                className="classter-table"
                                highlightOnHover
                                verticalSpacing="sm"
                                horizontalSpacing="md"
                                fontSize="md"
                                striped
                                withBorder
                                withColumnBorders
                                style={{ minWidth: 1100 }}
                            >
                                <thead>
                                <tr>
                                    <th style={columnStyles[0]}>{t('classManager.type')}</th>
                                    <th style={columnStyles[1]}>{t('classManager.region')}</th>
                                    <th style={columnStyles[2]}>{t('classManager.courseCode')}</th>
                                    <th style={columnStyles[3]}>{t('classManager.month')}</th>
                                    <th style={columnStyles[4]}>{t('classManager.year')}</th>
                                    <th style={columnStyles[5]}>{t('classManager.thinkificGroup')}</th>
                                    <th style={columnStyles[6]}>{t('classManager.teacher')}</th>
                                    <th style={columnStyles[10]}>Coordinator</th>
                                    <th style={columnStyles[10]}>{t('classManager.rsf')}</th>
                                    <th style={columnStyles[7]}>{t('classManager.assignedCourses')}</th>
                                    <th style={columnStyles[8]}>{t('classManager.students')}</th>
                                    <th style={columnStyles[9]}>{t('classManager.actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {classes.map((cls) => {
                                    const group = existingGroups.find(
                                        (g) => g.id?.toString() === cls.thinkificGroupId?.toString()
                                    );
                                    return (
                                        <tr
                                            key={cls._id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => {
                                                if (!e.target.closest('button, a')) {
                                                    setSelectedClass(cls);
                                                    setDetailsModalOpen(true);
                                                }
                                            }}
                                        >
                                            <td>{cls.type}</td>
                                            <td>{cls.region || '-'}</td>
                                            <td>{cls.courseCode}</td>
                                            <td>{cls.month}</td>
                                            <td>{cls.year}</td>
                                            <td>
                                                {groupsLoading ? (
                                                    <Loader size="xs" />
                                                ) : group ? (
                                                    <Text size="sm" className="overflow-ellipsis">
                                                        {group.name || 'Unnamed Group'}
                                                    </Text>
                                                ) : (
                                                    <Text size="sm" color="orange">
                                                        Group not found
                                                    </Text>
                                                )}
                                            </td>
                                            <td>
                                                {cls.teacher ? (
                                                    <Group spacing={8} align="center" noWrap>
                                                        <Avatar
                                                            size={28}
                                                            radius="xl"
                                                            src={cls.teacher.avatarUrl}
                                                            alt={cls.teacher.firstName}
                                                        />
                                                        <Text size="sm" weight={500}>
                                                            {cls.teacher.firstName} {cls.teacher.lastName}
                                                        </Text>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" color="dimmed">
                                                        {t('classManager.na')}
                                                    </Text>
                                                )}
                                            </td>
                                            <td>
                                                {cls.coordinator ? (
                                                    <Group spacing={8} align="center" noWrap>
                                                        <Avatar size={28} radius="xl" src={cls.coordinator.avatarUrl} alt={cls.coordinator.firstName} />
                                                        <Text size="sm" weight={500}>
                                                            {cls.coordinator.firstName} {cls.coordinator.lastName}
                                                        </Text>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" color="dimmed">{t('classManager.na')}</Text>
                                                )}
                                            </td>
                                            <td>
                                                {cls.rsf?.[0] ? (
                                                    <Group spacing={8} noWrap>
                                                        <Avatar
                                                            size={28}
                                                            radius="xl"
                                                            src={cls.rsf[0].avatarUrl}
                                                            alt={cls.rsf[0].firstName}
                                                        />
                                                        <Text size="sm">
                                                            {cls.rsf[0].firstName} {cls.rsf[0].lastName}
                                                        </Text>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" color="dimmed">N/A</Text>
                                                )}
                                            </td>
                                            <td>
                                                {cls.courses?.length > 0 ? (
                                                    <Group spacing="xs">
                                                        {cls.courses.map((course, index) => (
                                                            <Badge key={index} variant="outline">
                                                                {course.name || course.thinkificCourseId}
                                                            </Badge>
                                                        ))}
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" color="dimmed">N/A</Text>
                                                )}
                                            </td>
                                            <td>
                                                <Text size="sm" color="dimmed">
                                                    {cls.studentCount }
                                                </Text>
                                            </td>
                                            <td>
                                                <Group spacing={4}>
                                                    <Tooltip label={t('common.edit')} position="bottom">
                                                        <ActionIcon
                                                            color="blue"
                                                            className="hover-scale"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedClass(cls);
                                                                setShowForm(true);
                                                            }}
                                                        >
                                                            <IconEdit size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('classManager.assignTeacher')} position="bottom">
                                                        <ActionIcon
                                                            color="indigo"
                                                            className="hover-scale"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedClass(cls);
                                                                setAssignModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUserPlus size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('classManager.assignCoordinator')} position="bottom">
                                                        <ActionIcon
                                                            color="teal"
                                                            className="hover-scale"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setSelectedClass(cls);
                                                                setAssignCoordinatorModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUsers size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('classManager.assignRSF')}>
                                                        <ActionIcon
                                                            color="teal"
                                                            onClick={() => {
                                                                setSelectedClass(cls);
                                                                setAssignRSFModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUserCheck />
                                                        </ActionIcon>
                                                    </Tooltip>

                                                    <Tooltip label={t('classManager.assignSF')}>
                                                        <ActionIcon
                                                            color="indigo"
                                                            onClick={() => {
                                                                setSelectedClass(cls);
                                                                setAssignSFModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUsers />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('classManager.assignStudents')}>
                                                        <ActionIcon
                                                            color="green"
                                                            onClick={() => {
                                                                setSelectedClass(cls);
                                                                setAssignStudentsModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUserPlus size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>

                                                    <Tooltip label="Assign Course" position="bottom">
                                                        <ActionIcon
                                                            color="orange"
                                                            className="hover-scale"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedClass(cls);
                                                                setCourseModalOpen(true);
                                                            }}
                                                        >
                                                            <IconBook size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </Table>
                        </Box>
                    )}
                </Paper>

                <Pagination
                    page={page}
                    onChange={fetchClasses}
                    total={Math.ceil(total / 10)}
                    mt="lg"
                    position="right"
                />
            </Box>

            <AssignTeacherModal
                opened={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                classObj={selectedClass}
                onAssigned={fetchClasses}
            />

            <CourseAssignmentModal
                classId={selectedClass?._id}
                opened={courseModalOpen}
                onClose={() => setCourseModalOpen(false)}
                onAssigned={fetchClasses}
            />

            <ClassDetailsModal
                opened={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                classData={selectedClass}
            />
            <AssignCoordinatorModal
                opened={assignCoordinatorModalOpen}
                onClose={() => setAssignCoordinatorModalOpen(false)}
                classObj={selectedClass}
                onAssigned={fetchClasses}
            />
            <AssignSFModal
                opened={assignSFModalOpen}
                onClose={() => setAssignSFModalOpen(false)}
                classObj={selectedClass}
                onAssigned={fetchClasses}
            />
            <AssignRSFModal
                opened={assignRSFModalOpen}
                onClose={() => setAssignRSFModalOpen(false)}
                classObj={selectedClass}
                onAssigned={fetchClasses}
            />
            <AssignStudentsModal
                opened={assignStudentsModalOpen}
                onClose={() => setAssignStudentsModalOpen(false)}
                classObj={selectedClass}
                onAssigned={fetchClasses}
            />
        </>
    );
};

export default ClassManager;
