// frontend/src/auth/ThinkificAuth.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const ThinkificAuth = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (!code) {
                notifications.show({
                    title: 'Authentication Error',
                    message: 'No authorization code found',
                    color: 'red'
                });
                navigate('/login');
                return;
            }

            try {
                const response = await axios.post(`${apiBase}/api/v1/auth/thinkific`, { code });

                login({
                    token: response.data.token,
                    user: response.data.user
                });

                notifications.show({
                    title: 'Login Successful',
                    message: 'Welcome back!',
                    color: 'green'
                });

                navigate('/');

            } catch (error) {
                notifications.show({
                    title: 'Login Failed',
                    message: error.response?.data?.error || 'Authentication error',
                    color: 'red'
                });
                navigate('/login');
            }
        };

        handleOAuthCallback();
    }, []);

    return null;
};

export default ThinkificAuth;
