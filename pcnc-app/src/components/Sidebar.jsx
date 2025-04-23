// Sidebar.jsx - Gmail-style navigation
import React from 'react';
import { Box, NavLink, Stack } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
    IconHome, IconBooks, IconUsers,
    IconSettings, IconLogout
} from '@tabler/icons-react';

const navItems = [
    { label: 'Dashboard', to: '/', icon: IconHome },
    { label: 'Classes', to: '/classes', icon: IconBooks },
    { label: 'Students', to: '/students', icon: IconUsers },
    { label: 'Settings', to: '/settings', icon: IconSettings },
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <Box
            w={256}
            p="sm"
            style={{
                borderRight: '1px solid #dadce0',
                backgroundColor: 'white',
                height: '100vh'
            }}
        >
            <Stack spacing={2}>
                {navItems.map(({ label, to, icon: Icon }) => (
                    <NavLink
                        key={label}
                        component={RouterNavLink}
                        to={to}
                        label={label}
                        icon={<Icon size={20} />}
                        pl="xl"
                        sx={(theme) => ({
                            borderRadius: theme.radius.md,
                            backgroundColor: location.pathname === to ? theme.colors.blue[0] : "transparent",
                            color: location.pathname === to ? theme.colors.blue[6] : theme.colors.gray[7],
                            "&:hover": {
                                backgroundColor: theme.colors.blue[0],
                            },
                        })}
                    />
                ))}
                <NavLink
                    icon={<IconLogout size={20} />}
                    label="Logout"
                    pl="xl"
                    onClick={() => console.log('Logout')}
                />
            </Stack>
        </Box>
    );
};

export default Sidebar;
