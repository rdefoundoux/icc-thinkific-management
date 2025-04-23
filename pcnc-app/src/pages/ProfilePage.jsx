import React, { useEffect, useState } from "react";
import {
    Avatar,
    Card,
    Text,
    Title,
    Button,
    SimpleGrid,
    Group,
    Stack,
    Progress,
    Loader,
} from "@mantine/core";
import { IconMail, IconEdit, IconRefresh } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProfilePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);

    const fetchUserData = async () => {
        setLoading(true);
        setTimeout(() => {
            setUserData({
                enrollments: 12,
                completionPercentage: 89,
                learningStreak: 28,
                lastSyncAt: new Date().toLocaleString(),
            });
            setLoading(false);
        }, 1200);
    };

    useEffect(() => {
        if (user) fetchUserData();
    }, [user]);

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <SimpleGrid
            cols={3}
            spacing="xl"
            p="xl"
            breakpoints={[{ maxWidth: "md", cols: 1 }]}
        >
            <Card withBorder shadow="lg" p="xl" radius="md">
                <Stack align="center" spacing="sm">
                    <Avatar size={120} radius="xl" color="blue" mb="sm" />
                    <Title order={3}>{user.name}</Title>
                    <Text size="sm" color="dimmed">
                        <Group spacing="xs">
                            <IconMail size={16} />
                            {user.email}
                        </Group>
                    </Text>
                    <Button fullWidth variant="filled" radius="xl" my="md">
                        <IconEdit size={18} />
                        Manage Account
                    </Button>
                </Stack>
            </Card>
            <Card withBorder shadow="xl" p="xl" radius="md" style={{ gridColumn: "span 2" }}>
                <Title order={4} mb="lg">
                    Learning Progress
                </Title>
                {loading ? (
                    <Group position="center" p="xl">
                        <Loader color="blue" size="lg" />
                    </Group>
                ) : (
                    <SimpleGrid
                        cols={3}
                        spacing="xl"
                        breakpoints={[{ maxWidth: "sm", cols: 1 }]}
                    >
                        <StatCard label="Course Progress" value={`${userData?.completionPercentage}%`} color="blue">
                            <Progress value={userData?.completionPercentage} mt="xs" />
                        </StatCard>
                        <StatCard label="Active Courses" value={userData?.enrollments || 0} color="green" />
                        <StatCard
                            label="Learning Streak"
                            value={`${userData?.learningStreak || 0} days`}
                            color="orange"
                        />
                    </SimpleGrid>
                )}
                <Button
                    fullWidth
                    variant="light"
                    mt="lg"
                    leftIcon={<IconRefresh size={16} />}
                    onClick={fetchUserData}
                >
                    Refresh Data
                </Button>
            </Card>
        </SimpleGrid>
    );
};

const StatCard = ({ label, value, color, children }) => (
    <Card shadow="sm" radius="lg" padding="lg" withBorder>
        <Stack spacing={2}>
            <Text size="sm" color="dimmed">
                {label}
            </Text>
            <Text size={24} weight={600} color={color}>
                {value}
            </Text>
            {children}
        </Stack>
    </Card>
);

export default ProfilePage;
