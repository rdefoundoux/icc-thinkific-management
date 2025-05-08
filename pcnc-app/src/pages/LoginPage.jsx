import { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
    Text,
    Anchor,
    Divider,
    Box,
    Container,
    LoadingOverlay,
    Group,
    Select
} from '@mantine/core';
import { IconMail, IconLock } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n so we can call changeLanguage

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Handler for switching languages
    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials),
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            login(data.user);

            notifications.show({
                title: t('loginPage.welcomeBack'),
                message: `${t('loginPage.welcomeBack')} ${data.user.firstName}!`,
                color: 'pcncPurple',
            });
            navigate('/users');
        } catch (err) {
            notifications.show({
                title: t('loginPage.errorTitle'),
                message: err.message,
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
            }}
        >
            <Container
                size="lg"
                p="xl"
                style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}
            >
                {/* Left Panel */}
                <Box
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '12px',
                        background: 'linear-gradient(120deg, #161E3F, #00B0CA)',
                        color: '#ffffff',
                        padding: '2rem',
                        boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            animate={{
                                rotate: [0, 15, -15, 0],
                                transition: { repeat: Infinity, duration: 2 },
                            }}
                        >
                            <img
                                src="/src/assets/pcnc-logo.png"
                                alt="PCNC Logo"
                                style={{
                                    width: '180px',
                                    margin: '0 auto',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                }}
                            />
                        </motion.div>
                        <Text size="xl" weight={700} mt="md" style={{ lineHeight: 1.5 }}>
                            {t('loginPage.signInTitle')}
                        </Text>
                        <Text mt="sm" style={{ opacity: 0.9, color: '#d1d5db' }}>
                            PCNC Academy Portal
                        </Text>
                    </motion.div>
                </Box>

                {/* Login Form */}
                <Box
                    style={{
                        width: '100%',
                        maxWidth: '450px',
                        borderRadius: '12px',
                        background: '#fff',
                        boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.1)',
                        padding: '2rem',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Text size="xl" weight={700} align="center" mb="lg" color="pcncNavy.0">
                            {t('loginPage.signInTitle')}
                        </Text>

                        {/* Language Switcher */}
                        <Select
                            label={t('common.language')}
                            placeholder={t('common.selectLanguage')}
                            data={[
                                { value: 'en', label: 'English' },
                                { value: 'fr', label: 'Français' },
                                { value: 'de', label: 'Deutsch' },
                                { value: 'it', label: 'Italiano' },
                                { value: 'es', label: 'Español' },
                            ]}
                            onChange={handleLanguageChange}
                            mb="lg"
                        />

                        <LoadingOverlay
                            visible={loading}
                            overlayOpacity={0.5}
                            overlayColor="#fff"
                            transitionDuration={200}
                            style={{ position: 'absolute' }}
                        />

                        <form onSubmit={handleSubmit}>
                            <TextInput
                                label={t('loginPage.emailAddress')}
                                placeholder="your.email@example.com"
                                icon={<IconMail size={18} />}
                                value={credentials.email}
                                onChange={(e) =>
                                    setCredentials({ ...credentials, email: e.target.value })
                                }
                                radius="md"
                                size="md"
                                styles={{ input: { borderColor: '#e0e0e6' } }}
                                mb="md"
                                required
                            />

                            <PasswordInput
                                label={t('loginPage.password')}
                                placeholder="••••••••"
                                icon={<IconLock size={18} />}
                                value={credentials.password}
                                onChange={(e) =>
                                    setCredentials({ ...credentials, password: e.target.value })
                                }
                                radius="md"
                                size="md"
                                styles={{ input: { borderColor: '#e0e0e6' } }}
                                mb="xl"
                                required
                            />

                            <Button
                                type="submit"
                                fullWidth
                                radius="md"
                                size="lg"
                                style={{
                                    background: 'linear-gradient(135deg, #662D91, #00B0CA)',
                                    color: '#ffffff',
                                }}
                                component={motion.button}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {t('loginPage.signInTitle')}
                            </Button>
                        </form>

                        <Divider
                            label={`${t('common.or')} ${t('common.continueWith')}`}
                            labelPosition="center"
                            my="lg"
                            styles={{
                                label: { fontWeight: 500, color: '#6b7280' },
                            }}
                        />

                        <Button
                            variant="outline"
                            fullWidth
                            radius="md"
                            size="lg"
                            href={`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/thinkific`}
                            component="a"
                            styles={{
                                root: {
                                    borderColor: '#662D91',
                                    color: '#662D91',
                                    '&:hover': {
                                        backgroundColor: '#f5f6f9',
                                    },
                                },
                            }}
                        >
                            {t('loginPage.institutionalLogin')}
                        </Button>

                        <Group position="apart" mt="xl" style={{ padding: '0 12px' }}>
                            <Text size="sm" color="dimmed">
                                {t('loginPage.newHere')}{' '}
                                <Anchor fw={500} href="/signup" color="pcncPurple">
                                    {t('loginPage.createAccount')}
                                </Anchor>
                            </Text>
                            <Anchor href="/forgot-password" size="sm" color="pcncPurple">
                                {t('loginPage.forgotPassword')}
                            </Anchor>
                        </Group>
                    </motion.div>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;
