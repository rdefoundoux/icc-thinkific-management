// frontend/src/theme.js
import { createTheme } from '@mantine/core';

export const theme = createTheme({
    colorScheme: 'dark',
    primaryColor: 'blue',
    colors: {
        dark: [
            '#C1C2C5', // Text color
            '#A6A7AB',
            '#909296',
            '#5C5F66',
            '#373A40', // Default dark color
            '#2C2E33', // Card background
            '#25262B', // Page background
            '#1A1B1E', // Modal background
            '#141517', // Hover colors
            '#101113'  // Darkest shade
        ],
        blue: [
            '#e7f5ff',
            '#d0ebff',
            '#a5d8ff',
            '#74c0fc',
            '#4dabf7',
            '#339af0', // Primary button color
            '#228be6',
            '#1c7ed6',
            '#1971c2',
            '#1864ab'
        ],
    },
    components: {
        Table: {
            styles: {
                root: {
                    '& th': { fontWeight: 600 },
                    '& tr:hover td': {
                        backgroundColor: 'var(--mantine-color-dark-5)'
                    }
                }
            }
        },
        NavLink: {
            defaultProps: {
                variant: 'filled',
                style: {
                    transition: 'all 150ms ease',
                }
            },
            styles: (theme) => ({
                root: {
                    '&[data-active]': {
                        backgroundColor: theme.colors.dark[5],
                        color: theme.white,
                        '&:hover': {
                            backgroundColor: theme.colors.dark[4]
                        }
                    },
                    '&:hover': {
                        backgroundColor: theme.colors.dark[6]
                    }
                },
                label: {
                    fontSize: theme.fontSizes.sm
                },
                icon: {
                    color: theme.colors.gray[4]
                }
            })
        },
        Paper: {
            defaultProps: {
                bg: 'dark.7',
                withBorder: true,
                style: { borderColor: 'var(--mantine-color-dark-5)' }
            }
        },
        Card: {
            styles: {
                root: {
                    backgroundColor: 'var(--mantine-color-dark-6)',
                    borderColor: 'var(--mantine-color-dark-4)'
                }
            }
        },
        Input: {
            styles: {
                input: {
                    backgroundColor: 'var(--mantine-color-dark-7)',
                    borderColor: 'var(--mantine-color-dark-4)',
                    '&:focus': {
                        borderColor: 'var(--mantine-color-blue-6)'
                    }
                }
            }
        },
        Button: {
            defaultProps: {
                variant: 'filled'
            }
        }
    }
});

export default theme;
