import { createTheme, rem } from '@mantine/core';

// ────────────────────────────────────────────────────────────────────
//  ICC (Impact Centre Chrétien) brand palette — 10 shades each
//  Inspired by the ICC logo gradient (blue → purple → red → gold → green).
// ────────────────────────────────────────────────────────────────────

const iccBlue = [
    '#E6F0FF', '#C7DBFF', '#A2C0FF', '#7AA1FF', '#5680FF',
    '#3460F2', '#1E47D9', '#1538B3', '#0E2B8E', '#08206B',
];
const iccPurple = [
    '#F5EBFF', '#E3CCFF', '#CDA6FF', '#B57DFF', '#9C53FF',
    '#8132E8', '#6B22C7', '#561AA2', '#42137F', '#310E60',
];
const iccRed = [
    '#FFE9EC', '#FFC4CB', '#FF98A4', '#FF6877', '#FF3D52',
    '#E51E35', '#C7142A', '#A30E22', '#7F0A1B', '#5E0613',
];
const iccGold = [
    '#FFF7DB', '#FFEAA8', '#FFDB6E', '#FFCB3C', '#F5B91A',
    '#D9A20A', '#B68603', '#8E6700', '#6B4D00', '#4D3700',
];
const iccGreen = [
    '#E4FAEC', '#BEF1D0', '#90E5AE', '#5FD78B', '#34C56C',
    '#1AAA53', '#0C8C42', '#066D33', '#054F26', '#03361A',
];
const iccDark = [
    '#F1F3F8', '#DCE2EC', '#B6C0CF', '#8E99AE', '#6C7791',
    '#525B73', '#3E4660', '#2D3450', '#1E2440', '#121833',
];
const gray = [
    '#F8FAFC', '#F1F4F8', '#E5EAF1', '#D2DAE5', '#B6C0CF',
    '#94A0B3', '#6C7791', '#525B73', '#3E4660', '#2D3450',
];

