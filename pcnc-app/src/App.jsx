import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { MantineProvider, Flex, LoadingOverlay } from '@mantine/core';
import { theme } from './theme';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ClassManager from './pages/ClassManager';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentPortal from './pages/StudentPortal';
import ThinkificManager from './components/ThinkificManager';
import ThinkificAuth from './auth/ThinkificAuth';
import ProfilePage from "./pages/ProfilePage.jsx";

const App = () => {
    return (
        <MantineProvider theme={theme} defaultColorScheme="dark">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/callback" element={<ThinkificAuth />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<ClassManager />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="teacher" element={<TeacherDashboard />} />
                        <Route path="student" element={<StudentPortal />} />
                        <Route path="thinkific" element={<ThinkificManager />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MantineProvider>
    );
};

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Flex h="100vh" align="center" justify="center">
                <LoadingOverlay visible={true} zIndex={1000} />
            </Flex>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default App;
