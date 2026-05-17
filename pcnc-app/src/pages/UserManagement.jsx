import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Modal,
    TextInput,
    MultiSelect,
    Group,
    Loader,
    Badge,
    FileInput,
    Alert,
    ActionIcon,
    Tooltip,
    Pagination,
    Select,
    Text,
} from '@mantine/core';
import {
    IconPlus,
    IconUpload,
    IconEdit,
    IconCalendarEvent,
    IconCheck,
    IconAlertCircle,
    IconSearch,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ScrollArea, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import debounce from 'lodash.debounce';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'rsf', label: 'RSF' },
    { value: 'sf', label: 'SF' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'traineeTeacher', label: 'Trainee Teacher' },
    { value: 'student', label: 'Student' },
];

function validateRoles(roles) {
    return roles.every((r) => ROLE_OPTIONS.map((o) => o.value).includes(r));
}

export default function UserManagement() {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm}px)`);
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(false);

    // Pagination and search state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [searchQuery, setSearchQuery] = useState('');
    const [rolesFilter, setRolesFilter] = useState([]);

    // Add User Modal
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        roles: [],
    });
    const [addError, setAddError] = useState(null);

    // Bulk Upload Modal
    const [showBulk, setShowBulk] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkResult, setBulkResult] = useState(null);

    // Edit User Modal
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        roles: [],
    });
    const [editError, setEditError] = useState(null);

    // Attendance Modal
    const [attendanceUser, setAttendanceUser] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState('');
    const [attendancePresent, setAttendancePresent] = useState(true);
    const [attendanceError, setAttendanceError] = useState(null);

    const fetchUsers = useCallback(
        debounce(async (query, roles, page, size) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('page', page);
                params.append('limit', size);
                if (roles.length) params.append('roles', roles.join(','));
                if (query) params.append('search', query);

                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v1/users?${params}`
                );
                const { data, total } = await response.json();
                setUsers(data || []);
                setTotalUsers(total || 0);
            } catch (error) {
                setUsers([]);
                setTotalUsers(0);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
    }, [searchQuery, rolesFilter, currentPage, pageSize, fetchUsers]);

    // Reset to first page on filter/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rolesFilter, pageSize]);

    // Add User
    const submitAdd = async () => {
        setAddError(null);
        if (!addForm.email || !addForm.roles.length) {
            setAddError(t('common.emailRolesRequired'));
            return;
        }
        if (!validateRoles(addForm.roles)) {
            setAddError(t('common.invalidRoles'));
            return;
        }

        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/users`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            }
        );
        const data = await res.json();
        if (data.success) {
            setShowAdd(false);
            setAddForm({ email: '', firstName: '', lastName: '', roles: [] });
            fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
        } else {
            setAddError(data.error);
        }
    };

    // Bulk Upload
    const submitBulk = async () => {
        if (!bulkFile) return;
        const fd = new FormData();
        fd.append('file', bulkFile);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/bulk`, {
            method: 'POST',
            body: fd,
        });
        const data = await res.json();
        setBulkResult(data);
        fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
    };

    // Edit User
    const handleEditClick = (user) => {
        setEditUser(user);
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
        });
        setEditError(null);
    };

    const submitEdit = async () => {
        setEditError(null);
        if (!editForm.roles.length) {
            setEditError(t('common.rolesRequired'));
            return;
        }
        if (!validateRoles(editForm.roles)) {
            setEditError(t('common.invalidRoles'));
            return;
        }
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${editUser._id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editForm),
                    credentials: 'include',
                }
            );
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
            setEditUser(null);
        } catch (err) {
            setEditError(err.message);
        }
    };

    // Attendance
    const handleAttendanceClick = (user) => {
        setAttendanceUser(user);
        setAttendanceDate(new Date().toISOString().slice(0, 10));
        setAttendancePresent(true);
        setAttendanceError(null);
    };

    const submitAttendance = async () => {
        setAttendanceError(null);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${attendanceUser._id}/attendance`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: attendanceDate, present: attendancePresent }),
                    credentials: 'include',
                }
            );
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setAttendanceUser(null);
        } catch (err) {
            setAttendanceError(err.message);
        }
    };

    return (
        <div className="classter-container">
            <Text
                size="32px"
                fw={800}
                mb="lg"
                style={{ letterSpacing: '-0.01em' }}
                c="pcncTeal.8"
            >
                {t('common.userManagement') || 'Gestion des utilisateurs'}
            </Text>
            {/* Control Bar */}
            <Group justify="space-between" mb="md" wrap="wrap">
                <Group wrap="wrap">
                    <TextInput
                        placeholder={t('common.searchUsers')}
                        leftSection={<IconSearch size={18} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 220 }}
                    />
                    <MultiSelect
                        data={ROLE_OPTIONS}
                        value={rolesFilter}
                        onChange={setRolesFilter}
                        placeholder={t('common.filterRoles')}
                        style={{ width: 220 }}
                    />
                </Group>
                <Group wrap="wrap">
                    <Select
                        data={[
                            { value: '10', label: '10 per page' },
                            { value: '25', label: '25 per page' },
                            { value: '50', label: '50 per page' },
                        ]}
                        value={pageSize.toString()}
                        onChange={(val) => setPageSize(Number(val))}
                        style={{ width: 140 }}
                    />
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setShowAdd(true)}
                        color="pcncTeal"
                        disabled={!currentUser?.roles?.includes('admin')}
                    >
                        {t('common.addUser')}
                    </Button>
                    <Button
                        leftSection={<IconUpload size={16} />}
                        onClick={() => setShowBulk(true)}
                        variant="outline"
                        color="pcncTeal"
                        disabled={!currentUser?.roles?.includes('admin')}
                    >
                        {t('common.bulkUpload')}
                    </Button>
                </Group>
            </Group>

            {/* Pagination Info */}
            <Text size="sm" color="dimmed" mb="sm">
                {t('pagination.showing')} {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, totalUsers)} {t('common.of')} {totalUsers} {t('pagination.users')}
            </Text>

            {/* User Table */}
            {loading ? (
                <Loader />
            ) : (
                <ScrollArea type="auto" style={{ maxWidth: '100vw', minWidth: isMobile ? 0 : 700 }}>
                    <Table highlightOnHover withColumnBorders className="classter-table" style={{ minWidth: 600 }}>
                        <thead>
                        <tr>
                            <th>{t('loginPage.emailAddress')}</th>
                            <th>{t('common.name')}</th>
                            <th>{t('common.roles')}</th>
                            <th>{t('classManager.actions')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u._id || u.email}>
                                <td>{u.email}</td>
                                <td>
                                    {u.firstName} {u.lastName}
                                </td>
                                <td>
                                    <Group spacing="xs" wrap="wrap">
                                        {u.roles.map((role) => (
                                            <Badge key={role} variant={role}>
                                                {role}
                                            </Badge>
                                        ))}
                                    </Group>
                                </td>
                                <td>
                                    <Group spacing="xs">
                                        <Tooltip label={t('common.edit')}>
                                            <ActionIcon
                                                color="blue"
                                                onClick={() => handleEditClick(u)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={t('common.attendance')}>
                                            <ActionIcon
                                                color="teal"
                                                onClick={() => handleAttendanceClick(u)}
                                            >
                                                <IconCalendarEvent size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </ScrollArea>
            )}

            <Pagination
                page={currentPage}
                onChange={setCurrentPage}
                total={Math.ceil(totalUsers / pageSize)}
                mt="md"
            />

            {/* Add User Modal */}
            <Modal opened={showAdd} onClose={() => setShowAdd(false)} title={t('common.addUser')}>
                <TextInput
                    label={t('loginPage.emailAddress')}
                    value={addForm.email}
                    onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                    required
                />
                <TextInput
                    label={t('common.firstName')}
                    value={addForm.firstName}
                    onChange={(e) =>
                        setAddForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                />
                <TextInput
                    label={t('common.lastName')}
                    value={addForm.lastName}
                    onChange={(e) =>
                        setAddForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                />
                <MultiSelect
                    label={t('common.roles')}
                    data={ROLE_OPTIONS}
                    value={addForm.roles}
                    onChange={(roles) => setAddForm((f) => ({ ...f, roles }))}
                    required
                />
                {addError && (
                    <Alert color="red" icon={<IconAlertCircle />}>
                        {addError}
                    </Alert>
                )}
                <Group mt="md">
                    <Button onClick={submitAdd} leftIcon={<IconCheck />}>
                        {t('common.add')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>
                        {t('common.cancel')}
                    </Button>
                </Group>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal
                opened={showBulk}
                onClose={() => setShowBulk(false)}
                title={t('common.bulkUpload')}
            >
                <FileInput
                    label={t('common.csvFile')}
                    accept=".csv"
                    onChange={setBulkFile}
                    required
                />
                <Alert color="blue" mt="sm">
                    CSV columns: <b>email,firstName,lastName,roles</b>
                </Alert>
                <Group mt="md">
                    <Button onClick={submitBulk} leftIcon={<IconUpload />}>
                        {t('common.upload')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowBulk(false)}>
                        {t('common.cancel')}
                    </Button>
                </Group>
                {bulkResult && (
                    <div style={{ marginTop: 16 }}>
                        <Alert color={bulkResult.errors?.length ? 'red' : 'green'}>
                            {bulkResult.inserted?.length} {t('common.usersAdded')}.
                            {bulkResult.errors?.length
                                ? ` ${t('common.errors')}: ${bulkResult.errors.length}`
                                : null}
                        </Alert>
                        {bulkResult.errors?.length ? (
                            <ul>
                                {bulkResult.errors.map((e, i) => (
                                    <li key={i}>{e.error}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                )}
            </Modal>

            {/* Edit User Modal */}
            <Modal
                opened={!!editUser}
                onClose={() => setEditUser(null)}
                title={t('common.editUser')}
            >
                {editUser && (
                    <>
                        <TextInput
                            label={t('common.firstName')}
                            value={editForm.firstName}
                            onChange={(e) =>
                                setEditForm((f) => ({ ...f, firstName: e.target.value }))
                            }
                            required
                        />
                        <TextInput
                            label={t('common.lastName')}
                            value={editForm.lastName}
                            onChange={(e) =>
                                setEditForm((f) => ({ ...f, lastName: e.target.value }))
                            }
                        />
                        <MultiSelect
                            label={t('common.roles')}
                            data={ROLE_OPTIONS}
                            value={editForm.roles}
                            onChange={(roles) => setEditForm((f) => ({ ...f, roles }))}
                            required
                        />
                        {editError && (
                            <Alert color="red" icon={<IconAlertCircle />}>
                                {editError}
                            </Alert>
                        )}
                        <Group mt="md">
                            <Button onClick={submitEdit} leftIcon={<IconCheck />}>
                                {t('common.save')}
                            </Button>
                            <Button variant="outline" onClick={() => setEditUser(null)}>
                                {t('common.cancel')}
                            </Button>
                        </Group>
                    </>
                )}
            </Modal>

            {/* Attendance Modal */}
            <Modal
                opened={!!attendanceUser}
                onClose={() => setAttendanceUser(null)}
                title={t('common.markAttendance')}
            >
                {attendanceUser && (
                    <>
                        <Text size="sm" color="dimmed">
                            {t('common.markAttendanceFor', { email: attendanceUser.email })}
                        </Text>
                        <TextInput
                            label={t('common.date')}
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            required
                        />
                        <Select
                            label={t('common.present')}
                            data={[
                                { value: 'true', label: t('common.present') },
                                { value: 'false', label: t('common.absent') },
                            ]}
                            value={attendancePresent ? 'true' : 'false'}
                            onChange={(val) => setAttendancePresent(val === 'true')}
                            required
                        />
                        {attendanceError && (
                            <Alert color="red" icon={<IconAlertCircle />}>
                                {attendanceError}
                            </Alert>
                        )}
                        <Group mt="md">
                            <Button onClick={submitAttendance} leftIcon={<IconCheck />}>
                                {t('common.save')}
                            </Button>
                            <Button variant="outline" onClick={() => setAttendanceUser(null)}>
                                {t('common.cancel')}
                            </Button>
                        </Group>
                    </>
                )}
            </Modal>
        </div>
    );
}
