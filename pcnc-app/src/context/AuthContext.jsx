import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifySession = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/profile`,
                    { credentials: 'include' }
                );
                const userData = await response.json();
                if (!response.ok) throw new Error(userData.error);
                setUser(userData);
            } catch (err) {
                console.error('Session verification failed:', err);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const login = (userData) => {
        setUser(userData);
        navigate('/');
    };

    const logout = async () => {
        await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/logout`,
            { credentials: 'include' }
        );
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
