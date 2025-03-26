import React, { useState, useEffect } from 'react';
import {
    Box,
    Title,
    Grid,
    Card,
    Text,
    Button,
    Tabs,
    Badge,
    Group,
    ThemeIcon,
    Container
} from '@mantine/core';
import { useAuth } from '../context/AuthContext';
import { IconCalendar, IconBook, IconVideo, IconClock } from '@tabler/icons-react';

const StudentPortal = () => {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            // API call remains the same
        };
        loadData();
    }, [user.id]);

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">Portail Étudiant</Title>

            <Tabs defaultValue="schedule">
                <Tabs.List>
                    <Tabs.Tab value="schedule" icon={<IconCalendar size="1rem" />}>
                        Emploi du temps
                    </Tabs.Tab>
                    <Tabs.Tab value="courses" icon={<IconBook size="1rem" />}>
                        Cours
                    </Tabs.Tab>
                    <Tabs.Tab value="live" icon={<IconVideo size="1rem" />}>
                        Classes en direct
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="schedule" pt="xl">
                    <Grid>
                        {schedule.map((daySchedule) => (
                            <Grid.Col key={daySchedule.day} span={{ base: 12, md: 6, lg: 4 }}>
                                <Card shadow="sm" padding="lg">
                                    <Text fw={500} size="lg" mb="md">
                                        {daySchedule.day}
                                    </Text>
                                    {daySchedule.sessions.map(session => (
                                        <Group key={session.time} mb="md" p="md" bg="gray.1">
                                            <ThemeIcon variant="light">
                                                <IconClock size="1.2rem" />
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={600}>{session.time}</Text>
                                                <Text size="sm">{session.course}</Text>
                                                <Text size="sm" c="dimmed">{session.teacher}</Text>
                                            </div>
                                        </Group>
                                    ))}
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="courses" pt="xl">
                    <Grid>
                        {courses.map(course => (
                            <Grid.Col key={course.id} span={{ base: 12, md: 6, lg: 4 }}>
                                <Card withBorder padding="xl">
                                    <Text fw={500} size="lg">
                                        {course.code} - {course.title}
                                    </Text>
                                    <Badge color="teal" mt="sm">
                                        {course.progress}% complété
                                    </Badge>

                                    <Text mt="md" mb="xs">{course.description}</Text>
                                    <Text size="sm" c="dimmed">
                                        Dernière activité: {course.lastActivity}
                                    </Text>

                                    <Button
                                        mt="md"
                                        variant="light"
                                        onClick={() => window.open(course.link, '_blank')}
                                    >
                                        Accéder au cours
                                    </Button>
                                </Card>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Tabs.Panel>

                <Tabs.Panel value="live" pt="xl">
                    <Card shadow="sm" padding="xl">
                        <Text fw={500} size="lg" mb="md">
                            Prochaine session Zoom
                        </Text>

                        <Group mb="xl">
                            <ThemeIcon size="xl" variant="light">
                                <IconVideo size="2rem" />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Cours: Développement Web Avancé</Text>
                                <Text>Horaire: Jeudi 14h00 - 16h00</Text>
                                <Text>Enseignant: Prof. Dupont</Text>
                            </div>
                        </Group>

                        <Button
                            variant="filled"
                            color="green"
                            onClick={() => window.open('https://zoom.us/your-class-link', '_blank')}
                        >
                            Rejoindre la session
                        </Button>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default StudentPortal;
