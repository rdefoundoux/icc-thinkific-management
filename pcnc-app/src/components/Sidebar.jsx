// src/components/Sidebar.js

import React from 'react';
import {
    Box,
    Stack,
    NavLink,
    Flex,
    Avatar,
    Menu,
    Text,
    UnstyledButton,
    useMantineTheme,
} from '@mantine/core';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
    IconHome,
    IconBooks,
    IconUsers,
    IconSettings,
    IconLogout,
    IconUsersGroup,
    IconUser,
    IconChevronDown,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const theme = useMantineTheme();

    const navItems = [

        ...(user?.roles?.includes('admin')
            ? [
                {
                    label: t('sidebar.dashboard'),
                    to: '/admin-dashboard',
                    icon: IconHome,
                },
                {
                    label: t('sidebar.classes'),
                    to: '/classes',
                    icon: IconBooks,
                },
                {
                    label: t('sidebar.users'),
                    to: '/users',
                    icon: IconUsers,
                },
                {
                    label: "Elvanto",
                    to: '/elvanto',
                    icon: IconUsers,
                },
            ]
            : []),
        ...(user?.roles?.includes('teacher')
            ? [
                {
                    label: t('sidebar.myClasses'),
                    to: '/teacher-classes',
                    icon: IconUsersGroup,
                },
            ]
            : []),
        ...(user?.roles?.includes('sf')
            ? [
                {
                    label: t('sidebar.myStudents'),
                    to: '/sf-dashboard',
                    icon: IconUsersGroup,
                },
            ]
            : []),
        ...(user?.roles?.includes('coordinator')
            ? [
                {
                    label: t('sidebar.myStudents'),
                    to: '/co-dashboard',
                    icon: IconUsersGroup,
                },
            ]
            : []),
        { label: t('sidebar.settings'), to: '/profile', icon: IconSettings },
    ];

    return (
        <Box
            w={256}
            p="sm"
            sx={{
                borderRight: '1px solid #dadce0',
                backgroundColor: 'white',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {/* Top Section: Navigation */}
            <Stack spacing={2}>
                {navItems.map(({ label, to, icon: Icon }) => (
                    <NavLink
                        key={label}
                        component={RouterNavLink}
                        to={to}
                        label={label}
                        icon={<Icon size={20} />}
                        pl="xl"
                        sx={{
                            borderRadius: theme.radius.md,
                            backgroundColor:
                                location.pathname === to ? theme.colors.blue[0] : 'transparent',
                            color:
                                location.pathname === to
                                    ? theme.colors.blue[6]
                                    : theme.colors.gray[7],
                            '&:hover': { backgroundColor: theme.colors.blue[0] },
                        }}
                    />
                ))}
            </Stack>

            {/* Bottom Section: User Profile Menu */}
            <Menu shadow="md" width={200} position="right-end">
                <Menu.Target>
                    <UnstyledButton
                        p="sm"
                        sx={{
                            borderRadius: theme.radius.md,
                            '&:hover': { backgroundColor: theme.colors.gray[1] },
                            width: '100%',
                        }}
                    >
                        <Flex align="center" gap="sm">
                            <Avatar
                                src={user?.avatarUrl}
                                size={40}
                                radius="xl"
                                color={theme.colors.blue[6]}
                            >
                                {user?.firstName?.[0]}
                                {user?.lastName?.[0]}
                            </Avatar>
                            <Flex direction="column" sx={{ flex: 1 }}>
                                <Text weight={500}>
                                    {user?.firstName} {user?.lastName}
                                </Text>
                                <Text size="sm" color="dimmed">
                                    {user?.roles?.join(', ')}
                                </Text>
                            </Flex>
                            <IconChevronDown size={16} />
                        </Flex>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>{t('sidebar.userMenu')}</Menu.Label>
                    <Menu.Item
                        icon={<IconUser size={14} />}
                        component={RouterNavLink}
                        to="/profile"
                    >
                        {t('sidebar.profile')}
                    </Menu.Item>
                    <Menu.Item
                        icon={<IconSettings size={14} />}
                        component={RouterNavLink}
                        to="/settings"
                    >
                        {t('sidebar.settings')}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        color="red"
                        icon={<IconLogout size={14} />}
                        onClick={logout}
                    >
                        {t('sidebar.logout')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Box>
    );
};

export default Sidebar;
