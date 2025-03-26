// frontend/src/pages/LoginPage.jsx
import { Button, Container } from '@mantine/core';
import { useEffect } from 'react';

const LoginPage = () => {
    // Environment variables
    const subdomain = import.meta.env.VITE_THINKIFIC_SUBDOMAIN;
    const clientId = import.meta.env.VITE_THINKIFIC_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;

    // Properly encoded OAuth URL
    const thinkificAuthUrl = new URL(`https://${subdomain}.thinkific.com/oauth2/authorize`);
    thinkificAuthUrl.searchParams.append('client_id', clientId);
    thinkificAuthUrl.searchParams.append('redirect_uri', redirectUri);
    thinkificAuthUrl.searchParams.append('response_type', 'code');
    thinkificAuthUrl.searchParams.append('state', window.crypto.randomUUID()); // Security: Add CSRF protection

    // Optional: Cleanup any existing auth states on component mount
    useEffect(() => {
        localStorage.removeItem('thinkific_token');
    }, []);

    return (
        <Container size="xs" py="xl">
            <Button
                component="a"
                href={thinkificAuthUrl.toString()}
                fullWidth
                size="lg"
                style={{
                    backgroundColor: '#2C3E50', // Thinkific brand color
                    '&:hover': { backgroundColor: '#1A2A3A' }
                }}
            >
                Continue with Thinkific
            </Button>
        </Container>
    );
};

export default LoginPage;
