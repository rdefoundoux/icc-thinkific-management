import { Modal, Group, Text, Avatar, List, Title, Badge, Loader } from '@mantine/core';
import { useEffect, useState } from 'react';

export default function ClassDetailsModal({ opened, onClose, classData }) {
    const [users, setUsers] = useState([]);
    // Safe data extraction with defaults
    const thinkificGroup = classData?.thinkificGroup || {};
    const students = classData?.students || [];
    const staff = {
        teacher: classData?.teacher || null,
        coordinator: classData?.coordinator || null,
        rsf: classData?.rsf || [],
        sf: classData?.sf || []
    };
    useEffect(() => {
        const fetchUsers = async () => {
            if (classData?.thinkificGroupId) {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/groups/${classData.thinkificGroupId}/users`
                    );
                    setUsers(await response.json());
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }
        };

        if (opened) fetchUsers();
    }, [opened, classData?.thinkificGroupId]);
    return (
        <Modal opened={opened} onClose={onClose} size="lg" title="Class Details">
            {!classData ? (
                <Loader />
            ) : (
                <>
                    {/* Basic Info Section */}
                    <Group mb="md" grow>
                        <div>
                            <Text weight={500}>Thinkific Group:</Text>
                            <Text>{thinkificGroup.name || 'N/A'}</Text>
                        </div>
                        <div>
                            <Text weight={500}>Student Count:</Text>
                            <Text>{students.length}</Text>
                        </div>
                    </Group>

                    {/* Staff Section */}
                    <Title order={4} mb="sm">Staff Members</Title>
                    <Group mb="md" grow>
                        <div>
                            <Text weight={500}>Teacher:</Text>
                            {staff.teacher ? (
                                <Group spacing="xs">
                                    <Avatar src={staff.teacher.avatarUrl} size="sm" />
                                    <Text>{staff.teacher.firstName} {staff.teacher.lastName}</Text>
                                </Group>
                            ) : <Text>N/A</Text>}
                        </div>

                        <div>
                            <Text weight={500}>Coordinator:</Text>
                            {staff.coordinator ? (
                                <Group spacing="xs">
                                    <Avatar src={staff.coordinator.avatarUrl} size="sm" />
                                    <Text>{staff.coordinator.firstName} {staff.coordinator.lastName}</Text>
                                </Group>
                            ) : <Text>N/A</Text>}
                        </div>
                    </Group>

                    {/* Support Staff Section */}
                    <Group mb="md" grow>
                        <div>
                            <Text weight={500}>RSFs ({staff.rsf.length}):</Text>
                            {staff.rsf.map((rsf, i) => (
                                <Badge key={i} color="blue" variant="light" mr={4}>
                                    {rsf.firstName} {rsf.lastName}
                                </Badge>
                            ))}
                        </div>

                        <div>
                            <Text weight={500}>SFs ({staff.sf.length}):</Text>
                            {staff.sf.map((sf, i) => (
                                <Badge key={i} color="grape" variant="light" mr={4}>
                                    {sf.firstName} {sf.lastName}
                                </Badge>
                            ))}
                        </div>
                    </Group>

                    {/* Students Section */}
                    <Title order={4} mb="sm">Students ({users.length})</Title>
                    <List>
                        {users.map((user, index) => (
                            <List.Item key={index}>
                                <Group spacing="xs">
                                    <Avatar size="sm" radius="xl">
                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                    </Avatar>
                                    <Text>{user.firstName} {user.lastName}</Text>
                                </Group>
                            </List.Item>
                        ))}
                    </List>
                </>
            )}
        </Modal>
    );
}
