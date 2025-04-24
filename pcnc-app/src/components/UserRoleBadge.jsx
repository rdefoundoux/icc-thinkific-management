import { Badge, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export const UserRoleBadge = ({ role, proxyStatus }) => (
    <Badge
        variant="light"
        className="role-pill"
        data-role={role}
        color={proxyStatus === 'active' ? 'green' : 'yellow'}
        rightSection={
            <Tooltip label={proxyStatus}>
                <IconInfoCircle size={14} />
            </Tooltip>
        }
    >
        {role}
    </Badge>
);
