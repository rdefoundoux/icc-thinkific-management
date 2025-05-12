import { Modal, Select, Button, Loader, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import useTeachers from '../hooks/useTeachers';
import { notifications } from '@mantine/notifications';

const AssignTeacherModal = ({ opened, onClose, classObj, onAssigned }) => {
    const { teachers, loading } = useTeachers();
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [assigning, setAssigning] = useState(false);

    const handleAssign = async () => {
        setAssigning(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classObj._id}/roles`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ userId: selectedTeacher, role: 'teacher' }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Assignment failed');
            notifications.show({
                title: 'Teacher Assigned',
                message: 'Teacher successfully assigned to class.',
                color: 'green',
            });
            onAssigned && onAssigned();
            onClose();
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: err.message,
                color: 'red',
            });
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Assign Teacher"
            size={{ base: '100%', sm: 400 }}
            centered
        >
            <Stack>
                {loading ? (
                    <Loader />
                ) : (
                    <Select
                        label="Select Teacher"
                        placeholder="Choose a teacher"
                        data={teachers.map(t => ({
                            value: t._id,
                            label: `${t.firstName} ${t.lastName} (${t.email})`,
                        }))}
                        value={selectedTeacher}
                        onChange={setSelectedTeacher}
                        searchable
                        fullWidth
                    />
                )}
                <Group position="right" mt="md" grow>
                    <Button onClick={handleAssign} loading={assigning} disabled={!selectedTeacher} fullWidth>
                        Assign
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default AssignTeacherModal;
