import { Group, Button, Select, Image } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TopNav = ({ onLanguageChange, showLoginButton }) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLanguageChange = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);
        if (onLanguageChange) onLanguageChange(language);
    };

    return (
        <Group
            px="lg"
            py="md"
            style={{
                background: 'linear-gradient(90deg, #FFFFFF 0%, #f8f8f8 100%)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <Image
                src="/pcnc-logo.png"
                alt="PCNC"
                height={40}
                fit="contain"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/')}
            />
            <Group position="apart" spacing="sm" style={{ alignItems: 'center' }}>
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
                />

                {showLoginButton && (
                    <Button
                        onClick={() => navigate('/login')}
                        variant="gradient"
                        gradient={{ from: '#662D91', to: '#00B0CA' }}
                        size="sm"
                        style={{ color: '#fff' }}
                    >
                        {t('topNav.loginButton') || 'Connexion'}
                    </Button>
                )}
            </Group>


        </Group>
    );
};

export default TopNav;
