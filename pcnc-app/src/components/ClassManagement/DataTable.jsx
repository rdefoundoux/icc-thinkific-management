// DataTable.jsx
import { Table, ActionIcon } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

export const DataTable = ({ data, columns, onEdit, onDelete }) => {
    return (
        <Table striped highlightOnHover>
            <Table.Thead>
                <Table.Tr>
                    {columns.map((col) => (
                        <Table.Th key={col.accessor}>{col.header}</Table.Th>
                    ))}
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {data.map((item) => (
                    <Table.Tr key={item._id}>
                        {columns.map((col) => (
                            <Table.Td key={col.accessor}>
                                {col.accessor.includes('.')
                                    ? col.accessor.split('.').reduce((o,i) => o[i], item)
                                    : item[col.accessor]}
                            </Table.Td>
                        ))}
                        <Table.Td>
                            <ActionIcon variant="subtle" onClick={() => onEdit(item)} mr="sm">
                                <IconEdit size={18} />
                            </ActionIcon>
                            <ActionIcon color="red" variant="subtle" onClick={() => onDelete(item._id)}>
                                <IconTrash size={18} />
                            </ActionIcon>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
};
