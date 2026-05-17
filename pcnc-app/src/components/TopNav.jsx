import { Box, Group, Button, Select, Flex, Text, useMantineTheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';

const TopNav = ({ onLanguageChange, showLoginButton }) => {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const handleLanguageChange = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
        if (onLanguageChange) onLanguageChange(language);
    };

    return (
        <Box
            sx={{
                background: '#ffffff',
                borderBottom: `1px solid ${theme.colors.gray[2]}`,
                width: '100%',
                zIndex: 100,
                position: 'sticky',
                top: 0,
                height: 64,
            }}
        >
            <Group
                px={isMobile ? 'sm' : 'lg'}
                justify="space-between"
                align="center"
                wrap="nowrap"
                h="100%"
            >
                <Flex
                    align="center"
                    gap="sm"
                    onClick={() => navigate('/')}
                    sx={{ cursor: 'pointer' }}
                >
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${theme.colors.pcncTeal[5]} 0%, ${theme.colors.pcncPurple[5]} 50%, ${theme.colors.pcncOrange[4]} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 14,
                        }}
                    >
                        ICC
                    </Box>
                    <Flex direction="column" lh={1.1} visibleFrom="sm">
                        <Text fw={500} size="xs" c={theme.colors.gray[6]} tt="uppercase" style={{ letterSpacing: '0.1em' }}>
                            ICC
                        </Text>
                        <Text fw={700} size="md" c={theme.colors.pcncNavy[0]}>
                            PCNC Corporate
                        </Text>
                    </Flex>
                </Flex>

                <Group gap="sm">
                    <Select
                        placeholder="Langue"
                        data={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' },
                        ]}
                        value={i18n.language?.split('-')[0] || 'fr'}
                        onChange={handleLanguageChange}
                        size="sm"
                        w={130}
                        styles={{
                            input: {
                                backgroundColor: theme.colors.gray[1],
                                border: `1px solid ${theme.colors.gray[2]}`,
                                color: theme.colors.gray[8],
                                fontWeight: 500,
                            },
                        }}
                    />
                    {showLoginButton && (
                        <Button
                            onClick={() => navigate('/login')}
                            size="sm"
                            color="pcncTeal"
                        >
                            {t('topNav.loginButton') || 'Connexion'}
                        </Button>
                    )}
                </Group>
            </Group>
        </Box>
    );
};

export default TopNav;
