import { Box, Group, Button, Select, Image, Stack, useMantineTheme } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';

const TopNav = ({ onLanguageChange, showLoginButton }) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);

    const handleLanguageChange = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
        if (onLanguageChange) onLanguageChange(language);
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(90deg, #FFFFFF 0%, #f8f8f8 100%)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                zIndex: 100,
                position: 'sticky',
                top: 0,
            }}
        >
            <Group
                px={isMobile ? 'sm' : 'lg'}
                py={isMobile ? 'sm' : 'md'}
                position="apart"
                align="center"
                noWrap
                style={{ flexWrap: 'wrap' }}
            >
                <Image
                    src="/pcnc-logo.png"
                    alt="PCNC"
                    height={isMobile ? 32 : 40}
                    fit="contain"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                />
                <Stack
                    spacing={isMobile ? 'xs' : 'sm'}
                    align={isMobile ? 'stretch' : 'center'}
                    justify="flex-end"
                    direction={isMobile ? 'column' : 'row'}
                    style={{ width: isMobile ? '100%' : 'auto' }}
                >
                    <Select
                        placeholder="Langue"
                        data={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' },
                        ]}
                        value={i18n.language}
                        onChange={handleLanguageChange}
                        size="sm"
                        styles={{
                            input: {
                                backgroundColor: '#f0f0f0',
                                border: '1px solid #ccc',
                                color: '#333',
                            },
                            item: {
                                '&[data-selected]': {
                                    backgroundColor: '#662D91',
                                    color: '#fff',
                                },
                            },
                        }}
                        defaultValue="fr"
                        fullWidth={isMobile}
                    />
                    {showLoginButton && (
                        <Button
                            onClick={() => navigate('/login')}
                            variant="gradient"
                            gradient={{ from: '#662D91', to: '#00B0CA' }}
                            size="sm"
                            style={{ color: '#fff' }}
                            fullWidth={isMobile}
                        >
                            {t('topNav.loginButton') || 'Connexion'}
                        </Button>
                    )}
                </Stack>
            </Group>
        </Box>
    );
};

export default TopNav;
