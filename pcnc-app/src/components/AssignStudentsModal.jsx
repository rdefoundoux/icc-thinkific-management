import React, { useEffect, useState } from 'react';
import { Modal, MultiSelect, Loader, Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconUsersPlus } from '@tabler/icons-react';

const AssignStudentsModal = ({ opened, onClose, classObj, onAssigned }) => {
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/users?roles=student`
                );
                const { data } = await response.json();
                setStudents(data);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        if (opened) fetchStudents();
    }, [opened]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classObj._id}/students`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userIds: selectedIds }),
                }
            );

            if (!response.ok) throw new Error(await response.text());

            onAssigned?.();
            onClose();
        } catch (error) {
            console.error('Assignment failed:', error);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t('classManager.assignStudents')}
            size="lg"
        >
            {loading ? (
                <Loader />
            ) : (
                <form onSubmit={handleSubmit}>
                    <MultiSelect
                        label={t('classManager.selectStudents')}
                        data={students.map(student => ({
                            value: student._id,
                            label: `${student.firstName} ${student.lastName} (${student.email})`,
                            description: student.roles.join(', ')
                        }))}
                        value={selectedIds}
                        onChange={setSelectedIds}
                        searchable
                        nothingFound={t('classManager.noStudentsFound')}
                        clearable
                    />
                    <Group position="right" mt="md">
                        <Button
                            type="submit"
                            leftIcon={<IconUsersPlus size={16} />}
                            disabled={!selectedIds.length}
                        >
                            {t('classManager.assignSelected')}
                        </Button>
                    </Group>
                </form>
            )}
        </Modal>
    );
};

export default AssignStudentsModal;
