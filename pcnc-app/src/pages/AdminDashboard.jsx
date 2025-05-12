import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminClasses, usePendingStudents, useCoordinators, useSFs, useValidateStudents, useSyncThinkific, useAssignStudentsToClasses } from '../hooks/useAdmin';
import {
    Accordion, ActionIcon, Avatar, Badge, Box, Button, Card, Checkbox, Flex,
    Group, Image, LoadingOverlay, Paper, Table, Text, Title
} from '@mantine/core';
import {
    IconChevronDown, IconChevronUp, IconCloudUpload, IconId, IconRefresh,
    IconSchool, IconSettings, IconUserCheck, IconUsers, IconZoomCheck
} from '@tabler/icons-react';
import ClassDetailsModal from '../components/ClassDetailsModal';
import { MantineReactTable } from 'mantine-react-table';
import { useTranslation } from 'react-i18next';
import "../styles/dashboard.css";

const ALL_SECTION_KEYS = ['classes', 'pending', 'coordinators', 'sfs'];

const AdminDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [expandedSections, setExpandedSections] = useState(ALL_SECTION_KEYS);
    const [selectedClass, setSelectedClass] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const { data: classes } = useAdminClasses();
    const { data: pendingStudents, refetch: refetchPending } = usePendingStudents();
    const { data: coordinators } = useCoordinators();
    const { data: sfs } = useSFs();

    const validateMutation = useValidateStudents();
    const syncMutation = useSyncThinkific();
    const assignMutation = useAssignStudentsToClasses();

    function shapeClassData(cls) {
        return {
            ...cls,
            thinkificGroup: { name: cls.thinkificGroupName },
            staff: {
                teacher: cls.teacher,
                coordinator: cls.coordinator,
                rsf: cls.rsf || [],
                sf: cls.sf || [],
            },
            students: cls.students || [],
            thinkificGroupId: cls.thinkificGroupId,
        };
    }

    const handleViewDetails = (cls) => {
        setSelectedClass(shapeClassData(cls));
        setDetailsModalOpen(true);
    };

    const handleValidate = async () => {
        try {


            // Get the selected pending students with their details
            const selectedStudentsDetails = pendingStudents.filter(
                student => selectedStudents.includes(student._id)
            );

            // Prepare assignments
            const assignments = [];

            selectedStudentsDetails.forEach(student => {
                if (student.preferredSchedule) {
                    // preferredSchedule is the class ID
                    const matchingClass = classes?.find(cls => {
                        console.log(`Class _id: ${cls._id}, Student Preferred Schedule: ${student.preferredSchedule}`); // Log both values
                        return cls._id === student.preferredSchedule; // Compare by _id, not group name!
                    });

                    if (matchingClass && !matchingClass.students.includes(student._id)) {
                        assignments.push({
                            classId: matchingClass._id,
                            studentId: student._id
                        });

                    }
                }
            });


            // Assign students to classes
            if (assignments.length > 0) {
                await assignMutation.mutateAsync(assignments);
                // Finally, sync with Thinkific
                await syncMutation.mutateAsync(selectedStudents);

            }



            // Clear selection and refresh data
            setSelectedStudents([]);
            refetchPending();
        } catch (error) {
            console.error("Error during validation and assignment:", error);
            // Handle error notification here
        }
    };

    const classColumns = [
        {
            accessorKey: 'thinkificGroupName',
            header: t('classManager.classManagement'),
            size: 200,
            filterFn: 'includesString',
        },
        {
            accessorKey: 'teacher',
            header: t('classManager.teacher'),
            size: 180,
            Cell: ({ row }) => row.original.teacher ? (
                <Group spacing="xs">
                    <Avatar src={row.original.teacher.avatarUrl} size={30} />
                    <Text>{row.original.teacher.firstName} {row.original.teacher.lastName}</Text>
                </Group>
            ) : <Badge color="red">{t('common.unassigned')}</Badge>,
            filterFn: 'includesString',
            accessorFn: row => row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : '',
        },
        {
            accessorKey: 'coordinator',
            header: t('common.coordinator'),
            size: 180,
            Cell: ({ row }) => row.original.coordinator ? (
                <Group spacing="xs">
                    <Avatar src={row.original.coordinator.avatarUrl} size={30} />
                    <Text>{row.original.coordinator.firstName} {row.original.coordinator.lastName}</Text>
                </Group>
            ) : <Badge color="red">{t('common.unassigned')}</Badge>,
            filterFn: 'includesString',
            accessorFn: row => row.coordinator ? `${row.coordinator.firstName} ${row.coordinator.lastName}` : '',
        },
        {
            accessorKey: 'sf',
            header: t('common.sf'),
            size: 140,
            Cell: ({ row }) => (
                <Group spacing="xs">
                    {row.original.sf?.map((sf, i) => (
                        <Badge key={i} color="teal">{sf.firstName} {sf.lastName}</Badge>
                    ))}
                </Group>
            ),
            accessorFn: row => row.sf?.map(sf => `${sf.firstName} ${sf.lastName}`).join(', ') || '',
            filterFn: 'includesString',
        },
        {
            accessorKey: 'rsf',
            header: t('common.rsf'),
            size: 140,
            Cell: ({ row }) => (
                <Group spacing="xs">
                    {row.original.rsf?.map((rsf, i) => (
                        <Badge key={i} color="indigo">{rsf.firstName} {rsf.lastName}</Badge>
                    ))}
                </Group>
            ),
            accessorFn: row => row.rsf?.map(rsf => `${rsf.firstName} ${rsf.lastName}`).join(', ') || '',
            filterFn: 'includesString',
        },
        {
            accessorKey: 'students',
            header: t('common.students'),
            size: 100,
            Cell: ({ row }) => (
                <Group>
                    <IconUsers size={16} />
                    {row.original.students?.length || 0}
                </Group>
            ),
            accessorFn: row => row.students?.length || 0,
            filterVariant: 'range',
            filterFn: 'between',
            sortingFn: (a, b) => (a.original.students?.length || 0) - (b.original.students?.length || 0),
        },
        {
            accessorKey: 'actions',
            header: t('classManager.actions'),
            size: 120,
            enableSorting: false,
            enableColumnFilter: false,
            Cell: ({ row }) => (
                <Button
                    variant="subtle"
                    leftIcon={<IconZoomCheck size={16} />}
                    onClick={() => handleViewDetails(row.original)}
                >
                    {t('common.viewDetails')}
                </Button>
            ),
        },
    ];

    const renderClassesSection = () => (
        <Accordion.Item value="classes">
            <Accordion.Control>
                <Group>
                    <IconSchool size={20} />
                    <Text size="lg" weight={600}>{t('sidebar.classes')}</Text>
                    <Badge variant="filled" color="blue">{classes?.length}</Badge>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Box p="md">
                    <MantineReactTable
                        columns={classColumns}
                        data={classes || []}
                        enablePagination
                        enableSorting
                        enableColumnFilterModes
                        enableColumnResizing
                        initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                            showColumnFilters: true
                        }}
                        mantineTableContainerProps={{
                            style: { maxHeight: '600px' }
                        }}
                    />
                </Box>
            </Accordion.Panel>
        </Accordion.Item>
    );

    const pendingColumns = [
        {
            accessorKey: '_id',
            header: '',
            size: 40,
            Cell: ({ row }) => (
                <Checkbox
                    checked={selectedStudents.includes(row.original._id)}
                    onChange={(e) => {
                        e.stopPropagation(); // Prevent row click from firing
                        const checked = e.currentTarget.checked;
                        setSelectedStudents(prev =>
                            checked ? [...prev, row.original._id] : prev.filter(id => id !== row.original._id)
                        );
                    }}
                />
            ),
            enableSorting: false,
            enableColumnFilter: false
        },
        {
            accessorKey: 'firstName',
            header: t('common.student'),
            size: 200,
            filterFn: 'includesString',
            Cell: ({ row }) => (
                <Group>
                    <Avatar src={row.original.avatarUrl} size={30} radius="xl" />
                    <div>
                        <Text>{row.original.firstName} {row.original.lastName}</Text>
                        <Text size="sm" c="dimmed">{row.original.email}</Text>
                    </div>
                </Group>
            )
        },
        {
            accessorKey: 'whatsappNumber',
            header: t('classManager.whatsapp'),
            size: 150,
            filterFn: 'includesString',
            Cell: ({ row }) => (
                <div>
                    <Text>{row.original.whatsappNumber}</Text>
                    <Text size="sm" c="dimmed">
                        {row.original.city}, {row.original.country}
                    </Text>
                </div>
            )
        },
        {
            accessorKey: 'birthDate',
            header: t('common.minor'),
            size: 100,
            filterVariant: 'checkbox',
            Cell: ({ row }) => {
                const birthDate = row.original.birthDate;
                if (!birthDate) return <Text>{t('common.unknown')}</Text>;
                const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
                return <Badge color={age < 18 ? 'red' : 'green'}>{age < 18 ? t('common.yes') : t('common.no')}</Badge>;
            },
            sortingFn: (a, b) => {
                const ageA = new Date().getFullYear() - new Date(a.original.birthDate).getFullYear();
                const ageB = new Date().getFullYear() - new Date(b.original.birthDate).getFullYear();
                return ageA - ageB;
            }
        },
        {
            accessorKey: 'parentalAuth',
            header: t('common.parentalAuthorization'),
            size: 300,
            Cell: ({ row }) => {
                const student = row.original;
                const birthDate = student.birthDate;
                const isMinor = birthDate ? (new Date().getFullYear() - new Date(birthDate).getFullYear() < 18) : false;

                if (isMinor && student.parentalAuth) {
                    return (
                        <Paper p="sm" withBorder style={{ display: 'inline-block', textAlign: 'center' }}>
                            <Image
                                src={student.parentalAuth.signature}
                                alt={t('common.parentSignature')}
                                className="signature-image"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                            <Text size="sm">{t('common.signedBy')}: {student.parentalAuth.parentName}</Text>
                            <Text size="sm">{t('common.email')}: {student.parentalAuth.parentEmail}</Text>
                            <Text size="sm">
                                {t('common.signedAt')}: {new Date(student.parentalAuth.signedAt).toLocaleDateString('fr-FR')}
                            </Text>
                        </Paper>
                    );
                }
                return <Text c="red" size="sm">{t('common.notRequired')}</Text>;
            },
            enableSorting: false
        },
        {
            accessorKey: 'iccMember',
            header: t('classManager.iccMember'),
            size: 120,
            filterVariant: 'checkbox',
            Cell: ({ row }) => (
                <Badge color={row.original.iccMember ? 'green' : 'yellow'}>
                    {row.original.iccMember ? t('common.yes') : t('common.no')}
                </Badge>
            )
        }
    ];

    const renderPendingStudents = () => (
        <Accordion.Item value="pending">
            <Accordion.Control>
                <Group>
                    <IconId size={20} />
                    <Text size="lg" weight={600}>{t('common.pendingValidations')}</Text>
                    <Badge variant="filled" color="orange">{pendingStudents?.length}</Badge>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Box p="md">
                    <Flex justify="space-between" mb="md">
                        <Button
                            leftIcon={<IconCloudUpload size={16} />}
                            disabled={selectedStudents.length === 0}
                            loading={validateMutation.isLoading || syncMutation.isLoading}
                            onClick={handleValidate}
                        >
                            {t('common.validateAndSync')} ({selectedStudents.length})
                        </Button>
                        <ActionIcon onClick={refetchPending}>
                            <IconRefresh size={20} />
                        </ActionIcon>
                    </Flex>

                    <MantineReactTable
                        columns={pendingColumns}
                        data={pendingStudents || []}
                        enablePagination
                        enableSorting
                        enableColumnFilterModes
                        enableColumnResizing
                        initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                            showColumnFilters: true
                        }}
                        mantineTableContainerProps={{
                            style: { maxHeight: '600px' }
                        }}
                        mantineTableBodyRowProps={({ row }) => ({
                            sx: { cursor: 'default' },

                        })}
                    />
                </Box>
            </Accordion.Panel>
        </Accordion.Item>
    );

    const renderCoordinators = () => (
        <Accordion.Item value="coordinators">
            <Accordion.Control>
                <Group>
                    <IconSettings size={20} />
                    <Text size="lg" weight={600}>{t('common.coordinators')}</Text>
                    <Badge variant="filled" color="teal">{coordinators?.length}</Badge>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Box p="md">
                    {coordinators?.map(coordinator => (
                        <Paper key={coordinator._id} p="md" mb="md" withBorder>
                            <Flex align="center" gap="md">
                                <Avatar
                                    src={coordinator.avatarUrl}
                                    size={60}
                                    radius="xl"
                                />
                                <div>
                                    <Title order={5}>
                                        {coordinator.firstName} {coordinator.lastName}
                                    </Title>
                                    <Text c="dimmed">{coordinator.email}</Text>
                                </div>
                            </Flex>

                            <Box mt="md">
                                <Text weight={600} mb="sm">{t('common.assignedClasses')}:</Text>
                                <Group spacing="xs">
                                    {coordinator.managedClasses?.map(cls => (
                                        <Badge
                                            key={cls._id}
                                            variant="outline"
                                            leftSection={<IconSchool size={14} />}
                                        >
                                            {cls.thinkificGroupName} ({cls.students?.length} {t('common.students')})
                                        </Badge>
                                    ))}
                                </Group>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </Accordion.Panel>
        </Accordion.Item>
    );

    const renderSFs = () => (
        <Accordion.Item value="sfs">
            <Accordion.Control>
                <Group>
                    <IconUserCheck size={20} />
                    <Text size="lg" weight={600}>{t('common.sf')}</Text>
                    <Badge variant="filled" color="indigo">{sfs?.length}</Badge>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Box p="md">
                    {sfs?.map(sf => (
                        <Card key={sf._id} shadow="sm" mb="md">
                            <Flex gap="md" align="center">
                                <Avatar src={sf.avatarUrl} size={50} />
                                <div>
                                    <Text weight={600}>{sf.firstName} {sf.lastName}</Text>
                                    <Text size="sm" c="dimmed">{sf.email}</Text>
                                </div>
                            </Flex>

                            <Box mt="md">
                                <Text weight={600}>{t('common.assignedClasses')}:</Text>
                                <Group spacing="xs" mt="sm">
                                    {sf.managedClasses?.map(cls => (
                                        <Paper key={cls._id} p="xs" withBorder>
                                            <Text size="sm">{cls.thinkificGroupName}</Text>
                                            <Text size="xs" c="dimmed">
                                                {t('classManager.teacher')}: {cls.teacher?.firstName} {cls.teacher?.lastName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {t('common.students')}: {cls.students?.length}
                                            </Text>
                                        </Paper>
                                    ))}
                                </Group>
                            </Box>
                        </Card>
                    ))}
                </Box>
            </Accordion.Panel>
        </Accordion.Item>
    );

    return (
        <Box p="md" className="admin-dashboard">
            <Title order={2} mb="xl">{t('sidebar.dashboard')}</Title>

            <Flex mb="md" gap="md">
                <Button
                    leftIcon={<IconChevronUp />}
                    variant="outline"
                    size="xs"
                    onClick={() => setExpandedSections([])}
                >
                    {t('common.collapseAll')}
                </Button>
                <Button
                    leftIcon={<IconChevronDown />}
                    variant="outline"
                    size="xs"
                    onClick={() => setExpandedSections(ALL_SECTION_KEYS)}
                >
                    {t('common.uncollapseAll')}
                </Button>
            </Flex>

            <Accordion
                value={expandedSections}
                onChange={setExpandedSections}
                multiple
                chevronPosition="left"
            >
                {renderClassesSection()}
                {renderPendingStudents()}
                {renderCoordinators()}
                {renderSFs()}
            </Accordion>

            <LoadingOverlay
                visible={validateMutation.isLoading || syncMutation.isLoading}
                overlayBlur={2}
            />
            <ClassDetailsModal
                opened={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedClass(null);
                }}
                classData={selectedClass}
            />
        </Box>
    );
};

export default AdminDashboard;
