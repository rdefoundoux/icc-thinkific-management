import { Button, Container, Text, Title, Box, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RegistrationSuccessPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <Container size="sm" py={80}>
            <Box
                sx={(theme) => ({
                    backgroundColor: theme.white,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.xl,
                    boxShadow: theme.shadows.md,
                    textAlign: 'center',
                })}
            >
                <Title order={2} mb="md">
                    {t('registration.successTitle') || 'Registration Successful!'}
                </Title>
                <Text mb="lg" size="lg">
                    {t('registration.successMessage') || 'Thank you for registering. We have received your information.'}
                </Text>
                <Group position="center">
                    <Button
                        size="md"
                        variant="gradient"
                        gradient={{ from: '#662D91', to: '#00B0CA' }}
                        onClick={() => navigate('/')}
                    >
                        {t('registration.backToHome') || 'Back to Home'}
                    </Button>
                </Group>
            </Box>
        </Container>
    );
};

export default RegistrationSuccessPage;
