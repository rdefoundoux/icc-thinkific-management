import React, { useEffect, useState } from 'react';
import { Modal, MultiSelect, Button, Group, Stack, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const AssignStudentsToSFOrRSFModal = ({ opened, onClose, classObj, staffType, staffList, onAssigned }) => {
    // staffType: 'sf' or 'rsf'
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');

    useEffect(() => {
        if (classObj) {
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classObj._id}/students`)
                .then(res => res.json())
                .then(data => setStudents(data.students));
        }
    }, [classObj]);

    const handleAssign = async () => {
        if (!selectedStaff || selectedStudents.length === 0) return;

        // Select endpoint based on staffType
        const endpoint =
            staffType === 'sf'
                ? `/api/v1/users/${selectedStaff}/students`
                : `/api/v1/users/${selectedStaff}/studentsRsf`;

        await fetch(
            `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Required for cookies/auth
                body: JSON.stringify({
                    classId: classObj._id,
                    studentIds: selectedStudents
                })
            }
        );
        onAssigned && onAssigned();
        onClose();
    };


    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`${t('classManager.assignStudents')} ${staffType.toUpperCase()}`}
            size="md"
            centered
        >
            <Stack>
                <Select
                    data={staffList.map(staff => ({
                        value: staff._id,
                        label: `${staff.firstName} ${staff.lastName}`
                    }))}
                    value={selectedStaff}
                    onChange={setSelectedStaff}
                    label={staffType.toUpperCase()}
                    placeholder={`Select ${staffType.toUpperCase()}`}
                    required
                />
                <MultiSelect
                    data={students.map(s => ({
                        value: s._id,
                        label: `${s.firstName} ${s.lastName}`
                    }))}
                    value={selectedStudents}
                    onChange={setSelectedStudents}
                    label={t('classManager.students')}
                    placeholder={t('classManager.selectStudents')}
                    description={t('classManager.assignSelected')}
                    searchable
                    fullWidth
                />
                <Group position="right" mt="md">
                    <Button onClick={handleAssign} disabled={!selectedStaff || selectedStudents.length === 0}>
                        {t('common.assign')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default AssignStudentsToSFOrRSFModal;
