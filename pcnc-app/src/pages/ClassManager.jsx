import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Group,
    Text,
    Loader,
    ActionIcon,
    Tooltip,
    Pagination,
    Box,
    Paper,
    Avatar
} from '@mantine/core';
import { IconPlus, IconEdit, IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import ClassForm from '../components/ClassForm';
import useClasses from '../hooks/useClasses';
import AssignTeacherModal from '../components/AssignTeacherModal';

const columnStyles = [
    { minWidth: 90 },   // Type
    { minWidth: 110 },  // Region
    { minWidth: 120 },  // Course Code
    { minWidth: 90 },   // Month
    { minWidth: 70 },   // Year
    { minWidth: 220 },  // Thinkific Group
    { minWidth: 180 },  // Teacher
    { minWidth: 130 },  // Actions
];

const ClassManager = () => {
    const [showForm, setShowForm] = useState(false);
    const [existingGroups, setExistingGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const { classes, loading, page, total, fetchClasses } = useClasses();
    const { t } = useTranslation();
    const [selectedClass, setSelectedClass] = useState(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            setGroupsLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/groups`
                );
                if (!response.ok) throw new Error('Failed to fetch groups');
                const data = await response.json();
                setExistingGroups(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setExistingGroups([]);
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);

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
                {/* Heading and action bar */}
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

                {/* Form Modal */}
                <ClassForm
                    opened={showForm}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleCreate}
                    existingGroups={existingGroups}
                />

                {/* Main content area */}
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
                                style={{ minWidth: 950 }}
                            >
                                <caption>{t('classManager.classList') || 'Class List'}</caption>
                                <thead>
                                <tr>
                                    <th style={columnStyles[0]}>{t('classManager.type')}</th>
                                    <th style={columnStyles[1]}>{t('classManager.region')}</th>
                                    <th style={columnStyles[2]}>{t('classManager.courseCode')}</th>
                                    <th style={columnStyles[3]}>{t('classManager.month')}</th>
                                    <th style={columnStyles[4]}>{t('classManager.year')}</th>
                                    <th style={columnStyles[5]}>{t('classManager.thinkificGroup')}</th>
                                    <th style={columnStyles[6]}>{t('classManager.teacher')}</th>
                                    <th style={columnStyles[7]}>{t('classManager.actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {classes.map((cls) => {
                                    // Ensure both IDs are compared as strings
                                    const group = existingGroups.find(
                                        (g) => g.id?.toString() === cls.thinkificGroupId?.toString()
                                    );
                                    return (
                                        <tr key={cls._id}>
                                            <td>{cls.type}</td>
                                            <td>{cls.region || '—'}</td>
                                            <td>{cls.courseCode}</td>
                                            <td>{cls.month}</td>
                                            <td>{cls.year}</td>
                                            <td>
                                                {groupsLoading ? (
                                                    <Loader size="xs" />
                                                ) : group ? (
                                                    <Text size="sm" className="overflow-ellipsis">
                                                        {group.name}
                                                    </Text>
                                                ) : (
                                                    <Text size="sm" color="dimmed">
                                                        {t('classManager.na')}
                                                    </Text>
                                                )}
                                            </td>
                                            <td>
                                                {cls.teacher ? (
                                                    <Group spacing={8} align="center" noWrap>
                                                        <Avatar
                                                            size={28}
                                                            radius="xl"
                                                            src={cls.teacher.avatarUrl || undefined}
                                                            alt={cls.teacher.firstName}
                                                        />
                                                        <Text size="sm" weight={500}>
                                                            {cls.teacher.firstName} {cls.teacher.lastName}
                                                        </Text>
                                                        <span className="role-pill" data-role="teacher">
                                                            {t('classManager.teacher')}
                                                        </span>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" color="dimmed">
                                                        {t('classManager.na')}
                                                    </Text>
                                                )}
                                            </td>
                                            <td>
                                                <Group spacing={4}>
                                                    <Tooltip label={t('common.edit')} position="bottom">
                                                        <ActionIcon color="blue" className="hover-scale">
                                                            <IconEdit size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('userMenu.myProfile')} position="bottom">
                                                        <ActionIcon color="green" className="hover-scale">
                                                            <IconUsers size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label={t('classManager.assignTeacher') || 'Assign Teacher'} position="bottom">
                                                        <ActionIcon
                                                            color="indigo"
                                                            className="hover-scale"
                                                            onClick={() => {
                                                                setSelectedClass(cls);
                                                                setAssignModalOpen(true);
                                                            }}
                                                        >
                                                            <IconUserPlus size={18} />
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

                {/* Pagination */}
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
        </>
    );
};

export default ClassManager;
