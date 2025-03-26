// ScheduleWizard.jsx
import { Box, Button, Group, Stepper } from '@mantine/core';

export const ScheduleWizard = ({ opened, onClose }) => {
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Dates', 'Horaires', 'Confirmation'];

    return (
        <Box p="md">
            <Stepper active={activeStep} mb="xl">
                {steps.map((label, index) => (
                    <Stepper.Step key={label} label={label} />
                ))}
            </Stepper>

            {activeStep === 0 && <div>Étape 1</div>}
            {activeStep === 1 && <div>Étape 2</div>}
            {activeStep === 2 && <div>Étape 3</div>}

            <Group justify="flex-end" mt="xl">
                <Button
                    variant="default"
                    onClick={() => setActiveStep(prev => Math.max(prev - 1, 0))}
                    disabled={activeStep === 0}
                >
                    Précédent
                </Button>
                <Button
                    onClick={() => setActiveStep(prev => Math.min(prev + 1, steps.length - 1))}
                    disabled={activeStep === steps.length - 1}
                >
                    Suivant
                </Button>
            </Group>
        </Box>
    );
};
