import { Link as RouterLink } from 'react-router-dom';
import { Flex, Text } from '@mantine/core';

import { IconHome, IconBook, IconUsers, IconSettings } from '@tabler/icons-react'; // Import specific icons

const NavItem = ({ icon, to, children }) => {
    // Get the specific icon component from props
    const IconComponent = icon;

    return (
        <RouterLink to={to} style={{ textDecoration: 'none' }}>
            <Flex
                align="center"
                px={16}
                py={12}
                gap={12}
                sx={(theme) => ({
                    borderRadius: theme.radius.md,
                    '&:hover': {
                        backgroundColor: theme.colors.gray[1]
                    },
                    transition: 'all 0.2s'
                })}
            >
                <IconComponent size={20} stroke={1.5} />
                <Text size="sm" fw={500}>
                    {children}
                </Text>
            </Flex>
        </RouterLink>
    );
};

export default NavItem;
