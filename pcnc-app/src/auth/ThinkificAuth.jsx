// frontend/src/auth/ThinkificAuth.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';

const ThinkificAuth = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/profile`,
                    { credentials: 'include' }
                );

                if (!response.ok) throw new Error('Authentication verification failed');

                const userData = await response.json();
                login(userData);
                navigate('/');
            } catch (err) {
                notifications.show({
                    title: 'Session Error',
                    message: err.message,
                    color: 'red'
                });
                navigate('/login');
            }
        };

        verifyAuth();
    }, []);

    return null; // Empty component while processing
};

export default ThinkificAuth;
