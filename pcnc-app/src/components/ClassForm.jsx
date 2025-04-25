import { useForm } from '@mantine/form';
import {
    Modal,
    TextInput,
    Select,
    Button,
    Group,
    NumberInput,
    Text
} from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ClassForm = ({ opened, onClose, onSubmit, existingGroups = [] }) => {
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

    return (
        <Modal opened={opened} onClose={onClose} title={t('classForm.createNewClass')} size="lg">
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Select
                    label={t('classForm.classType')}
                    data={[
                        { value: 'online', label: t('classForm.online') },
                        { value: 'onsite', label: t('classForm.onsite') },
                    ]}
                    {...form.getInputProps('type')}
                />

                {(form.values.type === 'onsite') && (
                    <TextInput
                        label={t('classManager.region')}
                        required
                        {...form.getInputProps('region')}
                    />
                )}

                <TextInput
                    label="Version"
                    required
                    {...form.getInputProps('version')}
                />
                <TextInput
                    label="Class Name"
                    required
                    {...form.getInputProps('className')}
                />
                <TextInput
                    label={t('classManager.courseCode')}
                    placeholder="101"
                    required
                    {...form.getInputProps('courseCode')}
                />
                <Select
                    label={t('classManager.month')}
                    data={months}
                    required
                    {...form.getInputProps('month')}
                />
                <NumberInput
                    label={t('classManager.year')}
                    min={2025}
                    required
                    {...form.getInputProps('year')}
                />
                <TextInput
                    label="Day Name"
                    required
                    {...form.getInputProps('dayName')}
                />
                <TextInput
                    label="Hour"
                    required
                    {...form.getInputProps('hour')}
                />
                <TextInput
                    label="Minutes"
                    required
                    {...form.getInputProps('minutes')}
                />
                <TextInput
                    label="Language"
                    required
                    {...form.getInputProps('lang')}
                />

                <Group position="right" mt="md">
                    <Button type="submit" leftIcon={<IconBook />}>
                        {t('classForm.btnCreate')}
                    </Button>
                </Group>
            </form>

            <div className="mt-4">
                <Text size="sm" weight={500}>
                    {t('classForm.existingGroups')}
                </Text>
                {Array.isArray(existingGroups) && existingGroups.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto">
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
