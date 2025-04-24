import { Box, Flex } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

const DashboardLayout = () => {
    return (
        <Flex h="100vh" direction="column">
            <TopNav />
            <Flex flex={1} style={{ overflow: 'hidden' }}>
                <Sidebar />
                <Box p="md" bg="gray.1" style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
};

export default DashboardLayout;
