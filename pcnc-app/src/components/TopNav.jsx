import { Group, ActionIcon, Title } from '@mantine/core'; // Added Title import
import { IconBell, IconLogout } from '@tabler/icons-react';
import UserMenu from './UserMenu';
import { Text } from '@mantine/core'; // Add this import

const TopNav = () => {
    return (
        <Group h={60} px="md" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Title order={4}>Plateforme Éducative</Title>

            <Group gap="xs">
                <ActionIcon variant="subtle">
                    <IconBell size={20} />
                </ActionIcon>
                <UserMenu />
                <ActionIcon variant="outline">
                    <IconLogout size={20} />
                </ActionIcon>
            </Group>
        </Group>
    );
};

export default TopNav;
