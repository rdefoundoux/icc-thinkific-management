import { useState, useEffect, useCallback } from "react";
import {
    Table, Button, Modal, TextInput, MultiSelect, Group, Loader,
    Badge, FileInput, Alert, ActionIcon, Tooltip, Pagination, Select, Text
} from "@mantine/core";
import { IconPlus, IconUpload, IconEdit, IconCalendarEvent, IconCheck, IconAlertCircle, IconSearch } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import debounce from 'lodash.debounce';

const ROLE_OPTIONS = [
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "rsf", label: "RSF" },
    { value: "sf", label: "SF" },
    { value: "coordinator", label: "Coordinator" },
    { value: "traineeTeacher", label: "Trainee Teacher" },
    { value: "student", label: "Student" }
];

function validateRoles(roles) {
    return roles.every(r => ROLE_OPTIONS.map(o => o.value).includes(r));
}

export default function UserManagement() {
    const { user: currentUser } = useAuth();
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
    const [addForm, setAddForm] = useState({ email: "", firstName: "", lastName: "", roles: [] });
    const [addError, setAddError] = useState(null);

    // Bulk Upload Modal
    const [showBulk, setShowBulk] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkResult, setBulkResult] = useState(null);

    // Edit User Modal
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ firstName: "", lastName: "", roles: [] });
    const [editError, setEditError] = useState(null);

    // Attendance Modal
    const [attendanceUser, setAttendanceUser] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState("");
    const [attendancePresent, setAttendancePresent] = useState(true);
    const [attendanceError, setAttendanceError] = useState(null);

    // Debounced fetch
    const fetchUsers = useCallback(debounce(async (query, roles, page, size) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page);
            params.append("limit", size);
            if (roles.length) params.append("roles", roles.join(","));
            if (query) params.append("search", query);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?${params}`);
            const { data, total } = await response.json();
            setUsers(data || []);
            setTotalUsers(total || 0);
        } catch (error) {
            setUsers([]);
            setTotalUsers(0);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    useEffect(() => {
        fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
    }, [searchQuery, rolesFilter, currentPage, pageSize, fetchUsers]);

    // Reset to first page when filters/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rolesFilter, pageSize]);

    // Add User
    const submitAdd = async () => {
        setAddError(null);
        if (!addForm.email || !addForm.roles.length) {
            setAddError("Email and roles required");
            return;
        }
        if (!validateRoles(addForm.roles)) {
            setAddError("Invalid roles");
            return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addForm)
        });
        const data = await res.json();
        if (data.success) {
            setShowAdd(false);
            setAddForm({ email: "", firstName: "", lastName: "", roles: [] });
            fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
        } else {
            setAddError(data.error);
        }
    };

    // Bulk Upload
    const submitBulk = async () => {
        if (!bulkFile) return;
        const fd = new FormData();
        fd.append("file", bulkFile);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/bulk`, {
            method: "POST",
            body: fd
        });
        const data = await res.json();
        setBulkResult(data);
        fetchUsers(searchQuery, rolesFilter, currentPage, pageSize);
    };

    // Edit User
    const handleEditClick = (user) => {
        setEditUser(user);
        setEditForm({ firstName: user.firstName, lastName: user.lastName, roles: user.roles });
        setEditError(null);
    };
    const submitEdit = async () => {
        setEditError(null);
        if (!editForm.roles.length) {
            setEditError("Roles required");
            return;
        }
        if (!validateRoles(editForm.roles)) {
            setEditError("Invalid roles");
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${editUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
                credentials: 'include'
            });
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
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${attendanceUser._id}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: attendanceDate, present: attendancePresent }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setAttendanceUser(null);
        } catch (err) {
            setAttendanceError(err.message);
        }
    };

    return (
        <div className="classter-container">
            {/* Control Bar */}
            <Group position="apart" mb="md">
                <Group>
                    <TextInput
                        placeholder="Search users..."
                        icon={<IconSearch size={18} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 220 }}
                    />
                    <MultiSelect
                        data={ROLE_OPTIONS}
                        value={rolesFilter}
                        onChange={setRolesFilter}
                        placeholder="Filter roles"
                        style={{ width: 220 }}
                    />
                </Group>
                <Group>
                    <Select
                        data={[
                            { value: '10', label: '10 per page' },
                            { value: '25', label: '25 per page' },
                            { value: '50', label: '50 per page' }
                        ]}
                        value={pageSize.toString()}
                        onChange={(val) => setPageSize(Number(val))}
                        style={{ width: 140 }}
                    />
                    <Button
                        leftIcon={<IconPlus />}
                        onClick={() => setShowAdd(true)}
                        disabled={!currentUser?.roles.includes('admin')}
                    >
                        Add User
                    </Button>
                    <Button
                        leftIcon={<IconUpload />}
                        onClick={() => setShowBulk(true)}
                        variant="outline"
                        disabled={!currentUser?.roles.includes('admin')}
                    >
                        Bulk Upload
                    </Button>
                </Group>
            </Group>

            {/* Pagination Info */}
            <Text size="sm" color="dimmed" mb="sm">
                Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
            </Text>

            {/* User Table */}
            {loading ? <Loader /> : (
                <Table highlightOnHover withColumnBorders className="classter-table">
                    <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Roles</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(u => (
                        <tr key={u._id || u.email}>
                            <td>{u.email}</td>
                            <td>{u.firstName} {u.lastName}</td>
                            <td>
                                <Group spacing="xs">
                                    {u.roles.map(role => (
                                        <Badge key={role} variant={role}>{role}</Badge>
                                    ))}
                                </Group>
                            </td>
                            <td>
                                <Group>
                                    {currentUser?.roles.includes('admin') && (
                                        <Tooltip label="Edit user">
                                            <ActionIcon color="blue" onClick={() => handleEditClick(u)}>
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                    {currentUser?.roles.includes('coordinator') && (
                                        <Tooltip label="Manage attendance">
                                            <ActionIcon color="green" onClick={() => handleAttendanceClick(u)}>
                                                <IconCalendarEvent size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            )}

            {/* Pagination */}
            <Group position="center" mt="md">
                <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={Math.max(1, Math.ceil(totalUsers / pageSize))}
                    siblings={1}
                    boundaries={1}
                />
            </Group>

            {/* Add User Modal */}
            <Modal opened={showAdd} onClose={() => setShowAdd(false)} title="Add User">
                <TextInput label="Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
                <TextInput label="First Name" value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
                <TextInput label="Last Name" value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
                <MultiSelect
                    label="Roles"
                    data={ROLE_OPTIONS}
                    value={addForm.roles}
                    onChange={roles => setAddForm(f => ({ ...f, roles }))}
                    required
                />
                {addError && <Alert color="red" icon={<IconAlertCircle />}>{addError}</Alert>}
                <Group mt="md">
                    <Button onClick={submitAdd} leftIcon={<IconCheck />}>Add</Button>
                    <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                </Group>
            </Modal>

            {/* Bulk Upload Modal */}
            <Modal opened={showBulk} onClose={() => setShowBulk(false)} title="Bulk Upload Users">
                <FileInput label="CSV File" accept=".csv" onChange={setBulkFile} required />
                <Alert color="blue" mt="sm">
                    CSV columns: <b>email,firstName,lastName,roles</b> (roles comma-separated)
                </Alert>
                <Group mt="md">
                    <Button onClick={submitBulk} leftIcon={<IconUpload />}>Upload</Button>
                    <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
                </Group>
                {bulkResult && (
                    <div style={{ marginTop: 16 }}>
                        <Alert color={bulkResult.errors?.length ? "red" : "green"}>
                            {bulkResult.inserted?.length} users added.
                            {bulkResult.errors?.length ? ` Errors: ${bulkResult.errors.length}` : null}
                        </Alert>
                        {bulkResult.errors?.length && (
                            <ul>
                                {bulkResult.errors.map((e, i) => <li key={i}>{e.error}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </Modal>

            {/* Edit User Modal */}
            <Modal opened={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
                <TextInput
                    label="First Name"
                    value={editForm.firstName}
                    onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    mb="md"
                />
                <TextInput
                    label="Last Name"
                    value={editForm.lastName}
                    onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    mb="md"
                />
                <MultiSelect
                    label="Roles"
                    data={ROLE_OPTIONS}
                    value={editForm.roles}
                    onChange={roles => setEditForm(f => ({ ...f, roles }))}
                    required
                />
                {editError && <Alert color="red" mt="md">{editError}</Alert>}
                <Group mt="md">
                    <Button onClick={submitEdit}>Save</Button>
                    <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
                </Group>
            </Modal>

            {/* Attendance Modal */}
            <Modal opened={!!attendanceUser} onClose={() => setAttendanceUser(null)} title="Manage Attendance">
                <TextInput
                    label="Date"
                    type="date"
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    mb="md"
                />
                <Group>
                    <Button
                        color={attendancePresent ? "green" : "gray"}
                        onClick={() => setAttendancePresent(true)}
                        variant={attendancePresent ? "filled" : "outline"}
                    >
                        Present
                    </Button>
                    <Button
                        color={!attendancePresent ? "red" : "gray"}
                        onClick={() => setAttendancePresent(false)}
                        variant={!attendancePresent ? "filled" : "outline"}
                    >
                        Absent
                    </Button>
                </Group>
                {attendanceError && <Alert color="red" mt="md">{attendanceError}</Alert>}
                <Group mt="md">
                    <Button onClick={submitAttendance}>Save Attendance</Button>
                    <Button variant="outline" onClick={() => setAttendanceUser(null)}>Cancel</Button>
                </Group>
            </Modal>
        </div>
    );
}
