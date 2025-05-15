import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
    Text,
    Anchor,
    Box,
    Container,
    LoadingOverlay,
    Group,
    Select
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
    const [step, setStep] = useState('login'); // 'login' | 'otp'
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
    };

    // Handle the initial login or OTP verification
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (step === 'login') {
                // Step 1: Try password login or trigger OTP
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(credentials),
                        credentials: 'include',
                    }
                );

                if (response.status === 202) {
                    // OTP required
                    setStep('otp');
                    setEmailSent(true);
                    notifications.show({
                        title: t('loginPage.otpSentTitle') || 'OTP Sent',
                        message: t('loginPage.otpSentMessage') || 'A verification code has been sent to your email.',
                        color: 'pcncPurple',
                    });
                } else if (response.ok) {
                    // Password login success
                    const data = await response.json();
                    login(data.user);

                    notifications.show({
                        title: t('loginPage.welcomeBack'),
                        message: `${t('loginPage.welcomeBack')} ${data.user.firstName}!`,
                        color: 'pcncPurple',
                    });
                    navigate('/users');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Login failed');
                }
            } else if (step === 'otp') {
                // Step 2: Submit OTP + new password
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: credentials.email,
                            otp,
                            password: newPassword,
                        }),
                        credentials: 'include',
                    }
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'OTP verification failed');
                }
                const data = await response.json();
                login(data.user);

                notifications.show({
                    title: t('loginPage.welcomeBack'),
                    message: `${t('loginPage.welcomeBack')} ${data.user.firstName}!`,
                    color: 'pcncPurple',
                });
                navigate('/users');
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

    // Resend OTP handler
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
                }
            );
            if (response.status === 202) {
                setEmailSent(true);
                notifications.show({
                    title: t('loginPage.otpSentTitle') || 'OTP Sent',
                    message: t('loginPage.otpSentMessage') || 'A new verification code has been sent.',
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
                background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
            }}
        >
            <Container
                size="lg"
                p="xl"
                style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    gap: '2rem'
                }}
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
                        marginBottom: isMobile ? '2rem' : 0,
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
                                src="/pcnc-logo.png"
                                alt="PCNC Logo"
                                style={{
                                    width: '180px',
                                    margin: '0 auto',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                }}
                            />
                        </motion.div>
                        <Text size="xl" fw={700} mt="md" style={{ lineHeight: 1.5 }}>
                            {t('loginPage.signInTitle')}
                        </Text>
                        <Text mt="sm" style={{ opacity: 0.9, color: '#d1d5db' }}>
                            {t('loginPage.adminPortal')}
                        </Text>
                    </motion.div>
                </Box>

                {/* Login/OTP Form */}
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
                        <Text size="xl" fw={700} align="center" mb="lg" color="pcncNavy.0">
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
                                disabled={step === 'otp'}
                            />

                            {step === 'login' && (
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
                            )}

                            {step === 'otp' && (
                                <>
                                    <TextInput
                                        label={t('loginPage.otpLabel') || 'Verification Code'}
                                        placeholder={t('loginPage.otpPlaceholder') || 'Enter the code'}
                                        icon={<IconKey size={18} />}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        radius="md"
                                        size="md"
                                        mb="md"
                                        required
                                    />
                                    <PasswordInput
                                        label={t('loginPage.newPassword') || 'Set your password'}
                                        placeholder="••••••••"
                                        icon={<IconLock size={18} />}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        radius="md"
                                        size="md"
                                        mb="xl"
                                        required
                                    />
                                    {emailSent && (
                                        <Text size="sm" color="dimmed" mb="sm">
                                            {t('loginPage.otpSentMessage') || 'A code was sent to your email.'}
                                        </Text>
                                    )}
                                    <Button
                                        variant="subtle"
                                        size="xs"
                                        onClick={handleResendOTP}
                                        mb="md"
                                        type="button"
                                    >
                                        {t('loginPage.resendOtp') || 'Resend code'}
                                    </Button>
                                </>
                            )}

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
                                {step === 'login'
                                    ? t('loginPage.signInTitle')
                                    : t('loginPage.verifyOtp') || 'Verify & Set Password'}
                            </Button>
                        </form>

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
