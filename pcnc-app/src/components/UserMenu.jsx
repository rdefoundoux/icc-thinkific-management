import { Menu, Avatar, Text } from '@mantine/core';
import { IconUser, IconSettings, IconLogout } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const UserMenu = () => {
    const { t } = useTranslation();

    return (
        <Menu shadow="xl" width={240} position="bottom-end">
            <Menu.Target>
                <Avatar size={32} radius="xl" style={{ cursor: 'pointer' }} />
            </Menu.Target>

            <Menu.Dropdown p="xs">
                <div style={{ padding: '12px 16px' }}>
                    <Text fw={500}>John Doe</Text>
                    <Text size="sm" color="dimmed">john@ecole.xyz</Text>
                </div>

                <Menu.Divider />

                <Menu.Item icon={<IconUser size={18} />}>
                    {t('userMenu.myProfile')}
                </Menu.Item>
                <Menu.Item icon={<IconSettings size={18} />}>
                    {t('userMenu.accountSettings')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" icon={<IconLogout size={18} />}>
                    {t('userMenu.logout')}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

export default UserMenu;
