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
    Box,
    useMantineTheme,
} from "@mantine/core";
import { IconMail, IconEdit, IconRefresh } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";

const ProfilePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const theme = useMantineTheme();
    const isMobile = useMediaQuery("(max-width: 768px)");

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

    if (!user) return <Navigate to="/login" />;

    const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.name || user.email;

    return (
        <Box>
            <Title order={1} mb="lg">Mon profil</Title>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
                <Card padding="xl">
                    <Stack align="center" gap="sm">
                        <Avatar
                            size={120}
                            radius="xl"
                            color="iccBlue"
                            style={{
                                background: `linear-gradient(135deg, ${theme.colors.iccBlue[5]} 0%, ${theme.colors.iccPurple[5]} 100%)`,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 36,
                            }}
                        >
                            {initials || "?"}
                        </Avatar>
                        <Title order={3} ta="center">{displayName}</Title>
                        <Group gap="xs" c="dimmed">
                            <IconMail size={16} />
                            <Text size="sm">{user.email}</Text>
                        </Group>
                        <Button fullWidth color="iccBlue" leftSection={<IconEdit size={18} />} my="md">
                            Gérer mon compte
                        </Button>
                    </Stack>
                </Card>

                <Card padding="xl" style={{ gridColumn: isMobile ? undefined : "span 2" }}>
                    <Title order={4} mb="lg">Progression d'apprentissage</Title>
                    {loading ? (
                        <Group justify="center" p="xl">
                            <Loader color="iccBlue" size="lg" />
                        </Group>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                            <StatCard
                                label="Avancement"
                                value={`${userData?.completionPercentage}%`}
                                color={theme.colors.iccBlue[7]}
                            >
                                <Progress
                                    value={userData?.completionPercentage}
                                    mt="xs"
                                    color="iccBlue"
                                />
                            </StatCard>
                            <StatCard
                                label="Cours actifs"
                                value={userData?.enrollments || 0}
                                color={theme.colors.iccGreen[7]}
                            />
                            <StatCard
                                label="Série d'apprentissage"
                                value={`${userData?.learningStreak || 0} jours`}
                                color={theme.colors.iccGold[7]}
                            />
                        </SimpleGrid>
                    )}
                    <Button
                        fullWidth
                        variant="light"
                        color="iccBlue"
                        mt="lg"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchUserData}
                    >
                        Rafraîchir
                    </Button>
                </Card>
            </SimpleGrid>
        </Box>
    );
};

const StatCard = ({ label, value, color, children }) => (
    <Card padding="lg">
        <Stack gap={4}>
            <Text size="sm" c="dimmed" fw={500}>
                {label}
            </Text>
            <Text size="28px" fw={700} style={{ color }}>
                {value}
            </Text>
            {children}
        </Stack>
    </Card>
);

export default ProfilePage;
