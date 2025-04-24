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
            r35Version: '',
            rubiEdition: '',
            courseCode: '',
            month: months[0],
            year: 2025
        },
        validate: {
            r35Version: (value) => (value.trim() ? null : t('classForm.r35Required')),
            rubiEdition: (value) => (value.trim() ? null : t('classForm.rubiRequired')),
            courseCode: (value) =>
                /^\d{3}$/.test(value) ? null : t('classForm.courseCodeInvalid'),
            year: (value) => (value >= 2025 ? null : t('classForm.yearInvalid')),
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

                {form.values.type === 'onsite' && (
                    <TextInput
                        label={t('classManager.region')}
                        required
                        {...form.getInputProps('region')}
                    />
                )}

                <TextInput
                    label={t('classForm.r35Version')}
                    placeholder="R35.1"
                    required
                    {...form.getInputProps('r35Version')}
                />

                <TextInput
                    label={t('classForm.rubiEdition')}
                    placeholder="Rubi 2.0"
                    required
                    {...form.getInputProps('rubiEdition')}
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
