// ClassForm.jsx
import { Modal, TextInput, Select } from '@mantine/core';

export const ClassForm = ({ opened, onClose, initialValues, onSubmit }) => {
    return (
        <Modal opened={opened} onClose={onClose} title={`${initialValues ? 'Modifier' : 'Créer'} une classe`}>
            <form onSubmit={onSubmit}>
                <TextInput
                    label="Nom de la classe"
                    placeholder="Nom"
                    defaultValue={initialValues?.name}
                    required
                />

                <Select
                    label="Cours"
                    placeholder="Sélectionner un cours"
                    defaultValue={initialValues?.courseCode}
                    data={[
                        { value: '001', label: '001 - Cours de base' },
                        { value: '101', label: '101 - Cours intermédiaire' },
                        { value: '201', label: '201 - Cours avancé' }
                    ]}
                    mt="md"
                    required
                />
            </form>
        </Modal>
    );
};
