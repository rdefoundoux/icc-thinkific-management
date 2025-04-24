import { useState, useEffect } from 'react';
import {
    TextInput,
    Button,
    Text,
    Checkbox,
    Divider,
    Box,
    Container,
    LoadingOverlay,
    Group,
    Select,
    Title,
    Anchor,
    Stack,
    Image,
    SimpleGrid,
    Radio,
    Alert,
    Textarea
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import TopNav from '../components/TopNav';

const RegistrationPage = () => {
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        email: '',
        whatsappNumber: '',
        address: '',
        city: '',
        postalCode: '',
        department: '',
        country: '',
        birthDate: '',
        gender: '',
        localChurch: '',
        nonIccChurch: '',
        iccMember: false,
        memberSince: '',
        iccCampus: '',
        staffMember: '',
        convertedDate: '',
        baptized: '',
        baptismDate: '',
        previousCourses: [],
        preferredSchedule: '',
        comments: ''
    });
    const countryOptions = [
        { value: "Afghanistan", label: "Afghanistan" },
        { value: "Albania", label: "Albania" },
        { value: "Algeria", label: "Algeria" },
        { value: "Andorra", label: "Andorra" },
        { value: "Angola", label: "Angola" },
        { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
        { value: "Argentina", label: "Argentina" },
        { value: "Armenia", label: "Armenia" },
        { value: "Australia", label: "Australia" },
        { value: "Austria", label: "Austria" },
        { value: "Azerbaijan", label: "Azerbaijan" },
        { value: "Bahamas", label: "Bahamas" },
        { value: "Bahrain", label: "Bahrain" },
        { value: "Bangladesh", label: "Bangladesh" },
        { value: "Barbados", label: "Barbados" },
        { value: "Belarus", label: "Belarus" },
        { value: "Belgium", label: "Belgium" },
        { value: "Belize", label: "Belize" },
        { value: "Benin", label: "Benin" },
        { value: "Bhutan", label: "Bhutan" },
        { value: "Bolivia", label: "Bolivia" },
        { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
        { value: "Botswana", label: "Botswana" },
        { value: "Brazil", label: "Brazil" },
        { value: "Brunei", label: "Brunei" },
        { value: "Bulgaria", label: "Bulgaria" },
        { value: "Burkina Faso", label: "Burkina Faso" },
        { value: "Burundi", label: "Burundi" },
        { value: "Cabo Verde", label: "Cabo Verde" },
        { value: "Cambodia", label: "Cambodia" },
        { value: "Cameroon", label: "Cameroon" },
        { value: "Canada", label: "Canada" },
        { value: "Central African Republic", label: "Central African Republic" },
        { value: "Chad", label: "Chad" },
        { value: "Chile", label: "Chile" },
        { value: "China", label: "China" },
        { value: "Colombia", label: "Colombia" },
        { value: "Comoros", label: "Comoros" },
        { value: "Congo", label: "Congo" },
        { value: "Congo, Democratic Republic of the", label: "Congo, Democratic Republic of the" },
        { value: "Costa Rica", label: "Costa Rica" },
        { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
        { value: "Croatia", label: "Croatia" },
        { value: "Cuba", label: "Cuba" },
        { value: "Cyprus", label: "Cyprus" },
        { value: "Czechia", label: "Czechia" },
        { value: "Denmark", label: "Denmark" },
        { value: "Djibouti", label: "Djibouti" },
        { value: "Dominica", label: "Dominica" },
        { value: "Dominican Republic", label: "Dominican Republic" },
        { value: "Ecuador", label: "Ecuador" },
        { value: "Egypt", label: "Egypt" },
        { value: "El Salvador", label: "El Salvador" },
        { value: "Equatorial Guinea", label: "Equatorial Guinea" },
        { value: "Eritrea", label: "Eritrea" },
        { value: "Estonia", label: "Estonia" },
        { value: "Eswatini", label: "Eswatini" },
        { value: "Ethiopia", label: "Ethiopia" },
        { value: "Fiji", label: "Fiji" },
        { value: "Finland", label: "Finland" },
        { value: "France", label: "France" },
        { value: "Gabon", label: "Gabon" },
        { value: "Gambia", label: "Gambia" },
        { value: "Georgia", label: "Georgia" },
        { value: "Germany", label: "Germany" },
        { value: "Ghana", label: "Ghana" },
        { value: "Greece", label: "Greece" },
        { value: "Grenada", label: "Grenada" },
        { value: "Guatemala", label: "Guatemala" },
        { value: "Guinea", label: "Guinea" },
        { value: "Guinea-Bissau", label: "Guinea-Bissau" },
        { value: "Guyana", label: "Guyana" },
        { value: "Haiti", label: "Haiti" },
        { value: "Honduras", label: "Honduras" },
        { value: "Hungary", label: "Hungary" },
        { value: "Iceland", label: "Iceland" },
        { value: "India", label: "India" },
        { value: "Indonesia", label: "Indonesia" },
        { value: "Iran", label: "Iran" },
        { value: "Iraq", label: "Iraq" },
        { value: "Ireland", label: "Ireland" },
        { value: "Israel", label: "Israel" },
        { value: "Italy", label: "Italy" },
        { value: "Jamaica", label: "Jamaica" },
        { value: "Japan", label: "Japan" },
        { value: "Jordan", label: "Jordan" },
        { value: "Kazakhstan", label: "Kazakhstan" },
        { value: "Kenya", label: "Kenya" },
        { value: "Kiribati", label: "Kiribati" },
        { value: "Korea, North", label: "Korea, North" },
        { value: "Korea, South", label: "Korea, South" },
        { value: "Kuwait", label: "Kuwait" },
        { value: "Kyrgyzstan", label: "Kyrgyzstan" },
        { value: "Laos", label: "Laos" },
        { value: "Latvia", label: "Latvia" },
        { value: "Lebanon", label: "Lebanon" },
        { value: "Lesotho", label: "Lesotho" },
        { value: "Liberia", label: "Liberia" },
        { value: "Libya", label: "Libya" },
        { value: "Liechtenstein", label: "Liechtenstein" },
        { value: "Lithuania", label: "Lithuania" },
        { value: "Luxembourg", label: "Luxembourg" },
        { value: "Madagascar", label: "Madagascar" },
        { value: "Malawi", label: "Malawi" },
        { value: "Malaysia", label: "Malaysia" },
        { value: "Maldives", label: "Maldives" },
        { value: "Mali", label: "Mali" },
        { value: "Malta", label: "Malta" },
        { value: "Marshall Islands", label: "Marshall Islands" },
        { value: "Mauritania", label: "Mauritania" },
        { value: "Mauritius", label: "Mauritius" },
        { value: "Mexico", label: "Mexico" },
        { value: "Micronesia", label: "Micronesia" },
        { value: "Moldova", label: "Moldova" },
        { value: "Monaco", label: "Monaco" },
        { value: "Mongolia", label: "Mongolia" },
        { value: "Montenegro", label: "Montenegro" },
        { value: "Morocco", label: "Morocco" },
        { value: "Mozambique", label: "Mozambique" },
        { value: "Myanmar", label: "Myanmar" },
        { value: "Namibia", label: "Namibia" },
        { value: "Nauru", label: "Nauru" },
        { value: "Nepal", label: "Nepal" },
        { value: "Netherlands", label: "Netherlands" },
        { value: "New Zealand", label: "New Zealand" },
        { value: "Nicaragua", label: "Nicaragua" },
        { value: "Niger", label: "Niger" },
        { value: "Nigeria", label: "Nigeria" },
        { value: "North Macedonia", label: "North Macedonia" },
        { value: "Norway", label: "Norway" },
        { value: "Oman", label: "Oman" },
        { value: "Pakistan", label: "Pakistan" },
        { value: "Palau", label: "Palau" },
        { value: "Palestine", label: "Palestine" },
        { value: "Panama", label: "Panama" },
        { value: "Papua New Guinea", label: "Papua New Guinea" },
        { value: "Paraguay", label: "Paraguay" },
        { value: "Peru", label: "Peru" },
        { value: "Philippines", label: "Philippines" },
        { value: "Poland", label: "Poland" },
        { value: "Portugal", label: "Portugal" },
        { value: "Qatar", label: "Qatar" },
        { value: "Romania", label: "Romania" },
        { value: "Russia", label: "Russia" },
        { value: "Rwanda", label: "Rwanda" },
        { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" },
        { value: "Saint Lucia", label: "Saint Lucia" },
        { value: "Saint Vincent and the Grenadines", label: "Saint Vincent and the Grenadines" },
        { value: "Samoa", label: "Samoa" },
        { value: "San Marino", label: "San Marino" },
        { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
        { value: "Saudi Arabia", label: "Saudi Arabia" },
        { value: "Senegal", label: "Senegal" },
        { value: "Serbia", label: "Serbia" },
        { value: "Seychelles", label: "Seychelles" },
        { value: "Sierra Leone", label: "Sierra Leone" },
        { value: "Singapore", label: "Singapore" },
        { value: "Slovakia", label: "Slovakia" },
        { value: "Slovenia", label: "Slovenia" },
        { value: "Solomon Islands", label: "Solomon Islands" },
        { value: "Somalia", label: "Somalia" },
        { value: "South Africa", label: "South Africa" },
        { value: "South Sudan", label: "South Sudan" },
        { value: "Spain", label: "Spain" },
        { value: "Sri Lanka", label: "Sri Lanka" },
        { value: "Sudan", label: "Sudan" },
        { value: "Suriname", label: "Suriname" },
        { value: "Sweden", label: "Sweden" },
        { value: "Switzerland", label: "Switzerland" },
        { value: "Syria", label: "Syria" },
        { value: "Taiwan", label: "Taiwan" },
        { value: "Tajikistan", label: "Tajikistan" },
        { value: "Tanzania", label: "Tanzania" },
        { value: "Thailand", label: "Thailand" },
        { value: "Timor-Leste", label: "Timor-Leste" },
        { value: "Togo", label: "Togo" },
        { value: "Tonga", label: "Tonga" },
        { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
        { value: "Tunisia", label: "Tunisia" },
        { value: "Turkey", label: "Turkey" },
        { value: "Turkmenistan", label: "Turkmenistan" },
        { value: "Tuvalu", label: "Tuvalu" },
        { value: "Uganda", label: "Uganda" },
        { value: "Ukraine", label: "Ukraine" },
        { value: "United Arab Emirates", label: "United Arab Emirates" },
        { value: "United Kingdom", label: "United Kingdom" },
        { value: "United States", label: "United States" },
        { value: "Uruguay", label: "Uruguay" },
        { value: "Uzbekistan", label: "Uzbekistan" },
        { value: "Vanuatu", label: "Vanuatu" },
        { value: "Vatican City", label: "Vatican City" },
        { value: "Venezuela", label: "Venezuela" },
        { value: "Vietnam", label: "Vietnam" },
        { value: "Yemen", label: "Yemen" },
        { value: "Zambia", label: "Zambia" },
        { value: "Zimbabwe", label: "Zimbabwe" }
    ];

    const [gdprConsent, setGdprConsent] = useState({
        dataProcessing: false
    });

    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Conditional rendering states
    const [showIccFields, setShowIccFields] = useState(false);
    const [showBaptismDateField, setShowBaptismDateField] = useState(false);
    const [showPreviousCourseFields, setShowPreviousCourseFields] = useState(false);

    // Update conditional fields visibility based on form data changes
    useEffect(() => {
        setShowIccFields(formData.iccMember);
        setShowBaptismDateField(formData.baptized === 'yes');
        setShowPreviousCourseFields(formData.previousCourses.length > 0);
    }, [formData.iccMember, formData.baptized, formData.previousCourses]);

    const handleLanguageChange = (value) => {
        i18n.changeLanguage(value);
    };

    const handleChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.target.value
        });
    };

    const handleSelectChange = (field) => (value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    const handleCheckboxChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.currentTarget.checked
        });
    };

    const handleConsentChange = (field) => (event) => {
        setGdprConsent({
            ...gdprConsent,
            [field]: event.currentTarget.checked
        });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.lastName) errors.lastName = "Le nom de famille est requis";
        if (!formData.firstName) errors.firstName = "Le prénom est requis";
        if (!formData.email) errors.email = "L'adresse email est requise";
        if (!formData.whatsappNumber) errors.whatsappNumber = "Le numéro WhatsApp est requis";
        if (!formData.department) errors.department = "Le département est requis";
        if (!formData.birthDate) errors.birthDate = "La date de naissance est requise";
        if (!formData.gender) errors.gender = "Le genre est requis";
        if (!formData.localChurch) errors.localChurch = "L'église locale est requise";
        if (!formData.baptized) errors.baptized = "L'information sur le baptême est requise";
        if (!formData.preferredSchedule) errors.preferredSchedule = "L'horaire préféré est requis";
        if (!gdprConsent.dataProcessing) errors.gdpr = "Vous devez accepter les conditions de confidentialité";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            notifications.show({
                title: "Erreur de validation",
                message: "Veuillez corriger les erreurs dans le formulaire",
                color: 'red',
                withBorder: true,
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/registrations`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        gdprConsent
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Échec de l\'inscription');

            notifications.show({
                title: "Inscription réussie",
                message: "Votre inscription a été enregistrée avec succès",
                color: 'green',
            });

            navigate('/registration-success');
        } catch (err) {
            notifications.show({
                title: "Erreur d'inscription",
                message: err.message,
                color: 'red',
                withBorder: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <TopNav onLanguageChange={handleLanguageChange} showLoginButton={true} />

            <Container size="lg" py="xl" style={{ flex: 1 }}>
                <Box mb={30}>
                    <Group direction="column" position="center" spacing="md" mb={30}>
                        <Image
                            src="/src/assets/PCNC-Nr-2.png"
                            alt="Parcours de Croissance"
                            height={80}
                            fit="contain"
                        />
                        <Group position="center" spacing="md">
                            <Image
                                src="/src/assets/001-Nr-1.png"
                                alt="Bienvenue dans le Royaume"
                                height={60}
                            />
                            <Image
                                src="/src/assets/101-Nr-1.png"
                                alt="Fondements du Royaume"
                                height={60}
                            />
                        </Group>
                    </Group>


                    <Title order={1} align="center" mb="lg">
                        INSCRIPTION PCNC DIGITAL 101 - FEVRIER 2025
                    </Title>

                    <Text align="center" size="md" mb={20}>
                        Bienvenue au Parcours de Croissance de la Nouvelle Création
                    </Text>
                </Box>

                <Alert icon={<IconAlertCircle size={16} />} title="Informations Importantes" color="blue" mb={30}>
                    <Text size="sm" mb={10}>
                        <strong>*** INFORMATION 1 ***</strong><br />
                        Vous ne pouvez suivre qu'une formation à la fois. Toute inscription à 2 cours en simultané est interdite.
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** INFORMATION 2 ***</strong><br />
                        Si vous êtes converti(e) depuis moins d'une année ou si vous n'êtes pas baptisé(e) par immersion, nous vous encourageons à vous inscrire au cours 001 (Bienvenue Dans le Royaume)
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** INFORMATION 3 ***</strong><br />
                        Les cours seront dispensés en ligne via la plateforme Zoom uniquement.
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** INFORMATION 4 ***</strong><br />
                        ATTENTION : Les horaires présentés sont en heure de Paris (Fuseau UTC +2). Merci de calculer vos horaires de cours en fonction de votre fuseau. Si un cours se déroule le jeudi à 01h15, il s'agit de la nuit de mercredi à jeudi pour un horaire sur Paris. Pour une personne à Montreal, ce cours démarre mercredi à 19h15, pour une personne en Martinique, ce cours démarre mercredi à 20h15.
                    </Text>
                    <Text size="sm">
                        <strong>*** INFORMATION 5 ***</strong><br />
                        Si vous avez moins de 18 ans au moment de la participation à la formation, votre inscription doit être réalisée par un de vos parents ou un représentant légal. Dans le formulaire il indiquera vos coordonnées. Par la suite il devra remplir, signer et nous renvoyer le formulaire suivant AUTORISATION PARENTALE POUR MINEUR à l'adresse pcnc.corp@egliseicc.com pour valider l'inscription.
                    </Text>
                </Alert>

                <Box
                    sx={(theme) => ({
                        backgroundColor: theme.white,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.xl,
                        boxShadow: theme.shadows.md
                    })}
                >
                    <form onSubmit={handleSubmit}>
                        <LoadingOverlay visible={loading} />

                        <Title order={3} mb="md">Informations Personnelles</Title>

                        <Group grow mb="md">
                            <TextInput
                                required
                                label="NOM"
                                description="Veuillez indiquer le nom en MAJUSCULE"
                                value={formData.lastName}
                                onChange={handleChange('lastName')}
                                error={formErrors.lastName}
                                placeholder="DOE"
                            />

                            <TextInput
                                required
                                label="Prénom"
                                description="Veuillez indiquer le prénom (1ère lettre en majuscule)"
                                value={formData.firstName}
                                onChange={handleChange('firstName')}
                                error={formErrors.firstName}
                                placeholder="John"
                            />
                        </Group>

                        <Group grow mb="md">
                            <TextInput
                                required
                                label="Email"
                                type="email"
                                description="Cette adresse doit-être unique pour chaque étudiant inscrit"
                                value={formData.email}
                                onChange={handleChange('email')}
                                error={formErrors.email}
                                placeholder="john.doe@example.com"
                            />

                            <TextInput
                                required
                                label="Numéro WhatsApp"
                                description="Veuillez indiquer votre numéro WhatsApp au format international"
                                value={formData.whatsappNumber}
                                onChange={handleChange('whatsappNumber')}
                                error={formErrors.whatsappNumber}
                                placeholder="+33 6 12 34 56 78"
                            />
                        </Group>

                        <TextInput
                            label="Adresse"
                            value={formData.address}
                            onChange={handleChange('address')}
                            mb="md"
                        />

                        <Group grow mb="md">
                            <TextInput
                                label="Ville"
                                value={formData.city}
                                onChange={handleChange('city')}
                            />

                            <TextInput
                                label="Code Postal"
                                value={formData.postalCode}
                                onChange={handleChange('postalCode')}
                            />

                            <TextInput

                                label="Département"
                                description="Indiquez le numéro du département à 2 ou 3 chiffres : 75 si vous êtes sur Paris, 33 pour la Gironde, 971 pour la Guadeloupe, ..."
                                value={formData.department}
                                onChange={handleChange('department')}
                                error={formErrors.department}
                                placeholder="75"
                            />
                        </Group>

                        <Group grow mb="md">
                            <Select
                                label="Pays"
                                value={formData.country}
                                onChange={handleSelectChange('country')}
                                data={countryOptions}
                            />

                            <TextInput
                                required
                                label="Date de naissance"
                                type="date"
                                value={formData.birthDate}
                                onChange={handleChange('birthDate')}
                                error={formErrors.birthDate}
                            />

                            <Select
                                required
                                label="Genre"
                                value={formData.gender}
                                onChange={handleSelectChange('gender')}
                                error={formErrors.gender}
                                data={[
                                    { value: 'homme', label: 'Homme' },
                                    { value: 'femme', label: 'Femme' }
                                ]}
                            />
                        </Group>

                        <Divider my="lg" />

                        <Title order={3} mb="md">Informations d'Église</Title>

                        <Select
                            required
                            label="Église locale"
                            description="Si vous n'avez pas encore intégré une église en présentiel, quelle église locale pourriez fréquenter par la suite?"
                            value={formData.localChurch}
                            onChange={handleSelectChange('localChurch')}
                            error={formErrors.localChurch}
                            data={[
                                { value: 'icc_paris', label: 'ICC Paris' },
                                { value: 'icc_montreal', label: 'ICC Montréal' },
                                { value: 'icc_bruxelles', label: 'ICC Bruxelles' },
                                { value: 'icc_martinique', label: 'ICC Martinique' },
                                { value: 'icc_guadeloupe', label: 'ICC Guadeloupe' },
                                { value: 'icc_guyane', label: 'ICC Guyane' },
                                { value: 'non_icc', label: 'Église non ICC' }
                            ]}
                            mb="md"
                        />

                        {formData.localChurch === 'non_icc' && (
                            <TextInput
                                label="Nom de l'église non ICC"
                                description="Merci de remplir cette information si vous êtes membre d'une église ou famille ICC non présente dans la liste. Sinon indiquez 'NON ICC'"
                                value={formData.nonIccChurch}
                                onChange={handleChange('nonIccChurch')}
                                mb="md"
                            />
                        )}

                        <Checkbox
                            label="Je suis membre d'ICC"
                            checked={formData.iccMember}
                            onChange={handleCheckboxChange('iccMember')}
                            mb="md"
                        />

                        {showIccFields && (
                            <>
                                <Group grow mb="md">
                                    <TextInput
                                        label="Membre depuis (date approximative)"
                                        type="date"
                                        value={formData.memberSince}
                                        onChange={handleChange('memberSince')}
                                    />

                                    <Select
                                        label="Campus ICC"
                                        value={formData.iccCampus}
                                        onChange={handleSelectChange('iccCampus')}
                                        data={[
                                            { value: 'paris', label: 'Paris' },
                                            { value: 'montreal', label: 'Montréal' },
                                            { value: 'bruxelles', label: 'Bruxelles' },
                                            { value: 'martinique', label: 'Martinique' },
                                            { value: 'guadeloupe', label: 'Guadeloupe' },
                                            { value: 'guyane', label: 'Guyane' }
                                        ]}
                                    />
                                </Group>

                                <TextInput
                                    label="Tuteur ou Staff Formation"
                                    description="Un tuteur ou Staff Formation est un membre de ICC qui vous accompagne pendant votre parcours de croissance"
                                    value={formData.staffMember}
                                    onChange={handleChange('staffMember')}
                                    mb="md"
                                />
                            </>
                        )}

                        <Divider my="lg" />

                        <Title order={3} mb="md">Informations Spirituelles</Title>

                        <Group grow mb="md">
                            <TextInput
                                label="Date de conversion"
                                type="date"
                                value={formData.convertedDate}
                                onChange={handleChange('convertedDate')}
                            />

                            <Radio.Group
                                required
                                label="Êtes-vous baptisé(e) par immersion?"
                                description="Nous rappelons que le baptême par immersion ce n'est pas le baptême effectué lorsque vous étiez enfant"
                                value={formData.baptized}
                                onChange={handleSelectChange('baptized')}
                                error={formErrors.baptized}
                            >
                                <Group mt="xs">
                                    <Radio value="yes" label="Oui" />
                                    <Radio value="no" label="Non" />
                                </Group>
                            </Radio.Group>
                        </Group>

                        {showBaptismDateField && (
                            <TextInput
                                label="Date du baptême"
                                type="date"
                                value={formData.baptismDate}
                                onChange={handleChange('baptismDate')}
                                mb="md"
                            />
                        )}

                        <Select
                            label="Formation(s) PCNC déjà suivie(s)"
                            value={formData.previousCourses}
                            onChange={(value) => setFormData({...formData, previousCourses: value})}
                            data={[
                                { value: '001', label: '001 - Bienvenue dans le Royaume' },
                                { value: '101', label: '101 - Les Fondements du Royaume' },
                                { value: '201', label: '201 - Puissance et Autorité du Disciple' },
                                { value: '301', label: '301 - Exercer les Dons Spirituels' },
                                { value: 'aucune', label: 'Aucune formation suivie' }
                            ]}
                            multiple
                            mb="md"
                        />

                        <Divider my="lg" />

                        <Title order={3} mb="md">Horaire Préféré</Title>

                        <Text size="sm" mb="md" color="dimmed">
                            Les horaires présentés sont en heure de Paris (Fuseau UTC +2). Merci de calculer vos horaires de cours en fonction de votre fuseau. Par exemple, si un créneaux est indiqué Mardi à 1h00 il s'agit de la nuit de lundi à mardi.
                        </Text>

                        <Radio.Group
                            required
                            label="Choisissez votre horaire préféré"
                            value={formData.preferredSchedule}
                            onChange={handleSelectChange('preferredSchedule')}
                            error={formErrors.preferredSchedule}
                            mb="xl"
                        >
                            <Stack mt="xs" spacing="xs">
                                <Radio value="mardi_13h" label="Mardi 13h00-15h00 (Paris) / 7h00-9h00 (Montréal)" />
                                <Radio value="mardi_19h" label="Mardi 19h00-21h00 (Paris) / 13h00-15h00 (Montréal)" />
                                <Radio value="mercredi_01h" label="Mercredi-Jeudi 01h15-03h15 (Paris) / Mercredi 19h15-21h15 (Montréal)" />
                                <Radio value="vendredi_19h" label="Vendredi 19h00-21h00 (Paris) / 13h00-15h00 (Montréal)" />
                                <Radio value="dimanche_16h" label="Dimanche 16h00-18h00 (Paris) / 10h00-12h00 (Montréal)" />
                            </Stack>
                        </Radio.Group>

                        <Textarea
                            label="Commentaires ou informations complémentaires"
                            value={formData.comments}
                            onChange={handleChange('comments')}
                            mb="xl"
                        />

                        <Divider my="lg" />

                        <Title order={3} mb="md">Protection des Données</Title>

                        <Checkbox
                            required
                            checked={gdprConsent.dataProcessing}
                            onChange={handleConsentChange('dataProcessing')}
                            error={formErrors.gdpr}
                            label={
                                <Text size="sm">
                                    J'accepte que mes informations personnelles soient collectées et traitées par Impact Centre Chrétien selon les termes de la politique de confidentialité.
                                </Text>
                            }
                            mb="md"
                        />

                        <Text size="xs" color="dimmed" mb="lg">
                            Les informations demandées ici seront utilisées pour les nécessités de la gestion interne d'Impact Centre Chrétien. Elles pourront donner lieu à l'exercice du droit d'accès dans les conditions prévues par la loi 78/17 du 6 janvier 1978 relative à l'informatique, aux fichiers et aux libertés. Si vous souhaitez nous signifier tout changement, modification, radiation, merci d'envoyer un mail à contact@impactcentrechretien.com.
                            <br /><br />
                            ICC ne pratique pas la commercialisation des données de nos adhérents ou invités sachez qu'ICC dispose d'un délégué à la protection des données, à tout moment vous pourrez l'écrire à l'adresse mail : dpo.icc@impactcentrechretien.com
                        </Text>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            style={{
                                background: 'linear-gradient(135deg, #662D91, #00B0CA)',
                                color: '#ffffff',
                            }}
                            component={motion.button}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Soumettre l'inscription
                        </Button>
                    </form>
                </Box>
            </Container>
        </Box>
    );
};

export default RegistrationPage;
