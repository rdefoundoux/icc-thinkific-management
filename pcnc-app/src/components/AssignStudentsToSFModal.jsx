import React, { useEffect, useState } from 'react';
import { Modal, MultiSelect, Button, Group } from '@mantine/core';

const AssignStudentsToSFModal = ({ sf, classObj, onClose }) => {
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        const fetchStudents = async () => {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classObj?._id}/students`
            );
            const { students } = await response.json();
            setStudents(students);
        };

        if (classObj) fetchStudents();
    }, [classObj]);

    const handleAssign = async () => {
        await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${sf._id}/students`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: classObj._id,
                    studentIds: selected
                })
            }
        );
        onClose();
    };

    return (
        <Modal opened={!!sf} onClose={onClose} title="Assign Students">
            <MultiSelect
                data={students.map(s => ({
                    value: s._id,
                    label: `${s.firstName} ${s.lastName}`
                }))}
                value={selected}
                onChange={setSelected}
            />
            <Group position="right" mt="md">
                <Button onClick={handleAssign}>Save</Button>
            </Group>
        </Modal>
    );
};

export default AssignStudentsToSFModal;
