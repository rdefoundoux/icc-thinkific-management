import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
    Text,
    Title,
    Anchor,
    Box,
    Container,
    LoadingOverlay,
    Group,
    Select,
    Stack,
    Paper,
    useMantineTheme,
} from '@mantine/core';
import { IconMail, IconLock, IconKey } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useMediaQuery } from '@mantine/hooks';

const LoginPage = () => {
    const [step, setStep] = useState('login');
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleLanguageChange = (value) => i18n.changeLanguage(value);

    const buildNavItemsAndRedirect = (user) => {
        const navItems = [
            ...(user.roles?.includes('admin')
                ? [
                      { label: t('sidebar.dashboard'), to: '/admin-dashboard' },
                      { label: t('sidebar.classes'), to: '/classes' },
                      { label: t('sidebar.users'), to: '/users' },
                  ]
                : []),
            ...(user.roles?.includes('teacher')
                ? [{ label: t('sidebar.myClasses'), to: '/teacher-classes' }]
                : []),
            ...(user.roles?.includes('sf')
                ? [{ label: t('sidebar.myStudents_sf'), to: '/sf-dashboard' }]
                : []),
            ...(user.roles?.includes('coordinator')
                ? [{ label: t('sidebar.myStudents_coo'), to: '/co-dashboard' }]
                : []),
            { label: t('sidebar.settings'), to: '/profile' },
        ];
        navigate(navItems.length > 0 ? navItems[0].to : '/profile');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const emailNorm = credentials.email.trim().toLowerCase();
            const passwordNorm = credentials.password.trim();
            const otpNorm = otp.toString().trim();
            let body = {};

            if (step === 'login') {
                body = { email: emailNorm, password: passwordNorm };
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                        credentials: 'include',
                    },
                );

                if (response.status === 202) {
                    setStep('otp');
                    setEmailSent(true);
                    notifications.show({
                        title: t('loginPage.otpSentTitle'),
                        message: t('loginPage.otpSentMessage'),
                        color: 'pcncPurple',
                    });
                } else if (response.ok) {
                    const data = await response.json();
                    login(data.user);
                    buildNavItemsAndRedirect(data.user);
                    notifications.show({
                        title: `${t('loginPage.welcomeBack')} ${data.user.firstName}!`,
                        color: 'pcncTeal',
                    });
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || t('loginPage.errorTitle'));
                }
            } else if (step === 'otp') {
                body = {
                    email: emailNorm,
                    otp: otpNorm,
                    password: newPassword.trim(),
                };
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                        credentials: 'include',
                    },
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || t('loginPage.errorTitle'));
                }

                const data = await response.json();
                login(data.user);
                buildNavItemsAndRedirect(data.user);
                notifications.show({
                    title: `${t('loginPage.welcomeBack')} ${data.user.firstName}!`,
                    color: 'pcncTeal',
                });
            }
        } catch (err) {
            console.error(err);
            notifications.show({
                title: t('loginPage.errorTitle'),
                message: err.message || t('loginPage.errorTitle'),
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email }),
                    credentials: 'include',
                },
            );
            if (response.status === 202) {
                setEmailSent(true);
                notifications.show({
                    title: t('loginPage.otpSentTitle') || 'OTP Sent',
                    message:
                        t('loginPage.otpSentMessage') ||
                        'A new verification code has been sent.',
                    color: 'pcncPurple',
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to resend OTP');
            }
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
                background: `linear-gradient(135deg, ${theme.colors.pcncNavy[9]} 0%, ${theme.colors.pcncTeal[8]} 35%, ${theme.colors.pcncPurple[7]} 100%)`,
                padding: isMobile ? 16 : 32,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative ICC gradient blobs */}
            <Box
                style={{
                    position: 'absolute',
                    top: -120,
                    right: -120,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${'var(--mantine-color-pcncOrange-4)'}55 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }}
            />
            <Box
                style={{
                    position: 'absolute',
                    bottom: -160,
                    left: -160,
                    width: 480,
                    height: 480,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${'var(--mantine-color-pcncOrange-5)'}40 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }}
            />

            <Container size="lg" p={0} style={{ position: 'relative', zIndex: 1 }}>
                <Box
                    style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 24 : 48,
                        alignItems: 'stretch',
                    }}
                >
                    {/* Left Panel — Brand */}
                    <Box
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            padding: isMobile ? 16 : 32,
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{ maxWidth: 480 }}
                        >
                            <Box
                                style={{
                                    width: 88,
                                    height: 88,
                                    borderRadius: 22,
                                    background: `linear-gradient(135deg, ${'var(--mantine-color-pcncTeal-5)'} 0%, ${'var(--mantine-color-pcncPurple-5)'} 50%, ${'var(--mantine-color-pcncOrange-4)'} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: 32,
                                    boxShadow: '0 16px 40px rgba(132, 50, 232, 0.45)',
                                    marginBottom: 24,
                                }}
                            >
                                ICC
                            </Box>
                            <Text
                                size="sm"
                                fw={500}
                                tt="uppercase"
                                style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    letterSpacing: '0.2em',
                                    marginBottom: 8,
                                }}
                            >
                                ICC
                            </Text>
                            <Title
                                order={1}
                                style={{
                                    color: '#fff',
                                    fontSize: isMobile ? 28 : 40,
                                    fontWeight: 800,
                                    lineHeight: 1.15,
                                    marginBottom: 16,
                                }}
                            >
                                PCNC Corporate
                            </Title>
                            <Text size="lg" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                                {t('loginPage.adminPortal') || 'Portail de gestion — Impact Centre Chrétien'}
                            </Text>
                            <Box mt="xl">
                                <Stack gap="xs">
                                    {['Gestion des classes', 'Suivi des élèves', 'Intégration Thinkific & Zoom'].map((line) => (
                                        <Group key={line} gap="sm" wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 999,
                                                    backgroundColor: 'var(--mantine-color-pcncOrange-4)',
                                                }}
                                            />
                                            <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                                {line}
                                            </Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Right Panel — Form */}
                    <Paper
                        radius="lg"
                        p={isMobile ? 'lg' : 'xl'}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            maxWidth: 480,
                            position: 'relative',
                            backgroundColor: '#fff',
                            boxShadow: '0 24px 60px rgba(8, 32, 107, 0.3)',
                        }}
                    >
                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Title order={2} ta="center" mb="xs">
                                {t('loginPage.signInTitle')}
                            </Title>
                            <Text ta="center" c="dimmed" mb="lg" size="sm">
                                {t('loginPage.adminPortal') || 'Accédez à votre tableau de bord'}
                            </Text>

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
                                overlayProps={{ blur: 2, color: '#fff', backgroundOpacity: 0.6 }}
                                loaderProps={{ color: 'pcncTeal' }}
                            />

                            <form onSubmit={handleSubmit}>
                                <Stack gap="md">
                                    <TextInput
                                        label={t('loginPage.emailAddress')}
                                        placeholder="your.email@example.com"
                                        leftSection={<IconMail size={18} />}
                                        value={credentials.email}
                                        onChange={(e) =>
                                            setCredentials({
                                                ...credentials,
                                                email: e.target.value,
                                            })
                                        }
                                        size="md"
                                        required
                                        disabled={step === 'otp'}
                                    />

                                    {step === 'login' && (
                                        <PasswordInput
                                            label={t('loginPage.password')}
                                            placeholder="••••••••"
                                            leftSection={<IconLock size={18} />}
                                            value={credentials.password}
                                            onChange={(e) =>
                                                setCredentials({
                                                    ...credentials,
                                                    password: e.target.value,
                                                })
                                            }
                                            size="md"
                                            required
                                        />
                                    )}

                                    {step === 'otp' && (
                                        <>
                                            <TextInput
                                                label={t('loginPage.otpLabel') || 'Verification Code'}
                                                placeholder={
                                                    t('loginPage.otpPlaceholder') || 'Enter the code'
                                                }
                                                leftSection={<IconKey size={18} />}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.trim())}
                                                size="md"
                                                required
                                            />
                                            <PasswordInput
                                                label={t('loginPage.newPassword') || 'Set your password'}
                                                placeholder="••••••••"
                                                leftSection={<IconLock size={18} />}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                size="md"
                                                required
                                            />
                                            {emailSent && (
                                                <Text size="sm" c="dimmed">
                                                    {t('loginPage.otpSentMessage') ||
                                                        'A code was sent to your email.'}
                                                </Text>
                                            )}
                                            <Anchor
                                                component="button"
                                                type="button"
                                                size="sm"
                                                onClick={handleResendOTP}
                                            >
                                                {t('loginPage.resendOtp') || 'Resend code'}
                                            </Anchor>
                                        </>
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="lg"
                                        color="pcncTeal"
                                        mt="sm"
                                    >
                                        {step === 'login'
                                            ? t('loginPage.signInTitle')
                                            : t('loginPage.verifyOtp') || 'Verify & Set Password'}
                                    </Button>
                                </Stack>
                            </form>

                            <Group justify="space-between" mt="xl">
                                <Text size="sm" c="dimmed">
                                    {t('loginPage.newHere')}{' '}
                                    <Anchor fw={600} href="/signup">
                                        {t('loginPage.createAccount')}
                                    </Anchor>
                                </Text>
                                <Anchor href="/forgot-password" size="sm">
                                    {t('loginPage.forgotPassword')}
                                </Anchor>
                            </Group>
                        </motion.div>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;
