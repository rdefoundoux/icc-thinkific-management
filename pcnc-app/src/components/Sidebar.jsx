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
    ScrollArea,
    Divider,
} from '@mantine/core';
import { NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    IconHome,
    IconBooks,
    IconUsers,
    IconSettings,
    IconLogout,
    IconUsersGroup,
    IconUser,
    IconChevronRight,
    IconBuildingChurch,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const theme = useMantineTheme();

    const navItems = [
        ...(user?.roles?.includes('admin')
            ? [
                  { label: t('sidebar.dashboard'), to: '/admin-dashboard', icon: IconHome },
                  { label: t('sidebar.classes'), to: '/classes', icon: IconBooks },
                  { label: t('sidebar.users'), to: '/users', icon: IconUsers },
                  { label: 'Elvanto', to: '/elvanto', icon: IconBuildingChurch },
              ]
            : []),
        ...(user?.roles?.includes('teacher')
            ? [{ label: t('sidebar.myClasses'), to: '/teacher-classes', icon: IconUsersGroup }]
            : []),
        ...(user?.roles?.includes('sf')
            ? [{ label: t('sidebar.myStudents_sf'), to: '/sf-dashboard', icon: IconUsersGroup }]
            : []),
        ...(user?.roles?.includes('coordinator')
            ? [{ label: t('sidebar.myStudents_coo'), to: '/co-dashboard', icon: IconUsersGroup }]
            : []),
        { label: t('sidebar.settings'), to: '/profile', icon: IconSettings },
    ];

    return (
        <Box
            w={{ base: '100vw', sm: 260 }}
            style={{
                backgroundColor: 'var(--mantine-color-pcncNavy-9)',
                color: '#fff',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                zIndex: 99,
                top: 0,
                left: 0,
                maxWidth: '100vw',
                boxShadow: '4px 0 24px rgba(8, 32, 107, 0.12)',
            }}
        >
            {/* Logo / Brand */}
            <Box px="lg" py="xl" style={{ borderBottom: `1px solid ${'var(--mantine-color-pcncNavy-7)'}` }}>
                <Flex align="center" gap="sm">
                    <Box
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${'var(--mantine-color-pcncTeal-5)'} 0%, ${'var(--mantine-color-pcncPurple-5)'} 50%, ${'var(--mantine-color-pcncOrange-4)'} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 18,
                            boxShadow: '0 4px 12px rgba(132, 50, 232, 0.35)',
                        }}
                    >
                        ICC
                    </Box>
                    <Box>
                        <Text fw={500} c={theme.colors.gray[3]} size="xs" lh={1.1} tt="uppercase" style={{ letterSpacing: '0.1em' }}>
                            ICC
                        </Text>
                        <Text fw={800} c="#fff" size="md" lh={1.1}>
                            PCNC Corporate
                        </Text>
                    </Box>
                </Flex>
            </Box>

            {/* Top Section: Navigation */}
            <ScrollArea style={{ flex: 1 }} px="sm" py="md">
                <Stack gap={4}>
                    {navItems.map(({ label, to, icon: Icon }, index) => (
                        <NavLink
                            key={index}
                            component={RouterNavLink}
                            to={to}
                            label={label}
                            leftSection={<Icon size={18} stroke={1.8} />}
                            active={location.pathname === to}
                            onClick={(e) => {
                                if (location.pathname === to) {
                                    navigate(to, { replace: true });
                                    setTimeout(() => navigate(to, { replace: true }), 0);
                                    e.preventDefault();
                                }
                            }}
                        />
                    ))}
                </Stack>
            </ScrollArea>

            <Divider color={theme.colors.pcncNavy[7]} />

            {/* Bottom Section: User Profile Menu */}
            <Box p="sm">
                <Menu shadow="md" width={220} position="right-end" radius="md">
                    <Menu.Target>
                        <UnstyledButton
                            p="sm"
                            style={{
                                borderRadius: theme.radius.md,
                                width: '100%',
                                color: '#fff',
                                transition: 'background-color 120ms ease',
                                '&:hover': { backgroundColor: 'var(--mantine-color-pcncNavy-7)' },
                            }}
                        >
                            <Flex align="center" gap="sm">
                                <Avatar
                                    src={user?.avatarUrl}
                                    size={38}
                                    radius="xl"
                                    color="pcncTeal"
                                >
                                    {user?.firstName?.[0]}
                                    {user?.lastName?.[0]}
                                </Avatar>
                                <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                                    <Text fw={600} size="sm" c="#fff" truncate>
                                        {user?.firstName} {user?.lastName}
                                    </Text>
                                    <Text size="xs" c={theme.colors.gray[4]} truncate>
                                        {user?.roles?.join(', ')}
                                    </Text>
                                </Flex>
                                <IconChevronRight size={16} color={theme.colors.gray[4]} />
                            </Flex>
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<IconUser size={16} />}
                            component={RouterNavLink}
                            to="/profile"
                        >
                            Profile
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            leftSection={<IconLogout size={16} />}
                            color="red"
                            onClick={logout}
                        >
                            Logout
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Box>
        </Box>
    );
};

export default Sidebar;
