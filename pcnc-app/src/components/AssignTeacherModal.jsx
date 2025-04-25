import { Modal, Select, Button, Loader, Group } from '@mantine/core';
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
        <Modal opened={opened} onClose={onClose} title="Assign Teacher" centered>
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
                />
            )}
            <Group position="right" mt="md">
                <Button onClick={handleAssign} loading={assigning} disabled={!selectedTeacher}>
                    Assign
                </Button>
            </Group>
        </Modal>
    );
};

export default AssignTeacherModal;
