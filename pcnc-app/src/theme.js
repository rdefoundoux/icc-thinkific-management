import { createTheme } from '@mantine/core';

// Utility to create 10-shade arrays from a base color
const createShades = (baseColor) => Array(10).fill(baseColor);

// PCNC Brand Colors (10 shades each)
const pcncNavy = createShades('#161E3F');
const pcncBlue = createShades('#83CEE0');
const pcncPurple = createShades('#662D91');
const pcncOrange = createShades('#F9A061');
const pcncTeal = createShades('#00B0CA');
const pcncYellow = createShades('#FFE069');
const pcncGreen = createShades('#86C8A1');
const pcncLightPurple = createShades('#A67FB5');

const theme = createTheme({
    colorScheme: 'light',
    primaryColor: 'pcncBlue',
    colors: {
        pcncNavy,
        pcncBlue,
        pcncPurple,
        pcncOrange,
        pcncTeal,
        pcncYellow,
        pcncGreen,
        pcncLightPurple,
        gray: [
            '#f8f9fa',
            '#f1f3f6',
            '#f5f6f9',
            '#e0e0e6',
            '#dadce0',
            '#bdc1c6',
            '#9aa0a6',
            '#80868b',
            '#5f6368',
            '#3c4043',
        ],
    },
    fontFamily: 'Google Sans, Roboto, sans-serif',
    components: {
        Button: {
            defaultProps: { radius: '24px', variant: 'outline' },
            styles: (theme) => ({
                root: {
                    border: `1px solid ${theme.colors.gray[3]}`,
                    color: theme.colors.pcncNavy[0],
                    fontWeight: 500,
                    '&:hover': {
                        backgroundColor: theme.colors.pcncBlue[0],
                        boxShadow: '0 4px 8px rgba(22,30,63,0.1)',
                    },
                },
            }),
        },
        Card: {
            styles: (theme) => ({
                root: {
                    backgroundColor: '#fff',
                    border: `1px solid ${theme.colors.gray[3]}`,
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(22,30,63,0.05)',
                },
            }),
        },
        Table: {
            styles: (theme) => ({
                root: {
                    '--header-bg': theme.colors.gray[1],
                    '--row-hover': theme.colors.gray[2],
                    '--border-color': theme.colors.gray[3],
                    borderCollapse: 'collapse',
                    width: '100%',
                },
                thead: {
                    th: {
                        background: 'var(--header-bg)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.95em',
                    },
                },
                'tbody tr:hover': {
                    background: 'var(--row-hover)',
                },
                td: {
                    borderBottom: '1px solid var(--border-color)',
                },
            }),
        },
        Badge: {
            variants: {
                admin: () => ({
                    root: {
                        backgroundColor: pcncBlue[0],
                        color: pcncNavy[0],
                    },
                }),
                teacher: () => ({
                    root: {
                        backgroundColor: pcncOrange[0],
                        color: pcncNavy[0],
                    },
                }),
                coordinator: () => ({
                    root: {
                        backgroundColor: pcncTeal[0],
                        color: pcncNavy[0],
                    },
                }),
                rsf: () => ({
                    root: {
                        backgroundColor: pcncLightPurple[0],
                        color: pcncNavy[0],
                    },
                }),
                sf: () => ({
                    root: {
                        backgroundColor: pcncPurple[0],
                        color: '#fff',
                    },
                }),
                traineeTeacher: () => ({
                    root: {
                        backgroundColor: pcncYellow[0],
                        color: pcncNavy[0],
                    },
                }),
                student: () => ({
                    root: {
                        backgroundColor: pcncGreen[0],
                        color: pcncNavy[0],
                    },
                }),
            },
        },
        ActionIcon: {
            defaultProps: { variant: 'transparent', size: 'lg' },
            styles: (theme) => ({
                root: {
                    color: theme.colors.gray[7],
                    borderRadius: '50%',
                    '&:hover': {
                        backgroundColor: theme.colors.gray[1],
                    },
                },
            }),
        },
        NavLink: {
            styles: (theme) => ({
                root: {
                    borderRadius: '24px',
                    padding: '10px 20px',
                    '&[data-active]': {
                        backgroundColor: theme.colors.pcncBlue[0],
                        color: theme.colors.pcncNavy[0],
                        fontWeight: 600,
                        '& .mantine-NavLink-icon': {
                            color: theme.colors.pcncNavy[0],
                        },
                    },
                    '&:hover': {
                        backgroundColor: theme.colors.gray[2],
                    },
                },
                icon: {
                    color: theme.colors.gray[6],
                },
            }),
        },
        Progress: {
            styles: {
                root: {
                    height: '8px',
                    borderRadius: '8px',
                },
                bar: {
                    borderRadius: '8px',
                },
            },
        },
        Container: {
            styles: {
                root: {
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '32px 0',
                },
            },
        },
    },
});

export default theme;
