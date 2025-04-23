import { useEffect, useState, useCallback } from "react";
import {
    Table, Button, Modal, TextInput, MultiSelect, Group, Loader, Badge,
    FileInput, Alert, Pagination, Text, Select
} from "@mantine/core";
import { IconPlus, IconUpload, IconCheck, IconAlertCircle } from "@tabler/icons-react";
import debounce from "lodash.debounce";
import '../styles/classter.css';

const ROLE_OPTIONS = [
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "rsf", label: "RSF" },
    { value: "sf", label: "SF" },
    { value: "coordinator", label: "Coordinator" },
    { value: "traineeTeacher", label: "Trainee Teacher" },
    { value: "student", label: "Student" }
];

const PAGE_SIZE_OPTIONS = [
    { value: "10", label: "10 per page" },
    { value: "25", label: "25 per page" },
    { value: "50", label: "50 per page" }
];

function RolePills({ roles }) {
    return (
        <Group spacing="xs">
            {roles.map(role => (
                <Badge key={role} color="blue" variant="light" className="role-pill">
                    {role}
                </Badge>
            ))}
        </Group>
    );
}

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [rolesFilter, setRolesFilter] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);

    // Manual add modal
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ email: "", firstName: "", lastName: "", roles: [] });
    const [addError, setAddError] = useState(null);

    // Bulk upload modal
    const [showBulk, setShowBulk] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkResult, setBulkResult] = useState(null);

    // Debounced fetch function
    const fetchUsers = useCallback(debounce(async (roles, page, size) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                limit: size,
                ...(roles.length && { roles: roles.join(",") })
            });

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?${params}`);
            const { data, total } = await response.json();
            setUsers(data || []);
            setTotalRecords(total || 0);
        } catch (error) {
            setUsers([]);
            setTotalRecords(0);
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    // Fetch on filter/page/pageSize change
    useEffect(() => {
        fetchUsers(rolesFilter, currentPage, pageSize);
    }, [rolesFilter, currentPage, pageSize, fetchUsers]);

    // Manual add submit
    const submitAdd = async () => {
        setAddError(null);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addForm)
        });
        const data = await res.json();
        if (data.success) {
            setShowAdd(false);
            setAddForm({ email: "", firstName: "", lastName: "", roles: [] });
            fetchUsers(rolesFilter, currentPage, pageSize); // Refresh
        } else {
            setAddError(data.error);
        }
    };

    // Bulk upload submit
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
        fetchUsers(rolesFilter, currentPage, pageSize); // Refresh
    };

    // Pagination change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Page size change
    const handlePageSizeChange = (val) => {
        setPageSize(parseInt(val));
        setCurrentPage(1); // Reset to first page
    };

    return (
        <div className="classter-container">
            <Group position="apart" mb="md">
                <div>
                    <MultiSelect
                        label="Filter by Roles"
                        data={ROLE_OPTIONS}
                        value={rolesFilter}
                        onChange={setRolesFilter}
                        placeholder="All roles"
                        style={{ minWidth: 250 }}
                    />
                    <Text size="sm" color="dimmed" mt={4}>
                        Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                        {" - "}
                        {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} users
                    </Text>
                </div>
                <Group>
                    <Select
                        data={PAGE_SIZE_OPTIONS}
                        value={pageSize.toString()}
                        onChange={handlePageSizeChange}
                        style={{ width: 140 }}
                    />
                    <Button leftIcon={<IconPlus />} onClick={() => setShowAdd(true)}>Add User</Button>
                    <Button leftIcon={<IconUpload />} onClick={() => setShowBulk(true)} variant="outline">Bulk Upload</Button>
                </Group>
            </Group>

            <div style={{ position: 'relative', minHeight: 300 }}>
                {loading && <Loader style={{ position: 'absolute', top: '50%', left: '50%' }} />}
                <Table highlightOnHover withColumnBorders className="classter-table">
                    <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Roles</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(u => (
                        <tr key={u._id || u.email}>
                            <td>{u.email}</td>
                            <td>{u.firstName} {u.lastName}</td>
                            <td><RolePills roles={u.roles || []} /></td>
                        </tr>
                    ))}
                    {!loading && users.length === 0 && (
                        <tr>
                            <td colSpan={3}><Text align="center" color="dimmed">No users found.</Text></td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

            <Group position="center" mt="md">
                <Pagination
                    page={currentPage}
                    onChange={handlePageChange}
                    total={Math.max(1, Math.ceil(totalRecords / pageSize))}
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
                    CSV columns: <b>email,firstName,lastName,roles</b> (roles comma-separated, e.g. "admin,teacher")
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
                        {bulkResult.errors?.length ? (
                            <ul>
                                {bulkResult.errors.map((e, i) => <li key={i}>{e.error}</li>)}
                            </ul>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}
