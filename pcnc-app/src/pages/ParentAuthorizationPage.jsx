import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Box,
    Button,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title,
    Alert,
    Divider,
    LoadingOverlay,
    TextInput
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useLocation, useNavigate } from 'react-router-dom';

const disclaimerText = `
Votre enfant (ou mineur sous votre responsabilité) souhaite participer à la formation PCNC Digital. 
Conformément à la législation, votre autorisation parentale est requise pour valider son inscription.
En signant ci-dessous, vous attestez avoir pris connaissance des conditions de participation et autorisez
votre enfant à suivre la formation.

Si vous avez moins de 18 ans au moment de la participation à la formation, votre inscription doit être 
réalisée par un de vos parents ou un représentant légal. Dans le formulaire il indiquera vos coordonnées. 
Par la suite il devra remplir, signer et nous renvoyer le formulaire suivant AUTORISATION PARENTALE POUR MINEUR 
à l'adresse pcnc.corp@egliseicc.com pour valider l'inscription.
`;

export default function ParentAuthorizationPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const sigCanvas = useRef(null);
    const [loading, setLoading] = useState(false);
    const [signed, setSigned] = useState(false);
    const [parentInfo, setParentInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const handleClear = () => {
        sigCanvas.current?.clear();
        setSigned(false);
    };

    const handleEnd = () => {
        setSigned(sigCanvas.current?.isEmpty() === false);
    };

    const handleSubmit = async () => {

        console.log('entered handleSubmit');
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            notifications.show({
                title: "Signature requise",
                message: "Veuillez signer le champ ci-dessous.",
                color: "red",
                icon: <IconAlertCircle />,
            });
            return;
        }
        console.log('check handleSubmit');
        if (!parentInfo.name || !parentInfo.email || !parentInfo.phone) {
            console.log({
                title: "Information manquante",
                message: "Veuillez remplir tous les champs du parent/tuteur",
                color: "red",
                icon: "IconAlertCircle",
            });
            notifications.show({
                title: "Information manquante",
                message: "Veuillez remplir tous les champs du parent/tuteur",
                color: "red",
                icon: <IconAlertCircle />,
            });
            return;
        }

        console.log('start submit handleSubmit');

        setLoading(true);
        try {
            const trimmedCanvas = getTrimmedCanvas();
            const signatureData = trimmedCanvas.toDataURL("image/png");

            // Submit both registration data and parental authorization
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

            console.log('response: ', response);

            const data = await response.json();
            console.log('data: ', data);

            if (!response.ok) {
                console.log('response nok: ', data);
                throw new Error(data.error || 'Échec de la soumission');
            }

            notifications.show({
                title: "Autorisation enregistrée",
                message: "L'inscription a été validée avec succès",
                color: "green",
                icon: <IconCheck />,
            });

            navigate('/registration-success');
        } catch (err) {
            console.log('err: ', err);
            notifications.show({
                title: "Erreur",
                message: err.message || "Une erreur est survenue",
                color: "red"
            });
        } finally {
            setLoading(false);
        }
    };

    const getTrimmedCanvas = () => {
        const canvas = sigCanvas.current.getCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        let top = 0;
        let bottom = canvas.height;
        let left = 0;
        let right = canvas.width;

        // Find top boundary
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    top = y;
                    y = canvas.height;
                    break;
                }
            }
        }

        // Find bottom boundary
        for (let y = canvas.height - 1; y >= 0; y--) {
            for (let x = 0; x < canvas.width; x++) {
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    bottom = y + 1;
                    y = -1;
                    break;
                }
            }
        }

        // Find left boundary
        for (let x = 0; x < canvas.width; x++) {
            for (let y = 0; y < canvas.height; y++) {
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    left = x;
                    x = canvas.width;
                    break;
                }
            }
        }

        // Find right boundary
        for (let x = canvas.width - 1; x >= 0; x--) {
            for (let y = 0; y < canvas.height; y++) {
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                if (alpha > 0) {
                    right = x + 1;
                    x = -1;
                    break;
                }
            }
        }

        const width = right - left;
        const height = bottom - top;

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = width;
        trimmedCanvas.height = height;

        const trimmedCtx = trimmedCanvas.getContext('2d');
        trimmedCtx.drawImage(
            canvas,
            left, top, width, height,
            0, 0, width, height
        );

        return trimmedCanvas;
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
                            <Text size="sm" weight={500}>
                                {disclaimerText}
                            </Text>
                        </Alert>

                        <Text size="sm" weight={500} mt="md">
                            Pour: {state?.formData?.firstName} {state?.formData?.lastName}
                        </Text>

                        <Divider label="Informations du parent/tuteur" labelPosition="center" w="100%" />

                        <TextInput
                            label="Nom complet du parent/tuteur"
                            required
                            value={parentInfo.name}
                            onChange={(e) => setParentInfo({...parentInfo, name: e.target.value})}
                            w="100%"
                        />

                        <Group grow w="100%">
                            <TextInput
                                label="Email"
                                type="email"
                                required
                                value={parentInfo.email}
                                onChange={(e) => setParentInfo({...parentInfo, email: e.target.value})}
                            />
                            <TextInput
                                label="Téléphone"
                                required
                                value={parentInfo.phone}
                                onChange={(e) => setParentInfo({...parentInfo, phone: e.target.value})}
                            />
                        </Group>

                        <Divider label="Signature numérique" labelPosition="center" w="100%" />

                        <Box
                            sx={{
                                border: "2px dashed #00B0CA",
                                borderRadius: "12px",
                                background: "#f8fafc",
                                padding: "1rem",
                                width: "100%",
                                minHeight: 180,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
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
                            <Button
                                variant="outline"
                                color="gray"
                                onClick={handleClear}
                                disabled={loading}
                            >
                                Effacer la signature
                            </Button>
                            <Button
                                color="indigo"
                                onClick={handleSubmit}
                                leftIcon={<IconCheck />}
                                disabled={!signed || loading}
                                style={{
                                    background: "linear-gradient(90deg,#662D91,#00B0CA)",
                                    color: "#fff"
                                }}
                            >
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
