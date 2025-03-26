// UserMenu.jsx
import { Menu, Avatar } from '@mantine/core';
import { IconUser, IconSettings } from '@tabler/icons-react';

const UserMenu = () => {
    return (
        <Menu shadow="md" width={200}>
            <Menu.Target>
                <Avatar size="md" radius="xl" color="blue">JD</Avatar>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />}>
                    Profil
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />}>
                    Paramètres
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export default UserMenu;