const theme = createTheme({
    primaryColor: 'iccBlue',
    primaryShade: { light: 6, dark: 5 },

    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headings: {
        fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
        fontWeight: '700',
    },

    defaultRadius: 'md',
    radius: {
        xs: rem(4),
        sm: rem(6),
        md: rem(10),
        lg: rem(14),
        xl: rem(20),
    },

    colors: {
        iccBlue,
        iccPurple,
        iccRed,
        iccGold,
        iccGreen,
        iccDark,
        gray,
        // Aliases so generic <Badge color="blue" /> etc. pick up ICC tones.
        blue: iccBlue,
        indigo: iccBlue,
        violet: iccPurple,
        grape: iccPurple,
        red: iccRed,
        pink: iccRed,
        orange: iccGold,
        yellow: iccGold,
        green: iccGreen,
        teal: iccGreen,
        lime: iccGreen,
        dark: iccDark,
    },

    other: {
        sidebarBg: iccDark[9],
        sidebarHover: iccDark[7],
        sidebarActiveBg: iccBlue[6],
        sidebarAccent: iccGold[4],
        contentBg: gray[0],
        cardBorder: gray[2],
        cardShadow: '0 1px 3px rgba(18, 24, 51, 0.04), 0 1px 2px rgba(18, 24, 51, 0.06)',
        cardShadowHover: '0 8px 24px rgba(18, 24, 51, 0.08), 0 2px 6px rgba(18, 24, 51, 0.06)',
    },

    components: {
        Button: {
            defaultProps: { radius: 'xl' },
            styles: () => ({
                root: {
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                    '&:hover:not(:disabled)': {
                        transform: 'translateY(-1px)',
                    },
                },
            }),
        },

        Card: {
            defaultProps: { radius: 'md', withBorder: true },
            styles: (t) => ({
                root: {
                    backgroundColor: '#ffffff',
                    borderColor: t.colors.gray[2],
                    boxShadow: t.other.cardShadow,
                    transition: 'box-shadow 160ms ease, transform 160ms ease',
                },
            }),
        },

        Paper: {
            defaultProps: { radius: 'md' },
            styles: (t) => ({
                root: {
                    borderColor: t.colors.gray[2],
                },
            }),
        },

        Modal: {
            defaultProps: { radius: 'md', centered: true, overlayProps: { backgroundOpacity: 0.55, blur: 3 } },
            styles: (t) => ({
                header: {
                    borderBottom: `1px solid ${t.colors.gray[2]}`,
                    paddingBottom: t.spacing.md,
                },
                title: {
                    fontWeight: 700,
                    color: t.colors.iccBlue[8],
                },
            }),
        },

        Title: {
            styles: (t) => ({
                root: {
                    color: t.colors.iccBlue[8],
                    letterSpacing: '-0.01em',
                },
            }),
        },

        Anchor: {
            styles: (t) => ({
                root: {
                    color: t.colors.iccBlue[6],
                    fontWeight: 500,
                    '&:hover': { color: t.colors.iccBlue[7] },
                },
            }),
        },

        Table: {
            styles: (t) => ({
                table: {
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                },
                thead: {
                    backgroundColor: t.colors.iccBlue[0],
                },
                th: {
                    color: t.colors.iccBlue[8],
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: rem(12),
                    letterSpacing: '0.04em',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${t.colors.iccBlue[1]}`,
                },
                td: {
                    padding: '12px 16px',
                    borderBottom: `1px solid ${t.colors.gray[2]}`,
                },
                'tbody tr:hover': {
                    backgroundColor: t.colors.gray[1],
                },
            }),
        },

        Badge: {
            defaultProps: { radius: 'sm' },
            variants: {
                admin: () => ({
                    root: {
                        backgroundColor: iccBlue[6],
                        color: '#ffffff',
                    },
                }),
                teacher: () => ({
                    root: {
                        backgroundColor: iccGold[1],
                        color: iccGold[8],
                    },
                }),
                coordinator: () => ({
                    root: {
                        backgroundColor: iccPurple[1],
                        color: iccPurple[8],
                    },
                }),
                rsf: () => ({
                    root: {
                        backgroundColor: iccRed[0],
                        color: iccRed[7],
                    },
                }),
                sf: () => ({
                    root: {
                        backgroundColor: iccPurple[0],
                        color: iccPurple[7],
                    },
                }),
                traineeTeacher: () => ({
                    root: {
                        backgroundColor: iccGold[0],
                        color: iccGold[7],
                    },
                }),
                student: () => ({
                    root: {
                        backgroundColor: iccGreen[0],
                        color: iccGreen[8],
                    },
                }),
            },
        },

        ActionIcon: {
            defaultProps: { variant: 'subtle', size: 'lg', radius: 'md' },
            styles: (t) => ({
                root: {
                    color: t.colors.gray[7],
                    '&:hover': {
                        backgroundColor: t.colors.iccBlue[0],
                        color: t.colors.iccBlue[7],
                    },
                },
            }),
        },

        NavLink: {
            styles: (t) => ({
                root: {
                    borderRadius: rem(10),
                    padding: '10px 14px',
                    fontWeight: 500,
                    color: t.colors.gray[2],
                    '&[data-active]': {
                        backgroundColor: t.colors.iccBlue[6],
                        color: '#ffffff',
                        boxShadow: `inset 3px 0 0 ${t.colors.iccGold[4]}`,
                        fontWeight: 600,
                    },
                    '&[data-active] .mantine-NavLink-icon': {
                        color: '#ffffff',
                    },
                    '&:hover': {
                        backgroundColor: t.colors.iccDark[7],
                        color: '#ffffff',
                    },
                },
                label: {
                    fontSize: rem(14),
                },
                icon: {
                    color: 'inherit',
                },
            }),
        },

        Progress: {
            defaultProps: { radius: 'xl', size: 'md' },
            styles: (t) => ({
                root: {
                    backgroundColor: t.colors.gray[2],
                },
            }),
        },

        TextInput: {
            defaultProps: { radius: 'md' },
            styles: (t) => ({
                input: {
                    borderColor: t.colors.gray[3],
                    '&:focus': {
                        borderColor: t.colors.iccBlue[5],
                    },
                },
                label: {
                    fontWeight: 600,
                    color: t.colors.gray[8],
                    marginBottom: 4,
                },
            }),
        },

        PasswordInput: {
            defaultProps: { radius: 'md' },
            styles: (t) => ({
                input: {
                    borderColor: t.colors.gray[3],
                    '&:focus': {
                        borderColor: t.colors.iccBlue[5],
                    },
                },
                label: {
                    fontWeight: 600,
                    color: t.colors.gray[8],
                    marginBottom: 4,
                },
            }),
        },

        Select: {
            defaultProps: { radius: 'md' },
            styles: (t) => ({
                input: { borderColor: t.colors.gray[3] },
                label: { fontWeight: 600, color: t.colors.gray[8] },
            }),
        },

        Menu: {
            defaultProps: { radius: 'md', shadow: 'md' },
            styles: (t) => ({
                dropdown: {
                    borderColor: t.colors.gray[2],
                },
            }),
        },

        Tabs: {
            styles: (t) => ({
                tab: {
                    fontWeight: 600,
                    '&[data-active]': {
                        color: t.colors.iccBlue[7],
                    },
                },
            }),
        },

        Container: {
            defaultProps: { size: 'xl' },
        },

        Avatar: {
            defaultProps: { radius: 'xl' },
        },

        Alert: {
            defaultProps: { radius: 'md' },
        },

        Tooltip: {
            defaultProps: { radius: 'sm', withArrow: true },
        },
    },
});

export default theme;
