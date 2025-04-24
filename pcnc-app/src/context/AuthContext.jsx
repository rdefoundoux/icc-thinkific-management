import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/profile`,
                    { credentials: 'include' }
                );
                if (response.ok) {
                    const userData = await response.json();
                    setUser({
                        ...userData,
                        name: `${userData.firstName} ${userData.lastName}`,
                    });
                }
            } catch (err) {
                console.error('Auth verification error:', err);
            } finally {
                setLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const login = (userData) => {
        setUser({
            ...userData,
            name: `${userData.firstName} ${userData.lastName}`,
        });
        navigate('/profile');
    };

    const logout = () => {
        setUser(null);
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
