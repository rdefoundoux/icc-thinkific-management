// frontend/src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Title, Text, Card, Skeleton } from '@mantine/core';
import axios from 'axios';

const ProfilePage = () => {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(`${apiBase}/api/v1/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
            } catch (error) {
                console.error('Profile fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchProfile();
    }, [user]);

    if (loading) {
        return (
            <Card padding="lg" radius="md" withBorder>
                <Skeleton height={100} circle mb="xl" />
                <Skeleton height={20} width="40%" mb="sm" />
                <Skeleton height={16} width="60%" mb="sm" />
                <Skeleton height={16} width="55%" />
            </Card>
        );
    }

    return (
        <Card padding="lg" radius="md" withBorder>
            <div style={{ textAlign: 'center' }}>
                <Avatar
                    src={profile?.avatarUrl}
                    size="xl"
                    radius="50%"
                    mb="md"
                />
                <Title order={3} mb="sm">
                    {profile?.name || 'Anonymous User'}
                </Title>

                <Text size="sm" c="dimmed" mb="xl">
                    {profile?.email}
                </Text>

                <div style={{ textAlign: 'left' }}>
                    <Text mb="sm"><strong>Role:</strong> {profile?.role}</Text>
                    <Text mb="sm">
                        <strong>Last Synced:</strong> {new Date(profile?.lastSyncedAt).toLocaleString()}
                    </Text>

                    {profile?.courses?.length > 0 && (
                        <div>
                            <Text size="lg" mb="sm">Course Enrollments</Text>
                            {profile.courses.map(course => (
                                <Text key={course.courseId} mb="xs">
                                    {course.courseId} - {course.status}
                                </Text>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProfilePage;
