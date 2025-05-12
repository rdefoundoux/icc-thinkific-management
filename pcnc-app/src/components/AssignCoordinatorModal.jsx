import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, Loader, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const AssignCoordinatorModal = ({ opened, onClose, classObj, onAssigned }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [coordinatorId, setCoordinatorId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (opened) {
            setLoading(true);
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?roles=coordinator`)
                .then((res) => res.json())
                .then((data) => {
                    setUsers(data.data || []);
                    setLoading(false);
                });
        }
    }, [opened]);

    const handleAssign = async () => {
        setLoading(true);
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/classes/${classObj._id}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: coordinatorId, role: 'coordinator' }),
        });
        setLoading(false);
        onAssigned && onAssigned();
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={t('classManager.assignCoordinator')}
            size={{ base: '100%', sm: 400 }}
            centered
        >
            {loading ? (
                <Loader />
            ) : (
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleAssign();
                    }}
                >
                    <Stack>
                        <Select
                            label={t('classManager.selectCoordinator')}
                            placeholder={t('classManager.selectCoordinator')}
                            data={users.map(u => ({
                                value: u._id,
                                label: `${u.firstName} ${u.lastName} (${u.email})`
                            }))}
                            value={coordinatorId}
                            onChange={setCoordinatorId}
                            required
                            searchable
                            nothingFound={t('common.noUsersFound')}
                            fullWidth
                        />
                        <Group mt="md" position="right" grow>
                            <Button type="submit" disabled={!coordinatorId} fullWidth>
                                {t('common.assign')}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            )}
        </Modal>
    );
};

export default AssignCoordinatorModal;
