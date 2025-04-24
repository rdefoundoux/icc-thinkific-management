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
    Paper
} from '@mantine/core';
import { IconPlus, IconEdit, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import ClassForm from '../components/ClassForm';
import useClasses from '../hooks/useClasses';

const ClassManager = () => {
    const [showForm, setShowForm] = useState(false);
    const [existingGroups, setExistingGroups] = useState([]);
    const { classes, loading, page, total, fetchClasses } = useClasses();
    const { t } = useTranslation();

    // Fetch groups on mount
    useEffect(() => {
        const fetchGroups = async () => {
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
        <Box className="classter-container">
            {/* Heading and action bar */}
            <Group position="apart" mb="xl" className="smooth-transition">
                <Text size="xl" weight={700} color="pcncNavy.0">
                    {t('classManager.classManagement')}
                </Text>
                <Button
                    leftIcon={<IconPlus />}
                    onClick={() => setShowForm(true)}
                    className="hover-scale"
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
            <Paper withBorder radius="md" p="md" shadow="sm">
                {loading ? (
                    <Loader size="lg" variant="dots" />
                ) : (
                    <Table highlightOnHover className="classter-table smooth-transition">
                        <thead>
                        <tr>
                            <th>{t('classManager.type')}</th>
                            <th>{t('classManager.region')}</th>
                            <th>{t('classManager.courseCode')}</th>
                            <th>{t('classManager.month')}</th>
                            <th>{t('classManager.year')}</th>
                            <th>{t('classManager.thinkificGroup')}</th>
                            <th>{t('classManager.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {classes.map((cls) => {
                            const group = existingGroups.find(
                                (g) => g.id === cls.thinkificGroupId
                            );
                            return (
                                <tr key={cls._id}>
                                    <td>{cls.type}</td>
                                    <td>{cls.region || '—'}</td>
                                    <td>{cls.courseCode}</td>
                                    <td>{cls.month}</td>
                                    <td>{cls.year}</td>
                                    <td>
                                        {group ? (
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
                                        <Group spacing={4}>
                                            <Tooltip label={t('common.edit')} position="bottom">
                                                <ActionIcon color="blue" className="hover-scale">
                                                    <IconEdit size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip
                                                label={t('userMenu.myProfile')}
                                                position="bottom"
                                            >
                                                <ActionIcon color="green" className="hover-scale">
                                                    <IconUsers size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </Table>
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
    );
};

export default ClassManager;
