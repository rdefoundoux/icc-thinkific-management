import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MantineProvider, Flex, LoadingOverlay } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import DashboardLayout from './layouts/DashboardLayout';
import ClassManager from './pages/ClassManager';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import ThinkificManager from './components/ThinkificManager';
import ThinkificAuth from './auth/ThinkificAuth';
import ProfilePage from './pages/ProfilePage';
import UserManagement from './pages/UserManagement';
import './index.css';

const App = () => {
    return (
        <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />

                <Route path="/registration-success" element={<RegistrationSuccessPage />} />
                <Route path="/callback" element={<ThinkificAuth />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<ClassManager />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="teacher" element={<TeacherDashboard />} />
                        <Route path="student" element={<StudentPortal />} />
                        <Route path="thinkific" element={<ThinkificManager />} />
                        <Route path="classes" element={<ClassManager/>} />
                    </Route>
                </Route>

                {/* Redirect home to registration */}
                <Route path="/" element={<Navigate to="/register" replace />} />
                <Route path="*" element={<Navigate to="/register" replace />} />
            </Routes>
        </MantineProvider>
    );
};

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    if (loading) {
        return (
            <Flex h="100vh" align="center" justify="center">
                <LoadingOverlay visible zIndex={1000} />
            </Flex>
        );
    }

    return user ? (
        <Outlet />
    ) : (
        <Navigate
            to="/login"
            state={{ from: location.pathname !== '/login' ? location : '/' }}
            replace
        />
    );
};

export default App;
