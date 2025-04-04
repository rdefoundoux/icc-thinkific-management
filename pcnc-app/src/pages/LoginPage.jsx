import { Button, Container } from '@mantine/core';

const LoginPage = () => {
    return (
        <Container size="xs" py="xl">
            <Button
                component="a"
                href={`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/thinkific`}
                fullWidth
                size="lg"
                style={{
                    backgroundColor: '#2C3E50',
                    '&:hover': { backgroundColor: '#1A2A3A' }
                }}
            >
                Continue with Thinkific
            </Button>
        </Container>
    );
};

export default LoginPage;
