import React, { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Title,
    Text,
    Alert,
    Card,
    Stack,
    Group,
    List,
    ThemeIcon,
    useMantineTheme,
} from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconUsers, IconBuildingChurch } from '@tabler/icons-react';

const ElvantoIntegration = () => {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const theme = useMantineTheme();

    const API_BASE =
        import.meta.env.VITE_API_BASE_URL + '/api/v1' ||
        'https://pcnc.tail30380e.ts.net/api/v1';

    const fetchElvantoPeople = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(`${API_BASE}/elvanto/init`, {
                withCredentials: true,
            });

            setPeople(response.data.people);
            setAuthChecked(true);
        } catch (err) {
            if (err.response?.status === 401) {
                window.location.href = err.response.data.authUrl;
            } else {
                setError(err.response?.data?.error || 'Failed to fetch Elvanto data');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Group mb="lg" align="center" gap="md">
                <ThemeIcon size={44} radius="md" variant="light" color="pcncPurple">
                    <IconBuildingChurch size={24} />
                </ThemeIcon>
                <Box>
                    <Title order={1}>Intégration Elvanto</Title>
                    <Text c="dimmed" size="sm">
                        Synchronisation des contacts depuis Elvanto
                    </Text>
                </Box>
            </Group>

            <Card padding="xl">
                <Stack gap="md">
                    <Button
                        onClick={fetchElvantoPeople}
                        loading={loading}
                        leftSection={<IconRefresh size={16} />}
                        color="pcncTeal"
                        size="md"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        {loading ? 'Chargement…' : 'Récupérer les contacts Elvanto'}
                    </Button>

                    {error && (
                        <Alert
                            color="red"
                            icon={<IconAlertTriangle size={18} />}
                            title="Erreur"
                            withCloseButton
                            onClose={() => setError('')}
                        >
                            {error}
                            <Group mt="xs">
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    onClick={() => window.location.reload()}
                                >
                                    Réessayer
                                </Button>
                            </Group>
                        </Alert>
                    )}

                    {people.length > 0 ? (
                        <Box>
                            <Group gap="xs" mb="sm">
                                <IconUsers size={18} color={theme.colors.pcncTeal[6]} />
                                <Text fw={600}>{people.length} contact(s)</Text>
                            </Group>
                            <List spacing="xs" size="sm">
                                {people.map((person) => (
                                    <List.Item key={person.id}>
                                        <Text component="span" fw={500}>
                                            {person.firstname} {person.lastname}
                                        </Text>{' '}
                                        — <Text component="span" c="dimmed">{person.email}</Text>
                                    </List.Item>
                                ))}
                            </List>
                        </Box>
                    ) : (
                        authChecked && !loading && !error && (
                            <Text c="dimmed" size="sm">
                                Aucune donnée. Cliquez sur le bouton pour charger.
                            </Text>
                        )
                    )}
                </Stack>
            </Card>
        </Box>
    );
};

export default ElvantoIntegration;
