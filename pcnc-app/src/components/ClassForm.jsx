import { useForm } from '@mantine/form';
import { useEffect, useMemo } from 'react';
import {
    Modal, TextInput, Select, Button, Group, NumberInput, Text, Stack
} from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';


const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
function formatClassName({
                             type,
                             region,
                             version,
                             className,
                             courseCode,
                             month,
                             year,
                             dayName,
                             hour,
                             minutes,
                             lang
                         }) {
    const time = `${hour}h${minutes}`;
    if (type === 'onsite') {
        return `ONSITE - ${region} - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    } else {
        return `Corp - ${version} - ${className} - ${courseCode} - ${month} ${year} - ${dayName} - ${time} - ${lang}`;
    }
}

const ClassForm = ({ opened, onClose, onSubmit, existingGroups = [], classToEdit }) => {
    const { t } = useTranslation();
    const form = useForm({
        initialValues: {
            type: 'online',
            region: '',
            version: '',
            className: '',
            courseCode: '',
            month: months[0],
            year: 2025,
            dayName: '',
            hour: '',
            minutes: '',
            lang: ''
        },
        validate: {
            version: (value) => (value.trim() ? null : 'Version is required'),
            className: (value) => (value.trim() ? null : 'Class name is required'),
            courseCode: (value) => (/^\d{3}$/.test(value) ? null : 'Course code must be 3 digits'),
            year: (value) => (value >= 2025 ? null : 'Year must be >= 2025'),
            dayName: (value) => (value.trim() ? null : 'Day name is required'),
            hour: (value) => (value.trim() ? null : 'Hour is required'),
            minutes: (value) => (value.trim() ? null : 'Minutes is required'),
            lang: (value) => (value.trim() ? null : 'Language is required'),
        },
    });
    const groupName = useMemo(
        () => formatClassName(form.values),
        [form.values]
    );
    // Reset form when editing a class
    useEffect(() => {
        if (classToEdit) {
            form.setValues({
                type: classToEdit.type || 'online',
                region: classToEdit.region || '',
                version: classToEdit.version || '',
                className: classToEdit.className || '',
                courseCode: classToEdit.courseCode || '',
                month: classToEdit.month || months[0],
                year: classToEdit.year || 2025,
                dayName: classToEdit.dayName || '',
                hour: classToEdit.hour || '',
                minutes: classToEdit.minutes || '',
                lang: classToEdit.lang || ''
            });
        } else {
            form.reset();
        }
    }, [classToEdit, opened]);
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={classToEdit ? t('classForm.editClass') : t('classForm.createNewClass')}
            size={{ base: '100%', sm: 600 }}
            centered
        >
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Text size="lg" weight={700} mb="md" color="blue" style={{ wordBreak: 'break-all' }}>
                    {groupName}
                </Text>


                <Stack>
                    <Select
                        label={t('classForm.classType')}
                        data={[
                            { value: 'online', label: t('classForm.online') },
                            { value: 'onsite', label: t('classForm.onsite') },
                        ]}
                        {...form.getInputProps('type')}
                        fullWidth
                    />

                    {(form.values.type === 'onsite') && (
                        <TextInput
                            label={t('classManager.region')}
                            required
                            {...form.getInputProps('region')}
                            fullWidth
                        />
                    )}

                    <TextInput label="Version" required {...form.getInputProps('version')} fullWidth />
                    <TextInput label="Class Name" required {...form.getInputProps('className')} fullWidth />
                    <TextInput label={t('classManager.courseCode')} placeholder="101" required {...form.getInputProps('courseCode')} fullWidth />
                    <Select label={t('classManager.month')} data={months} required {...form.getInputProps('month')} fullWidth />
                    <NumberInput label={t('classManager.year')} min={2025} required {...form.getInputProps('year')} fullWidth />
                    <TextInput label="Day Name" required {...form.getInputProps('dayName')} fullWidth />
                    <TextInput label="Hour" required {...form.getInputProps('hour')} fullWidth />
                    <TextInput label="Minutes" required {...form.getInputProps('minutes')} fullWidth />
                    <TextInput label="Language" required {...form.getInputProps('lang')} fullWidth />

                    <Group position="right" mt="md" grow>
                        <Button type="submit" leftIcon={<IconBook />} fullWidth>
                            {classToEdit ? t('classForm.btnUpdate') : t('classForm.btnCreate')}
                        </Button>
                    </Group>
                </Stack>
            </form>

            <div className="mt-4">
                <Text size="sm" fw={500}>
                    {t('classForm.existingGroups')}
                </Text>
                {Array.isArray(existingGroups) && existingGroups.length > 0 ? (
                    <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {existingGroups.map((group) => (
                            <Text key={group.id} size="sm" color="dimmed">
                                {group.name}
                            </Text>
                        ))}
                    </div>
                ) : (
                    <Text size="sm" color="dimmed">
                        {t('classForm.noGroups')}
                    </Text>
                )}
            </div>
        </Modal>
    );
};

export default ClassForm;
