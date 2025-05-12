import { useState, useEffect } from 'react';
import { Modal, Select, Loader, Button, Stack } from '@mantine/core';

export default function CourseAssignmentModal({ classId, opened, onClose, onAssigned }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        if (!opened) return;
        setLoading(true);
        fetch( `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/courses`)
            .then(res => res.json())
            .then(data => setCourses(data))
            .finally(() => setLoading(false));
    }, [opened]);

    const handleAssign = async () => {
        if (!selectedCourse) return;
        setAssigning(true);
        await fetch( `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classId}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: Number(selectedCourse)
            })
        });
        setAssigning(false);
        onAssigned && onAssigned();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Assign Thinkific Course" size={{ base: '100%', sm: 400 }} centered>
            <Stack>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <Select
                            label="Select course"
                            data={courses.map(c => ({
                                value: c.id.toString(),
                                label: c.name
                            }))}
                            value={selectedCourse}
                            onChange={setSelectedCourse}
                            searchable
                            nothingFound="No courses found"
                            fullWidth
                        />
                        <Button
                            mt="md"
                            disabled={!selectedCourse}
                            loading={assigning}
                            onClick={handleAssign}
                            fullWidth
                        >
                            Assign Course
                        </Button>
                    </>
                )}
            </Stack>
        </Modal>
    );
}
