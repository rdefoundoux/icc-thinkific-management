import { Button, Container, Text, Title, Box } from '@mantine/core';
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
                    padding: theme.spacing.xl * 2,
                    boxShadow: theme.shadows.md,
                    textAlign: 'center'
                })}
            >
                <Title order={1} color="green" mb="lg">
                    {t('registrationSuccess.title')}
                </Title>

                <Text size="lg" mb={40}>
                    {t('registrationSuccess.message')}
                </Text>

                <Button
                    onClick={() => navigate('/login')}
                    size="lg"
                    style={{
                        background: 'linear-gradient(135deg, #662D91, #00B0CA)',
                        color: '#ffffff',
                    }}
                >
                    {t('registrationSuccess.loginButton')}
                </Button>
            </Box>
        </Container>
    );
};

export default RegistrationSuccessPage;
