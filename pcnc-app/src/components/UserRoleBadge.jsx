export const UserRoleBadge = ({ role, proxyStatus }) => (
    <Badge
        color={proxyStatus === 'active' ? 'green' : 'yellow'}
        variant="light"
        rightSection={
            <Tooltip label={proxyStatus}>
                <IconInfoCircle size={14} />
            </Tooltip>
        }
    >
        {role}
    </Badge>
);
