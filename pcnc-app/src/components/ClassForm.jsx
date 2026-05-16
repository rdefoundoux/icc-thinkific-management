import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from '@mantine/form';
import {
    Modal, TextInput, Select, Button, Group, NumberInput, Text, Stack,
    Alert, Badge, Loader, ActionIcon, Tooltip
} from '@mantine/core';
import { IconBook, IconVideo, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';

const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const ClassForm = ({ opened, onClose, onSubmit, existingGroups = [], classToEdit }) => {
    const { t } = useTranslation();
    const [creatingZoomMeeting, setCreatingZoomMeeting] = useState(false);
    const [zoomMeetingInfo, setZoomMeetingInfo] = useState(null);

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

    const groupName = useMemo(() => {
        const values = form.values;
        return values.type === 'onsite'
            ? `ONSITE - ${values.region} - ${values.version} - ${values.className} - ${values.courseCode} - ${values.month} ${values.year} - ${values.dayName} - ${values.hour}h${values.minutes} - ${values.lang}`
            : `Corp - ${values.version} - ${values.className} - ${values.courseCode} - ${values.month} ${values.year} - ${values.dayName} - ${values.hour}h${values.minutes} - ${values.lang}`;
    }, [form.values]);

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
            setZoomMeetingInfo(classToEdit.zoomMeeting || null);
        } else {
            form.reset();
            setZoomMeetingInfo(null);
        }
    }, [classToEdit, opened]);

    const handleSubmit = async (values) => {
        await onSubmit(values);
    };

    const createZoomMeeting = async () => {
        if (!classToEdit?._id) {
            notifications.show({
                title: t('error'),
                message: t('classForm.saveFirst'),
                color: 'red'
            });
            return;
        }

        setCreatingZoomMeeting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classToEdit._id}/create-zoom-meeting`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                setZoomMeetingInfo(data.meeting);
                notifications.show({
                    title: t('success'),
                    message: t('classForm.zoomCreated'),
                    color: 'green'
                });
            } else {
                notifications.show({
                    title: t('error'),
                    message: data.error,
                    color: 'red'
                });
            }
        } catch (error) {
            notifications.show({
                title: t('error'),
                message: t('classForm.zoomFailed'),
                color: 'red'
            });
        } finally {
            setCreatingZoomMeeting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={classToEdit ? t('classForm.editClass') : t('classForm.createNewClass')}
            size="xl"
        >
            <Stack>
                <Text size="lg" weight={700} color="blue">
                    {groupName}
                </Text>

                {zoomMeetingInfo && (
                    <Alert icon={<IconVideo size={16} />} title={t('classForm.zoomMeeting')} color="green">
                        <Stack spacing="xs">
                            <Text size="sm"><strong>{t('classForm.meetingId')}:</strong> {zoomMeetingInfo.meetingId}</Text>
                            <Text size="sm"><strong>{t('classForm.hostAccount')}:</strong> {zoomMeetingInfo.hostEmail}</Text>
                            <Text size="sm">
                                <strong>{t('classForm.joinUrl')}:</strong>
                                <a href={zoomMeetingInfo.joinUrl} target="_blank" rel="noopener noreferrer">
                                    {t('classForm.joinMeeting')}
                                </a>
                            </Text>
                        </Stack>
                    </Alert>
                )}

                <form onSubmit={form.onSubmit(handleSubmit)}>
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

                    <TextInput label="Version" required {...form.getInputProps('version')} />
                    <TextInput label="Class Name" required {...form.getInputProps('className')} />
                    <TextInput label={t('classManager.courseCode')} placeholder="101" required {...form.getInputProps('courseCode')} />
                    <Select label={t('classManager.month')} data={months} required {...form.getInputProps('month')} />
                    <NumberInput label={t('classManager.year')} min={2025} required {...form.getInputProps('year')} />
                    <TextInput label="Day Name" required {...form.getInputProps('dayName')} />
                    <TextInput label="Hour" required {...form.getInputProps('hour')} />
                    <TextInput label="Minutes" required {...form.getInputProps('minutes')} />
                    <TextInput label="Language" required {...form.getInputProps('lang')} />

                    <Group position="apart" mt="md">
                        <Button type="submit" leftIcon={<IconBook />}>
                            {classToEdit ? t('classForm.btnUpdate') : t('classForm.btnCreate')}
                        </Button>

                        {classToEdit && (
                            <Button
                                leftIcon={<IconVideo />}
                                onClick={createZoomMeeting}
                                loading={creatingZoomMeeting}
                                variant="outline"
                                disabled={!!zoomMeetingInfo}
                            >
                                {zoomMeetingInfo ? t('classForm.meetingCreated') : t('classForm.createZoomMeeting')}
                            </Button>
                        )}
                    </Group>
                </form>
            </Stack>
        </Modal>
    );
};

export default ClassForm;
