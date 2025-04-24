import React from 'react';
import { Box, NavLink, Stack } from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
    IconHome,
    IconBooks,
    IconUsers,
    IconSettings,
    IconLogout,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
    const location = useLocation();
    const { t } = useTranslation();

    const navItems = [
        { label: t('sidebar.dashboard'), to: '/', icon: IconHome },
        { label: t('sidebar.classes'), to: '/classes', icon: IconBooks },
        { label: t('sidebar.students'), to: '/users', icon: IconUsers },
        { label: t('sidebar.settings'), to: '/profile', icon: IconSettings },
    ];

    const handleLogout = () => {
        console.log('Logout clicked');
        // Perform logout logic here
    };

    return (
        <Box
            w={256}
            p="sm"
            style={{
                borderRight: '1px solid #dadce0',
                backgroundColor: 'white',
                height: '100vh',
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
                            backgroundColor:
                                location.pathname === to ? theme.colors.blue[0] : 'transparent',
                            color:
                                location.pathname === to
                                    ? theme.colors.blue[6]
                                    : theme.colors.gray[7],
                            '&:hover': {
                                backgroundColor: theme.colors.blue[0],
                            },
                        })}
                    />
                ))}
                <NavLink
                    icon={<IconLogout size={20} />}
                    label={t('sidebar.logout')}
                    pl="xl"
                    onClick={handleLogout}
                />
            </Stack>
        </Box>
    );
};

export default Sidebar;
