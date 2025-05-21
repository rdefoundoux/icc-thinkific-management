import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';
import {
    ActionIcon, Avatar, Badge, Box, Checkbox, Flex, Group,
    NumberInput, Progress, Text, TextInput, Tooltip, Card, Button, ScrollArea, useMantineTheme
} from '@mantine/core';
import { IconEdit, IconCheck, IconX, IconPlus, IconRefresh } from '@tabler/icons-react';
import { MantineReactTable } from 'mantine-react-table';
import { getClassesBySF, updateStudentResults } from '../api/classes';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';

function getLanguageNameFromCode(code) {
    switch (code) {
        case 'fr': return 'Français';
        case 'en': return 'English';
        default: return code;
    }
}

const SfDashboard = () => {
    const { i18n } = useTranslation();
    const currentLanguageCode = i18n.language;
    const currentLanguage = getLanguageNameFromCode(currentLanguageCode);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);

    // Check if user has SF role using includes for array of roles
    const isSfRole = user?.roles?.includes('sf') || user?.role === 'sf';

    const { data: classes, refetch, isLoading } = useQuery({
        queryKey: ['sfClasses', user._id],
        queryFn: () => getClassesBySF(user._id),
        select: data => data?.map(cls => ({
            ...cls,
            students: cls.students.map(student => ({
                ...student,
                enrolledCourses: student.enrolledCourses || [],
                canProgress: checkProgression(student, cls.courseCode),
                classId: cls._id
            }))
        })) || [],
        enabled: !!user._id && isSfRole,
        refetchOnMount: true,
        refetchOnWindowFocus: false
    });

    const checkProgression = (student, currentCourse) => {
        const requiredAverage = currentCourse === '201' ? 80 : 70;
        const average = student.results?.average || 0;
        return average >= requiredAverage;
    };

    const saveMutation = useMutation({
        mutationFn: async ({ row, values }) => {
            const enrollmentChanges = values.enrollmentChanges || { added: [], removed: [] };
            await updateStudentResults(row.original._id, {
                attendance: values.attendance,
                results: { tests: values.results?.tests || [] },
                enrolledCourses: [
                    ...(row.original.enrolledCourses || []),
                    ...enrollmentChanges.added
                ].filter(c => !enrollmentChanges.removed.includes(c))
            });
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/sync-enrollment`, {
                studentId: row.original._id,
                enrollmentChanges,
                language: currentLanguage,
                classId: row.original.classId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['sfClasses', user._id]);
        }
    });

    const handleSaveResults = async ({ row, values, table }) => {
        await saveMutation.mutateAsync({ row, values });
        table.setEditingRow(null);
        await refetch();
    };

    // Rest of your columns definition code remains the same
    const columns = useMemo(() => [
        // Your existing columns
    ], [currentLanguageCode]);

    return (
        <Box p="md">
            <Flex align="center" justify="space-between" mb="md">
                <Text size="xl" fw={700}>
                    {isSfRole ? 'Mes Classes SF' : 'Toutes les Classes'}
                </Text>
                <Button
                    leftIcon={<IconRefresh size={16} />}
                    variant="light"
                    onClick={() => refetch()}
                    loading={isLoading}
                >
                    Actualiser
                </Button>
            </Flex>

            {isLoading ? (
                <Text>Chargement des classes...</Text>
            ) : classes?.length > 0 ? (
                classes.map((cls, index) => (
                    <Card key={index} mb="xl" shadow="sm" padding="lg" radius="md">
                        <Group position="apart" mb="md" wrap="wrap">
                            <Group spacing="xs">
                                <Text fw={600}>{cls.thinkificGroupName}</Text>
                                <Badge color="blue" variant="light">
                                    {cls.students.length} étudiants
                                </Badge>
                            </Group>
                            <Group spacing="xl">
                                <Text fw={500}>
                                    Enseignant: {cls.teacher?.firstName} {cls.teacher?.lastName}
                                </Text>
                                <Text fw={500}>
                                    Coord: {cls.coordinator?.firstName} {cls.coordinator?.lastName}
                                </Text>
                            </Group>
                        </Group>
                        <ScrollArea type="auto" style={{ maxWidth: '100vw', minWidth: isMobile ? 0 : 800 }}>
                            <MantineReactTable
                                columns={columns}
                                data={cls.students}
                                enableRowVirtualization
                                enableColumnResizing
                                enableEditing
                                editDisplayMode="row"
                                mantineTableContainerProps={{
                                    style: { maxHeight: isMobile ? 400 : 'calc(100vh - 210px)' }
                                }}
                                mantineEditTextInputProps={{ variant: 'filled' }}
                                onEditingRowSave={handleSaveResults}
                                renderRowActions={({ row, table }) => (
                                    <Flex gap="md">
                                        {table.getState().editingRow?.id === row.id ? (
                                            <>
                                                <Tooltip label="Enregistrer">
                                                    <ActionIcon
                                                        color="green"
                                                        onClick={() => handleSaveResults({ row, values: row._valuesCache, table })}
                                                    >
                                                        <IconCheck />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Annuler">
                                                    <ActionIcon color="red" onClick={() => table.setEditingRow(null)}>
                                                        <IconX />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <Tooltip label="Modifier">
                                                <ActionIcon onClick={() => table.setEditingRow(row)}>
                                                    <IconEdit />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </Flex>
                                )}
                            />
                        </ScrollArea>
                    </Card>
                ))
            ) : (
                <Text>Aucune classe trouvée</Text>
            )}
        </Box>
    );
};

export default SfDashboard;
