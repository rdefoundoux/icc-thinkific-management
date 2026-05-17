import { Box, Flex, useMantineTheme } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

const SIDEBAR_WIDTH = 260;

const DashboardLayout = ({ user }) => {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [sidebarOpen] = useState(!isMobile);

    return (
        <Box
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--mantine-color-gray-0)',
            }}
        >
            {!isMobile && sidebarOpen && <Sidebar />}

            <Box
                style={{
                    marginLeft: !isMobile && sidebarOpen ? SIDEBAR_WIDTH : 0,
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <TopNav user={user} />
                <Box
                    component="main"
                    style={{
                        flex: 1,
                        padding: isMobile ? 16 : 32,
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        overflowY: 'auto',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
