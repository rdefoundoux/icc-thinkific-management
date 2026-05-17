import { Button, Container, Text, Title, Box, Group, ThemeIcon, Stack, useMantineTheme } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RegistrationSuccessPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useMantineTheme();

    return (
        <Box
            style={{
                minHeight: '100vh',
                background: `linear-gradient(135deg, ${'var(--mantine-color-pcncTeal-0)'} 0%, ${'var(--mantine-color-pcncPurple-0)'} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            <Container size="sm">
                <Box
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 16,
                        padding: 48,
                        boxShadow: '0 16px 40px rgba(8, 32, 107, 0.15)',
                        textAlign: 'center',
                    }}
                >
                    <Stack align="center" gap="md">
                        <ThemeIcon size={80} radius="xl" color="pcncGreen" variant="light">
                            <IconCheck size={44} />
                        </ThemeIcon>
                        <Title order={2}>
                            {t('registration.successTitle') || 'Registration Successful!'}
                        </Title>
                        <Text size="lg" c="dimmed" maw={420}>
                            {t('registration.successMessage') ||
                                'Thank you for registering. We have received your information.'}
                        </Text>
                        <Group justify="center" mt="md">
                            <Button size="md" color="pcncTeal" onClick={() => navigate('/')}>
                                {t('registration.backToHome') || 'Back to Home'}
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};

export default RegistrationSuccessPage;
