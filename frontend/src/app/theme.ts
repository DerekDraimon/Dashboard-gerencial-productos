import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    ink: Palette['primary'];
  }
  interface PaletteOptions {
    ink?: PaletteOptions['primary'];
  }
}

const INK = '#24262B';
const BORDER = '#E4E5E0';
const INPUT_BORDER = '#C9CCC4';
const CONTROL_RADIUS = 10;
const CARD_RADIUS = 14;

const baseTheme = createTheme({
  palette: {
    primary: { main: '#D9A62E', contrastText: INK },
    secondary: { main: '#9DB59F', contrastText: INK },
    error: { main: '#A33A2E', contrastText: '#FFFFFF' },
    ink: { main: INK, contrastText: '#FFFFFF' },
    background: { default: '#F5F6F3', paper: '#FFFFFF' },
    text: { primary: INK, secondary: '#5C5F66' },
    divider: BORDER,
  },
  shape: { borderRadius: CONTROL_RADIUS },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif',
    button: { fontWeight: 600, textTransform: 'none' },
  },
});

const desktop = baseTheme.breakpoints.up('md');

function heading(fontSize: string, desktopFontSize: string) {
  return { fontSize, fontWeight: 700, [desktop]: { fontSize: desktopFontSize } };
}

export const theme = createTheme(baseTheme, {
  typography: {
    h1: heading('2rem', '2.5rem'),
    h2: heading('1.75rem', '2.125rem'),
    h3: heading('1.5rem', '1.875rem'),
    h4: heading('1.375rem', '1.625rem'),
    h5: heading('1.125rem', '1.375rem'),
    h6: heading('1rem', '1.125rem'),
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: CONTROL_RADIUS, textTransform: 'none' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: CONTROL_RADIUS },
        notchedOutline: { borderColor: INPUT_BORDER },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: CARD_RADIUS } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: CARD_RADIUS, border: `1px solid ${BORDER}` } },
    },
  },
});
