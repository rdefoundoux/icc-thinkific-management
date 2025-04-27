import React, { useEffect, useState } from 'react';
import { Modal, Button, MultiSelect, Loader, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const AssignSFModal = ({ opened, onClose, classObj, onAssigned }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (opened) {
            setLoading(true);
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users?roles=sf`)
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
            body: JSON.stringify({ userIds: selectedUserIds, role: 'sf' }),
        });
        onAssigned?.();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('classManager.assignSF')}>
            {loading ? <Loader /> : (
                <form onSubmit={(e) => { e.preventDefault(); handleAssign(); }}>
                    <MultiSelect
                        label={t('classManager.selectSF')}
                        data={users.map(u => ({
                            value: u._id,
                            label: `${u.firstName} ${u.lastName}`
                        }))}
                        value={selectedUserIds}
                        onChange={setSelectedUserIds}
                        searchable
                    />
                    <Group mt="md" position="right">
                        <Button type="submit">{t('common.assign')}</Button>
                    </Group>
                </form>
            )}
        </Modal>
    );
};
export default AssignSFModal;
