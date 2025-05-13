import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Flex, LoadingOverlay } from '@mantine/core'; // REMOVE MantineProvider
import { useTranslation } from 'react-i18next';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import DashboardLayout from './layouts/DashboardLayout';
import ClassManager from './pages/ClassManager';
import ThinkificAuth from './auth/ThinkificAuth';
import ProfilePage from './pages/ProfilePage';
import UserManagement from './pages/UserManagement';
import TeacherClasses from './pages/TeacherClasses';
import SfDashboard from './pages/SfDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import ParentAuthorizationPage from './pages/ParentAuthorizationPage';
import ElvantoIntegration from './pages/ElvantoIntegration';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const App = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/parent-auth" element={<ParentAuthorizationPage />} />
            <Route path="/registration-success" element={<RegistrationSuccessPage />} />
            <Route path="/callback" element={<ThinkificAuth />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route index element={<ClassManager />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="elvanto" element={<ElvantoIntegration />} />
                    <Route path="classes" element={<ClassManager />} />
                    <Route path="teacher-classes" element={<TeacherClasses />} />
                    <Route path="admin-dashboard" element={<AdminDashboard />} />
                    <Route path="sf-dashboard" element={<SfDashboard />} />
                    <Route path="co-dashboard" element={<CoordinatorDashboard />} />
                </Route>
            </Route>

            {/* Redirect home to registration */}
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
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
