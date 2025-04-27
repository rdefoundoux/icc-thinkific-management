import React, { useEffect, useState } from 'react';
import { Modal, Button, Select, Loader, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const AssignRSFModal = ({ opened, onClose, classObj, onAssigned }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (opened) {
            setLoading(true);
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?roles=rsf`)
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
            body: JSON.stringify({ userId: selectedUserId, role: 'rsf' }),
        });
        onAssigned?.();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('classManager.assignRSF')}>
            {loading ? <Loader /> : (
                <form onSubmit={(e) => { e.preventDefault(); handleAssign(); }}>
                    <Select
                        label={t('classManager.selectRSF')}
                        data={users.map(u => ({
                            value: u._id,
                            label: `${u.firstName} ${u.lastName}`
                        }))}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                    />
                    <Group mt="md" position="right">
                        <Button type="submit">{t('common.assign')}</Button>
                    </Group>
                </form>
            )}
        </Modal>
    );
};
export default AssignRSFModal;
