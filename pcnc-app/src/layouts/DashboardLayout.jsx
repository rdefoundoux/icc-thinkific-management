import { Box, Flex } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

const DashboardLayout = ({ user }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    // Optionally, you can add a burger menu to TopNav and toggle sidebarOpen on mobile

    return (
        <Flex h="100vh" direction="column">
            <TopNav showUserMenu user={user} />
            <Flex flex={1} style={{ overflow: 'hidden' }}>
                {!isMobile && <Sidebar />}
                <Box p="md" bg="gray.1" style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
};

export default DashboardLayout;
