import {
    Routes,
    Route,
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { MantineProvider, Flex, LoadingOverlay } from "@mantine/core";
import theme from "./theme";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import ClassManager from "./pages/ClassManager";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentPortal from "./pages/StudentPortal";
import ThinkificManager from "./components/ThinkificManager";
import ThinkificAuth from "./auth/ThinkificAuth";
import ProfilePage from "./pages/ProfilePage.jsx";
import UserManagement from './pages/UserManagement';
import './index.css';

const App = () => {
    return (
        <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/callback" element={<ThinkificAuth />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    {/* Dashboard Wrapping Layout */}
                    <Route element={<DashboardLayout />}>
                        <Route index element={<ClassManager />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="teacher" element={<TeacherDashboard />} />
                        <Route path="student" element={<StudentPortal />} />
                        <Route path="thinkific" element={<ThinkificManager />} />
                    </Route>
                </Route>

                {/* Redirect unknown paths to the home (dashboard) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MantineProvider>
    );
};

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Display loading visuals while preparing authentication state
    if (loading) {
        return (
            <Flex h="100vh" align="center" justify="center">
                <LoadingOverlay visible={true} zIndex={1000} />
            </Flex>
        );
    }

    // If authenticated, render protected content; otherwise, redirect.
    return user ? (
        <Outlet />
    ) : (
        <Navigate
            to="/login"
            state={{ from: location.pathname !== "/login" ? location : "/" }}
            replace
        />
    );
};

export default App;
