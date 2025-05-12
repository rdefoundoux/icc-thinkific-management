import { Menu, Avatar, Text, Box } from '@mantine/core';
import { IconUser, IconSettings, IconLogout } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const UserMenu = ({
                      user = {
                          name: 'John Doe',
                          email: 'john@ecole.xyz',
                          avatarUrl: '',
                      },
                      onProfile,
                      onSettings,
                      onLogout,
                  }) => {
    const { t } = useTranslation();

    return (
        <Box>
            <Menu shadow="xl" width={240} position="bottom-end" withArrow>
                <Menu.Target>
                    <Avatar
                        size={32}
                        radius="xl"
                        src={user.avatarUrl}
                        alt={user.name}
                        style={{ cursor: 'pointer' }}
                    >
                        {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                    </Avatar>
                </Menu.Target>

                <Menu.Dropdown p="xs">
                    <Box style={{ padding: '12px 16px', maxWidth: 200 }}>
                        <Text fw={500} truncate="end">
                            {user.name}
                        </Text>
                        <Text size="sm" color="dimmed" truncate="end">
                            {user.email}
                        </Text>
                    </Box>

                    <Menu.Divider />

                    <Menu.Item icon={<IconUser size={18} />} onClick={onProfile}>
                        {t('userMenu.myProfile')}
                    </Menu.Item>
                    <Menu.Item icon={<IconSettings size={18} />} onClick={onSettings}>
                        {t('userMenu.accountSettings')}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" icon={<IconLogout size={18} />} onClick={onLogout}>
                        {t('userMenu.logout')}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Box>
    );
};

export default UserMenu;
