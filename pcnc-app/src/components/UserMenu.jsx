// UserMenu.jsx - Google account menu
import { Menu, Avatar, Text } from '@mantine/core';
import { IconUser, IconSettings, IconLogout } from '@tabler/icons-react';

const UserMenu = () => (
    <Menu shadow="xl" width={240} position="bottom-end">
        <Menu.Target>
            <Avatar
                size={32}
                radius="xl"
                style={{ cursor: 'pointer' }}
            />
        </Menu.Target>

        <Menu.Dropdown p="xs">
            <div style={{ padding: '12px 16px' }}>
                <Text fw={500}>John Doe</Text>
                <Text size="sm" color="dimmed">john@ecole.xyz</Text>
            </div>

            <Menu.Divider />

            <Menu.Item icon={<IconUser size={18} />}>
                My Profile
            </Menu.Item>
            <Menu.Item icon={<IconSettings size={18} />}>
                Account Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" icon={<IconLogout size={18} />}>
                Logout
            </Menu.Item>
        </Menu.Dropdown>
    </Menu>
);


export default UserMenu;
