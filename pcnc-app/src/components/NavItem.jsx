import { Link as RouterLink } from 'react-router-dom';
import { Flex, Text } from '@mantine/core';

const NavItem = ({ icon, to, children }) => {
    const IconComponent = icon;
    return (
        <RouterLink to={to} style={{ textDecoration: 'none', width: '100%' }}>
            <Flex
                align="center"
                px={16}
                py={12}
                gap={12}
                style={(theme) => ({
                    borderRadius: theme.radius.md,
                    '&:hover': {
                        backgroundColor: 'var(--mantine-color-gray-1)'
                    },
                    transition: 'all 0.2s',
                    width: '100%',
                })}
            >
                <IconComponent size={20} stroke={1.5} />
                <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {children}
                </Text>
            </Flex>
        </RouterLink>
    );
};

export default NavItem;
