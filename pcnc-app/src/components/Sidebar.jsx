import { Box, NavLink, Group, Text } from '@mantine/core';
import { IconHome, IconBooks, IconUsers, IconSettings } from '@tabler/icons-react';
import { NavLink as RouterNavLink } from 'react-router-dom';


const Sidebar = () => {
    return (
        <Box w={240} style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
            <Group p="md" pb={0} gap={0}>
                <NavLink
                    component={RouterNavLink}
                    to="/"
                    label="Tableau de bord"
                    icon={<IconHome size={20} />}
                    styles={{
                        root: {
                            '&[data-active]': {
                                backgroundColor: 'var(--mantine-color-dark-5)',
                                color: 'var(--mantine-color-white)',
                            },
                            '&[data-active]:hover': {
                                backgroundColor: 'var(--mantine-color-dark-4)'
                            }
                        }
                    }}
                />
                <NavLink
                    component={RouterNavLink}
                    to="/classes"
                    label="Gestion des classes"
                    icon={<IconBooks size={20} />}
                    styles={{
                        root: {
                            '&[data-active]': {
                                backgroundColor: 'var(--mantine-color-dark-5)',
                                color: 'var(--mantine-color-white)',
                            }
                        }
                    }}
                />
                <NavLink
                    component={RouterNavLink}
                    to="/students"
                    label="Étudiants"
                    icon={<IconUsers size={20} />}
                    styles={{
                        root: {
                            '&[data-active]': {
                                backgroundColor: 'var(--mantine-color-dark-5)',
                                color: 'var(--mantine-color-white)',
                            }
                        }
                    }}
                />
                <NavLink
                    component={RouterNavLink}
                    to="/settings"
                    label="Paramètres"
                    icon={<IconSettings size={20} />}
                    styles={{
                        root: {
                            '&[data-active]': {
                                backgroundColor: 'var(--mantine-color-dark-5)',
                                color: 'var(--mantine-color-white)',
                            }
                        }
                    }}
                />
            </Group>

            <Box p="md" style={{ position: 'absolute', bottom: 0 }}>
                <Text size="sm" c="dimmed">École XYZ © 2025</Text>
            </Box>
        </Box>
    );
};


export default Sidebar;
