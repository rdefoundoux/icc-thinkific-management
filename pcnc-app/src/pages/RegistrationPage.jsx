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
    Stack,
    Image,
    Radio,
    Alert,
    Textarea
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopNav from '../components/TopNav';
import { getClassesForRegistration } from '../api/classes';

const RegistrationPage = () => {
    const [classOptions, setClassOptions] = useState([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [egliseOptions, setEgliseOptions] = useState([]);
    const [loadingEglises, setLoadingEglises] = useState(true);
    const [countryOptions, setCountryOptions] = useState([]);
    const { t, i18n } = useTranslation();

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

    useEffect(() => {
        const fetchCountries = async () => {
            const lang = i18n.language;
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/countries?lang=${lang}`);
            const data = await response.json();
            setCountryOptions(data);
        };
        fetchCountries();
    }, [i18n.language]);

    useEffect(() => {
        const fetchEglises = async () => {
            try {
                setLoadingEglises(true);
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/egliseicc`);
                const data = await response.json();
                const options = data.map(e => ({
                    value: e.name,
                    label: e.name
                }));
                setEgliseOptions(options);
            } catch (err) {
                setEgliseOptions([]);
            } finally {
                setLoadingEglises(false);
            }
        };
        fetchEglises();
    }, []);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoadingClasses(true);
                const { data } = await getClassesForRegistration(1, 100);
                const registrable = data.map(cls => ({
                    value: cls._id,
                    label: `${cls.thinkificGroupName}`
                }));
                setClassOptions(registrable);
            } catch (error) {
                notifications.show({
                    title: t('errors.error'),
                    message: t('errors.classLoadFailed'),
                    color: 'red'
                });
                setClassOptions([]);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, [t]);

    const [gdprConsent, setGdprConsent] = useState({ dataProcessing: false });
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [showIccFields, setShowIccFields] = useState(false);
    const [showBaptismDateField, setShowBaptismDateField] = useState(false);
    const [showPreviousCourseFields, setShowPreviousCourseFields] = useState(false);

    useEffect(() => {
        setShowIccFields(formData.iccMember);
        setShowBaptismDateField(formData.baptized === 'yes');
        setShowPreviousCourseFields(formData.previousCourses.length > 0);
    }, [formData.iccMember, formData.baptized, formData.previousCourses]);

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
    };

    const calculateAge = (birthDate) => {
        const diff = Date.now() - new Date(birthDate).getTime();
        return new Date(diff).getUTCFullYear() - 1970;
    };

    const handleSelectChange = (field) => (value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleCheckboxChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.currentTarget.checked });
    };

    const handleConsentChange = (field) => (event) => {
        setGdprConsent({ ...gdprConsent, [field]: event.currentTarget.checked });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.lastName) errors.lastName = t('errors.required');
        if (!formData.firstName) errors.firstName = t('errors.required');
        if (!formData.email) errors.email = t('errors.required');
        if (!formData.whatsappNumber) errors.whatsappNumber = t('errors.required');
        if (!formData.birthDate) errors.birthDate = t('errors.required');
        if (!formData.gender) errors.gender = t('errors.required');
        if (!formData.localChurch) errors.localChurch = t('errors.required');
        if (!formData.baptized) errors.baptized = t('errors.required');
        if (!formData.preferredSchedule) errors.preferredSchedule = t('errors.required');
        if (!gdprConsent.dataProcessing) errors.gdpr = t('errors.gdprRequired');

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            notifications.show({
                title: t('errors.validationError'),
                message: t('errors.correctForm'),
                color: 'red',
                withBorder: true,
            });
            return;
        }

        const age = calculateAge(formData.birthDate);
        if (age < 18) {
            navigate('/parent-auth', { state: { formData: { ...formData, gdprConsent } }});
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, ThinkificId: "", gdprConsent }),
            });

            if (!response.ok) throw new Error(t('errors.registrationFailed'));

            notifications.show({
                title: t('success.title'),
                message: t('success.message'),
                color: 'green',
            });
            navigate('/registration-success');
        } catch (err) {
            notifications.show({
                title: t('errors.registrationError'),
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
            <TopNav showLoginButton />
            <Container size="lg" py="xl" style={{ flex: 1 }}>
                <Box mb={30}>
                    <Stack align="center" spacing="md" mb={30}>
                        <Group position="center" spacing="xl">
                            <Image src="/src/assets/001-Nr-1.png" alt={t('registration.title')} height={80} />
                            <Image src="/src/assets/101-Nr-1.png" alt={t('registration.title')} height={80} />
                            <Image src="/src/assets/201-Nr-1.png" alt={t('registration.title')} height={80} fit="contain" />
                        </Group>
                    </Stack>
                    <Title order={1} align="center" mb="lg">{t('registration.title')}</Title>
                    <Text align="center" size="md" mb={20}>{t('registration.subtitle')}</Text>
                </Box>

                <Alert icon={<IconAlertCircle size={16} />} title={t('registration.alerts.warning')} color="blue" mb={30}>
                    <Text size="sm" mb={10}>
                        <strong>*** {t('registration.alerts.info')} 1 ***</strong><br />
                        {t('registration.alerts.info1')}
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** {t('registration.alerts.info')} 2 ***</strong><br />
                        {t('registration.alerts.info2')}
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** {t('registration.alerts.info')} 3 ***</strong><br />
                        {t('registration.alerts.info3')}
                    </Text>
                    <Text size="sm" mb={10}>
                        <strong>*** {t('registration.alerts.info')} 4 ***</strong><br />
                        {t('registration.alerts.info4')}
                    </Text>
                    <Text size="sm">
                        <strong>*** {t('registration.alerts.info')} 5 ***</strong><br />
                        {t('registration.alerts.info5')}
                    </Text>
                </Alert>


                <Box sx={(theme) => ({
                    backgroundColor: theme.white,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.xl,
                    boxShadow: theme.shadows.md
                })}>
                    <form onSubmit={handleSubmit}>
                        <LoadingOverlay visible={loading} />
                        <Title order={3} mb="md">{t('registration.personalInfo')}</Title>

                        <Group grow mb="md">
                            <TextInput
                                required
                                label={t('registration.lastName')}
                                description={t('registration.firstNameDescription')}
                                value={formData.lastName}
                                onChange={handleChange('lastName')}
                                error={formErrors.lastName}
                                placeholder="DOE"
                            />
                            <TextInput
                                required
                                label={t('registration.firstName')}
                                description={t('registration.firstName')}
                                value={formData.firstName}
                                onChange={handleChange('firstName')}
                                error={formErrors.firstName}
                                placeholder="John"
                            />
                        </Group>

                        <Group grow mb="md">
                            <TextInput
                                required
                                label={t('registration.email')}
                                type="email"
                                description={t('registration.emailDescription')}
                                value={formData.email}
                                onChange={handleChange('email')}
                                error={formErrors.email}
                                placeholder="john.doe@example.com"
                            />
                            <TextInput
                                required
                                label={t('registration.whatsapp')}
                                description={t('registration.whatsappDescription')}
                                value={formData.whatsappNumber}
                                onChange={handleChange('whatsappNumber')}
                                error={formErrors.whatsappNumber}
                                placeholder="+33 6 12 34 56 78"
                            />
                        </Group>

                        <TextInput
                            label={t('registration.address')}
                            value={formData.address}
                            onChange={handleChange('address')}
                            mb="md"
                        />

                        <Group grow mb="md">
                            <TextInput
                                label={t('registration.city')}
                                value={formData.city}
                                onChange={handleChange('city')}
                            />
                            <TextInput
                                label={t('registration.postalCode')}
                                value={formData.postalCode}
                                onChange={handleChange('postalCode')}
                            />
                            <TextInput
                                label={t('registration.department')}
                                description={t('registration.departmentDescription')}
                                value={formData.department}
                                onChange={handleChange('department')}
                                error={formErrors.department}
                                placeholder="75"
                            />
                        </Group>

                        <Group grow mb="md">
                            <Select
                                label={t('registration.country')}
                                value={formData.country}
                                onChange={handleSelectChange('country')}
                                data={countryOptions}
                                searchable
                                placeholder={t('common.selectCountry')}
                            />
                            <TextInput
                                required
                                label={t('registration.birthDate')}
                                type="date"
                                value={formData.birthDate}
                                onChange={handleChange('birthDate')}
                                error={formErrors.birthDate}
                            />
                            <Select
                                required
                                label={t('registration.gender')}
                                value={formData.gender}
                                onChange={handleSelectChange('gender')}
                                error={formErrors.gender}
                                data={[
                                    { value: 'homme', label: t('common.male') },
                                    { value: 'femme', label: t('common.female') }
                                ]}
                            />
                        </Group>

                        <Divider my="lg" />
                        <Title order={3} mb="md">{t('registration.churchInfo')}</Title>

                        <Select
                            required
                            label={t('registration.localChurch')}
                            description={t('registration.churchDescription')}
                            value={formData.localChurch}
                            onChange={handleSelectChange('localChurch')}
                            error={formErrors.localChurch}
                            data={egliseOptions}
                            placeholder={loadingEglises ? t('common.loading') : t('common.selectChurch')}
                            searchable
                            nothingFound={t('common.noChurchFound')}
                            mb="md"
                        />

                        {formData.localChurch === 'non_icc' && (
                            <TextInput
                                label={t('registration.nonIccChurch')}
                                description={t('registration.nonIccChurchDescription')}
                                value={formData.nonIccChurch}
                                onChange={handleChange('nonIccChurch')}
                                mb="md"
                            />
                        )}

                        <Checkbox
                            label={t('registration.iccMember')}
                            checked={formData.iccMember}
                            onChange={handleCheckboxChange('iccMember')}
                            mb="md"
                        />

                        {showIccFields && (
                            <>
                                <Group grow mb="md">
                                    <TextInput
                                        label={t('registration.memberSince')}
                                        type="date"
                                        value={formData.memberSince}
                                        onChange={handleChange('memberSince')}
                                    />
                                    <Select
                                        label={t('registration.iccCampus')}
                                        value={formData.iccCampus}
                                        onChange={handleSelectChange('iccCampus')}
                                        data={[
                                            { value: 'paris', label: t('common.paris') },
                                            { value: 'montreal', label: t('common.montreal') },
                                            { value: 'bruxelles', label: t('common.brussels') },
                                            { value: 'martinique', label: t('common.martinique') },
                                            { value: 'guadeloupe', label: t('common.guadeloupe') },
                                            { value: 'guyane', label: t('common.guyane') }
                                        ]}
                                    />
                                </Group>
                                <TextInput
                                    label={t('registration.staffMember')}
                                    description={t('registration.staffMemberDescription')}
                                    value={formData.staffMember}
                                    onChange={handleChange('staffMember')}
                                    mb="md"
                                />
                            </>
                        )}

                        <Divider my="lg" />
                        <Title order={3} mb="md">{t('registration.spiritualInfo')}</Title>

                        <Group grow mb="md">
                            <TextInput
                                label={t('registration.convertedDate')}
                                type="date"
                                value={formData.convertedDate}
                                onChange={handleChange('convertedDate')}
                            />
                            <Radio.Group
                                required
                                label={t('registration.baptized')}
                                description={t('registration.baptizedDescription')}
                                value={formData.baptized}
                                onChange={handleSelectChange('baptized')}
                                error={formErrors.baptized}
                            >
                                <Group mt="xs">
                                    <Radio value="yes" label={t('common.yes')} />
                                    <Radio value="no" label={t('common.no')} />
                                </Group>
                            </Radio.Group>
                        </Group>

                        {showBaptismDateField && (
                            <TextInput
                                label={t('registration.baptismDate')}
                                type="date"
                                value={formData.baptismDate}
                                onChange={handleChange('baptismDate')}
                                mb="md"
                            />
                        )}

                        <Select
                            label={t('registration.previousCourses')}
                            value={formData.previousCourses}
                            onChange={(value) => setFormData({...formData, previousCourses: value})}
                            data={[
                                { value: '001', label: '001 - ' + t('courses.course001') },
                                { value: '101', label: '101 - ' + t('courses.course101') },
                                { value: '201', label: '201 - ' + t('courses.course201') },
                                { value: '301', label: '301 - ' + t('courses.course301') },
                                { value: 'aucune', label: t('common.none') }
                            ]}
                            multiple
                            mb="md"
                        />

                        <Divider my="lg" />
                        <Title order={3} mb="md">{t('registration.schedulePref')}</Title>
                        <Text size="sm" mb="md" color="dimmed">{t('registration.scheduleDescription')}</Text>

                        <Select
                            required
                            label={t('registration.preferredSchedule')}
                            value={formData.preferredSchedule}
                            onChange={handleSelectChange('preferredSchedule')}
                            error={formErrors.preferredSchedule}
                            data={classOptions}
                            placeholder={t('common.selectClass')}
                            mb="xl"
                            searchable
                            nothingFound={t('common.noClassesFound')}
                            clearable
                        />

                        <Textarea
                            label={t('registration.comments')}
                            value={formData.comments}
                            onChange={handleChange('comments')}
                            mb="xl"
                        />

                        <Divider my="lg" />
                        <Title order={3} mb="md">{t('registration.dataProtection')}</Title>

                        <Checkbox
                            required
                            checked={gdprConsent.dataProcessing}
                            onChange={handleConsentChange('dataProcessing')}
                            error={formErrors.gdpr}
                            label={<Text size="sm">{t('registration.gdprConsent')}</Text>}
                            mb="md"
                        />

                        <Text size="xs" color="dimmed" mb="lg">
                            {t('registration.gdprFullText')}
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
                            {t('registration.submit')}
                        </Button>
                    </form>
                </Box>
            </Container>
        </Box>
    );
};

export default RegistrationPage;
