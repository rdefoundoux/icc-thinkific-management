import React, { useEffect, useState } from 'react';
import {
    Modal, Group, Text, Avatar, Title, Badge, Loader,
    Stack, Paper, Image, Flex, Divider, Grid, ActionIcon
} from '@mantine/core';
import { MantineReactTable } from 'mantine-react-table';
import { IconUsers, IconCertificate, IconZoomCheck, IconFilter, IconArrowsSort } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MRT_Localization_EN } from 'mantine-react-table/locales/en/index.cjs';
import { MRT_Localization_FR } from 'mantine-react-table/locales/fr/index.cjs';

const localeMap = {
    en: MRT_Localization_EN,
    fr: MRT_Localization_FR,
};

export default function ClassDetailsModal({ opened, onClose, classData }) {
    const { t } = useTranslation();
    const { i18n } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentLocale = localeMap[i18n.language] || MRT_Localization_EN;

    const staff = classData?.staff || {
        teacher: null,
        coordinator: null,
        rsf: [],
        sf: []
    };

    const studentColumns = [
        {
            accessorKey: 'avatar',
            header: t('common.student'),
            size: 250,
            Cell: ({ row }) => (
                <Group>
                    <Avatar src={row.original.avatarUrl} size={40} radius="xl" />
                    <div>
                        <Text weight={500}>{row.original.firstName} {row.original.lastName}</Text>
                        <Text size="sm" c="dimmed">{row.original.email}</Text>
                    </div>
                </Group>
            ),
            enableSorting: false,
        },
        {
            accessorKey: 'city',
            header: t('common.location'),
            filterVariant: 'select',
            Cell: ({ row }) => (
                <Text>
                    {row.original.city}, {row.original.country}
                </Text>
            ),
        },
        {
            accessorKey: 'iccMember',
            header: t('classManager.iccMember'),
            filterVariant: 'checkbox',
            Cell: ({ row }) => (
                <Badge color={row.original.iccMember ? 'green' : 'yellow'} variant="light">
                    {row.original.iccMember ? t('common.yes') : t('common.no')}
                </Badge>
            ),
        },
        {
            accessorKey: 'thinkificId',
            header: t('common.status'),
            Cell: ({ row }) => (
                <Badge
                    leftSection={row.original.thinkificId && <IconCertificate size={16} />}
                    color={row.original.thinkificId ? 'teal' : 'orange'}
                    variant="light"
                >
                    {row.original.thinkificId ? t('common.synced') : t('common.pending')}
                </Badge>
            ),
            filterVariant: 'select',
            filterSelectOptions: [t('common.synced'), t('common.pending')],
        },
    ];

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="100%"
            title={
                <Group spacing="xs">
                    <IconZoomCheck size={24} />
                    <Title order={3}>{t('classDetails.title')}</Title>
                </Group>
            }
            overlayProps={{ blur: 3 }}
        >
            {!classData ? (
                <Loader />
            ) : (
                <Stack spacing="lg">
                    {/* Class Header */}
                    <Paper p="md" withBorder shadow="xs">
                        <Group position="apart">
                            <div>
                                <Text size="xl" weight={600}>{classData.thinkificGroupName}</Text>
                                <Text c="dimmed">{classData.courseCode} • {classData.students?.length} {t('common.students')}</Text>
                            </div>
                            <Badge
                                size="lg"
                                variant="gradient"
                                gradient={{ from: 'indigo', to: 'cyan' }}
                            >
                                {classData.type === 'online' ? t('common.online') : t('common.onsite')}
                            </Badge>
                        </Group>
                    </Paper>

                    {/* Teaching Team Section */}
                    <Paper p="md" withBorder>
                        <Title order={4} mb="md">{t('classDetails.teachingTeam')}</Title>
                        <Grid gutter="xl">
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" c="dimmed" mb="xs">{t('classManager.teacher')}</Text>
                                    {staff.teacher ? (
                                        <Group>
                                            <Avatar src={staff.teacher.avatarUrl} size="lg" />
                                            <div>
                                                <Text weight={500}>{staff.teacher.firstName} {staff.teacher.lastName}</Text>
                                                <Text size="sm" c="dimmed">{staff.teacher.email}</Text>
                                            </div>
                                        </Group>
                                    ) : (
                                        <Text c="dimmed">{t('common.unassigned')}</Text>
                                    )}
                                </div>
                            </Grid.Col>

                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" c="dimmed" mb="xs">{t('common.coordinator')}</Text>
                                    {staff.coordinator ? (
                                        <Group>
                                            <Avatar src={staff.coordinator.avatarUrl} size="lg" />
                                            <div>
                                                <Text weight={500}>{staff.coordinator.firstName} {staff.coordinator.lastName}</Text>
                                                <Text size="sm" c="dimmed">{staff.coordinator.email}</Text>
                                            </div>
                                        </Group>
                                    ) : (
                                        <Text c="dimmed">{t('common.unassigned')}</Text>
                                    )}
                                </div>
                            </Grid.Col>
                        </Grid>

                        <Divider my="md" />

                        <Grid gutter="xl"  style={{ height: '100%', overflow: 'auto'}}>
                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" c="dimmed" mb="xs">{t('common.rsf')}</Text>
                                    {staff.rsf?.length > 0 ? (
                                        <Group spacing="xs">
                                            {staff.rsf.map((rsf, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="dot"
                                                    color="blue"
                                                    leftSection={<Avatar src={rsf.avatarUrl} size={20} radius="xl" />}
                                                    style={{ height: '100%' }}
                                                >
                                                    {rsf.firstName} {rsf.lastName}
                                                </Badge>
                                            ))}
                                        </Group>
                                    ) : (
                                        <Text c="dimmed">{t('common.noneAssigned')}</Text>
                                    )}
                                </div>
                            </Grid.Col>

                            <Grid.Col span={6}>
                                <div>
                                    <Text size="sm" c="dimmed" mb="xs">{t('common.sf')}</Text>
                                    {staff.sf?.length > 0 ? (
                                        <Group spacing="xs">
                                            {staff.sf.map((sf, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="dot"
                                                    color="grape"
                                                    leftSection={<Avatar src={sf.avatarUrl} size={20} radius="xl" />}
                                                    style={{ height: '100%' }}
                                                >
                                                    {sf.firstName} {sf.lastName}
                                                </Badge>
                                            ))}
                                        </Group>
                                    ) : (
                                        <Text c="dimmed">{t('common.noneAssigned')}</Text>
                                    )}
                                </div>
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    {/* Students Table */}
                    <Paper withBorder shadow="xs">
                        <MantineReactTable
                            columns={studentColumns}
                            data={classData.students || []}
                            localization={currentLocale}
                            enablePagination
                            enableSorting
                            enableColumnFilterModes
                            enableColumnResizing
                            initialState={{
                                pagination: { pageSize: 10, pageIndex: 0 },
                                showColumnFilters: true,
                                density: 'xs'
                            }}
                            mantineTableProps={{
                                striped: true,
                            }}
                            mantineTableContainerProps={{
                                style: {  maxHeight: '100%', // Use 100% or a specific height like 500px
                                    overflowY: 'auto',
                                },
                            }}
                            mantineTableHeadCellFilterTextFieldProps={{
                                variant: 'filled',
                                placeholder: t('common.filter'),
                            }}
                            mantineTableHeadCellProps={{
                                sx: {
                                    '& .Mui-TableHeadCell-Content': {
                                        fontWeight: 600,
                                    }
                                }
                            }}
                            displayColumnDefOptions={{
                                'mrt-row-actions': {
                                    header: t('common.actions'),
                                },
                            }}
                            renderTopToolbarCustomActions={() => (
                                <Group spacing="xs" px="sm">
                                    <IconUsers size={20} />
                                    <Text size="lg" weight={600}>
                                        {classData.students?.length} {t('common.students')}
                                    </Text>
                                </Group>
                            )}
                        />
                    </Paper>
                </Stack>
            )}
        </Modal>
    );
}
