import React from 'react';
import { Flex, Text, Avatar, ActionIcon, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconHelp, IconSettings, IconBell } from '@tabler/icons-react';

const TopNav = () => {
    const isSmallScreen = useMediaQuery('(max-width: 768px)');
    const iconSize = 20;
    const avatarSize = isSmallScreen ? 32 : 36;

    // Updated interactive element styling with PCNC colors
    const interactiveElementStyle = (theme) => ({
        transition: 'all 150ms ease',
        '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: theme.colors.pcncBlue[0],
        },
        '&:active': {
            transform: 'scale(0.95)',
        },
    });

    const actionIconProps = {
        size: 'lg',
        radius: 'xl',
        variant: 'light',
        sx: interactiveElementStyle,
        color: 'pcncPurple',
    };

    return (
        <Flex
            h={{ base: 56, md: 64 }}
            px={{ base: 'md', md: 'xl' }}
            bg="white"
            align="center"
            justify="space-between"
            sx={(theme) => ({
                borderBottom: `1px solid ${theme.colors.pcncNavy[0]}`, // PCNC navy border
                boxShadow: '0 2px 4px rgba(22,30,63,0.1)', // PCNC navy shadow
                position: 'sticky',
                top: 0,
                zIndex: 100,
            })}
        >
            {/* Left Section - PCNC Logo */}
            <Flex align="center" gap="sm">
                <img
                    src="/src/assets/pcnc-logo.png"
                    alt="PCNC Logo"
                    style={{
                        height: isSmallScreen ? 32 : 40,
                        width: 'auto',
                    }}
                />
            </Flex>

            {/* Right Section - Interactive Elements */}
            <Flex gap={{ base: 'xs', md: 'sm' }} align="center">
                <NavIcon
                    icon={<IconBell size={iconSize} />}
                    label="Notifications"
                    count="3"
                    actionIconProps={actionIconProps}
                />

                <NavIcon
                    icon={<IconHelp size={iconSize} />}
                    label="Aide"
                    actionIconProps={actionIconProps}
                />

                <NavIcon
                    icon={<IconSettings size={iconSize} />}
                    label="Paramètres"
                    actionIconProps={actionIconProps}
                />

                {/* User Avatar */}
                <Tooltip label="User Profile" position="bottom" withArrow>
                    <Avatar
                        size={avatarSize}
                        radius="xl"
                        color="pcncPurple"
                        sx={{
                            ...interactiveElementStyle,
                            backgroundColor: '#F5F6F9', // PCNC light background
                            border: `2px solid #662D91`, // PCNC purple border
                        }}
                    >
                        U
                    </Avatar>
                </Tooltip>
            </Flex>
        </Flex>
    );
};

// Updated NavIcon component with PCNC styling
const NavIcon = ({ icon, label, count, actionIconProps }) => (
    <Tooltip label={label} position="bottom" withArrow>
        <ActionIcon
            {...actionIconProps}
            aria-label={label}
            pos="relative"
        >
            {icon}
            {count && (
                <Text
                    size="xs"
                    sx={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#00B0CA', // PCNC teal
                        color: 'white',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                    }}
                >
                    {count}
                </Text>
            )}
        </ActionIcon>
    </Tooltip>
);

export default TopNav;
