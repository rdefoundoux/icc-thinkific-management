import { createTheme, rem } from '@mantine/core';

// ────────────────────────────────────────────────────────────────────
//  PCNC Corporate brand palette
//  PCNC Corporate is the training program inside ICC (Impact Centre Chrétien).
// ────────────────────────────────────────────────────────────────────

// Each palette gets 10 shades, all set to the same base hex.
// Mantine's colorScheme expects an array of length 10.
const createShades = (baseColor) => Array(10).fill(baseColor);

const pcncNavy = createShades('#161E3F');        // primaire foncé — sidebar, headers
const pcncBlue = createShades('#83CEE0');        // bleu clair — accents, hover
const pcncPurple = createShades('#662D91');      // violet — accents
const pcncOrange = createShades('#F9A061');      // orange — accents chauds
const pcncTeal = createShades('#00B0CA');        // teal — primary accent
const pcncYellow = createShades('#FFE069');      // jaune — warning
const pcncGreen = createShades('#86C8A1');       // vert — success
const pcncLightPurple = createShades('#A67FB5'); // violet clair

const gray = [
    '#F8FAFC', '#F1F4F8', '#E5EAF1', '#D2DAE5', '#B6C0CF',
    '#94A0B3', '#6C7791', '#525B73', '#3E4660', '#2D3450',
];

// Keep a reasonable red for "danger" usages (Mantine's default red, slightly muted).
const fallbackRed = [
    '#FFF0F0', '#FFD9D9', '#FFB3B3', '#FF8585', '#FF5C5C',
    '#F03E3E', '#E03131', '#C92A2A', '#A61E1E', '#7C1414',
];

const theme = createTheme({
    primaryColor: 'pcncTeal',
    primaryShade: { light: 0, dark: 0 },

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
        pcncNavy,
        pcncBlue,
        pcncPurple,
        pcncOrange,
        pcncTeal,
        pcncYellow,
        pcncGreen,
        pcncLightPurple,
        gray,
        // Aliases so existing <Badge color="blue" /> etc. pick up PCNC tones.
        blue: pcncTeal,
        indigo: pcncNavy,
        cyan: pcncBlue,
        violet: pcncPurple,
        grape: pcncPurple,
        red: fallbackRed,
        pink: pcncOrange,
        orange: pcncOrange,
        yellow: pcncYellow,
        green: pcncGreen,
        teal: pcncTeal,
        lime: pcncGreen,
        dark: pcncNavy,
    },

    other: {
        sidebarBg: pcncNavy[0],
        sidebarHover: 'rgba(255,255,255,0.05)',
        sidebarActiveBg: pcncTeal[0],
        sidebarAccent: pcncOrange[0],
        contentBg: gray[0],
        cardBorder: gray[2],
        cardShadow: '0 1px 3px rgba(22, 30, 63, 0.05), 0 1px 2px rgba(22, 30, 63, 0.06)',
        cardShadowHover: '0 8px 24px rgba(22, 30, 63, 0.10), 0 2px 6px rgba(22, 30, 63, 0.06)',
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
                    color: t.colors.pcncNavy[0],
                },
            }),
        },

        Title: {
            styles: (t) => ({
                root: {
                    color: t.colors.pcncNavy[0],
                    letterSpacing: '-0.01em',
                },
            }),
        },

        Anchor: {
            styles: (t) => ({
                root: {
                    color: t.colors.pcncTeal[0],
                    fontWeight: 500,
                    '&:hover': { color: t.colors.pcncPurple[0] },
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
                    backgroundColor: t.colors.gray[1],
                },
                th: {
                    color: t.colors.pcncNavy[0],
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: rem(12),
                    letterSpacing: '0.04em',
                    padding: '12px 16px',
                    borderBottom: `1px solid ${t.colors.gray[2]}`,
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
            defaultProps: { variant: 'subtle', size: 'lg', radius: 'md' },
            styles: (t) => ({
                root: {
                    color: t.colors.gray[7],
                    '&:hover': {
                        backgroundColor: t.colors.gray[1],
                        color: t.colors.pcncTeal[0],
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
                        backgroundColor: t.colors.pcncTeal[0],
                        color: '#ffffff',
                        boxShadow: `inset 3px 0 0 ${t.colors.pcncOrange[0]}`,
                        fontWeight: 600,
                    },
                    '&[data-active] .mantine-NavLink-icon': {
                        color: '#ffffff',
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)',
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
                        borderColor: t.colors.pcncTeal[0],
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
                        borderColor: t.colors.pcncTeal[0],
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
                        color: t.colors.pcncTeal[0],
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
