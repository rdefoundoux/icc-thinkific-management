import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Box, Button, Container, Group, Paper, Stack, Text, Title, Alert, Divider, LoadingOverlay, TextInput
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useLocation, useNavigate } from 'react-router-dom';

const disclaimerText = `
Votre enfant (ou mineur sous votre responsabilité) souhaite participer à la formation PCNC Digital. 
Conformément à la législation, votre autorisation parentale est requise pour valider son inscription.
En signant ci-dessous, vous attestez avoir pris connaissance des conditions de participation et autorisez
votre enfant à suivre la formation.
`;

export default function ParentAuthorizationPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const sigCanvas = useRef(null);
    const [loading, setLoading] = useState(false);
    const [signed, setSigned] = useState(false);
    const [parentInfo, setParentInfo] = useState({ name: '', email: '', phone: '' });

    const handleClear = () => {
        sigCanvas.current?.clear();
        setSigned(false);
    };
    const handleEnd = () => {
        setSigned(sigCanvas.current?.isEmpty() === false);
    };
    const handleSubmit = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            notifications.show({ title: "Signature requise", message: "Veuillez signer le champ ci-dessous.", color: "red", icon: <IconAlertCircle /> });
            return;
        }
        if (!parentInfo.name || !parentInfo.email || !parentInfo.phone) {
            notifications.show({ title: "Information manquante", message: "Veuillez remplir tous les champs du parent/tuteur", color: "red", icon: <IconAlertCircle /> });
            return;
        }
        setLoading(true);
        try {
            const trimmedCanvas = sigCanvas.current.getCanvas();
            const signatureData = trimmedCanvas.toDataURL("image/png");
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...state.formData,
                    ThinkificId: "",
                    parentalAuth: {
                        signature: signatureData,
                        signedAt: new Date().toISOString(),
                        parentName: parentInfo.name,
                        parentEmail: parentInfo.email,
                        parentPhone: parentInfo.phone
                    }
                }),
            });
            if (!response.ok) throw new Error('Échec de la soumission');
            notifications.show({ title: "Autorisation enregistrée", message: "L'inscription a été validée avec succès", color: "green", icon: <IconCheck /> });
            navigate('/registration-success');
        } catch (err) {
            notifications.show({ title: "Erreur", message: err.message || "Une erreur est survenue", color: "red" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <Container size={520}>
                <Paper shadow="xl" radius="lg" p="xl" withBorder style={{ position: "relative" }}>
                    <LoadingOverlay visible={loading} />
                    <Stack align="center" spacing="md">
                        <Title order={2} align="center" gradient="linear-gradient(90deg,#662D91,#00B0CA)" sx={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Autorisation Parentale
                        </Title>
                        <Alert icon={<IconAlertCircle size={20} />} color="blue" radius="md">
                            <Text size="sm" weight={500}>{disclaimerText}</Text>
                        </Alert>
                        <Text size="sm" weight={500} mt="md">
                            Pour: {state?.formData?.firstName} {state?.formData?.lastName}
                        </Text>
                        <Divider label="Informations du parent/tuteur" labelPosition="center" w="100%" />
                        <TextInput label="Nom complet du parent/tuteur" required value={parentInfo.name} onChange={(e) => setParentInfo({ ...parentInfo, name: e.target.value })} w="100%" />
                        <Group grow w="100%">
                            <TextInput label="Email" type="email" required value={parentInfo.email} onChange={(e) => setParentInfo({ ...parentInfo, email: e.target.value })} />
                            <TextInput label="Téléphone" required value={parentInfo.phone} onChange={(e) => setParentInfo({ ...parentInfo, phone: e.target.value })} />
                        </Group>
                        <Divider label="Signature numérique" labelPosition="center" w="100%" />
                        <Box sx={{
                            border: "2px dashed #00B0CA",
                            borderRadius: "12px",
                            background: "#f8fafc",
                            padding: "1rem",
                            width: "100%",
                            minHeight: 180,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <SignatureCanvas
                                ref={sigCanvas}
                                penColor="#662D91"
                                backgroundColor="transparent"
                                canvasProps={{
                                    width: 400,
                                    height: 120,
                                    style: {
                                        borderRadius: "8px",
                                        background: "#fff",
                                        boxShadow: "0 2px 8px #0001",
                                        cursor: "crosshair"
                                    }
                                }}
                                onEnd={handleEnd}
                            />
                        </Box>
                        <Group position="center" w="100%" mt="md">
                            <Button variant="outline" color="gray" onClick={handleClear} disabled={loading}>
                                Effacer la signature
                            </Button>
                            <Button color="indigo" onClick={handleSubmit} leftIcon={<IconCheck />} disabled={!signed || loading}
                                    style={{ background: "linear-gradient(90deg,#662D91,#00B0CA)", color: "#fff" }}>
                                Valider l'autorisation
                            </Button>
                        </Group>
                        <Text size="xs" color="dimmed" mt="sm" align="center">
                            Cette signature numérique a valeur légale d'autorisation parentale écrite.
                        </Text>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
