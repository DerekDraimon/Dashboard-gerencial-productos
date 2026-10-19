import { alpha, createTheme } from '@mui/material/styles';

/** Single source of every color in the app (Ocre palette). Components use these through the theme. */
const COLORS = {
  ink: '#24262B',
  inkSoft: '#3A3D43',
  grey: '#5C5F66',
  slate: '#6E7178',
  silver: '#B9BBC0',
  mist: '#C9CBCF',
  stone: '#C9CCC4',
  border: '#E4E5E0',
  track: '#ECEDE8',
  canvas: '#F5F6F3',
  header: '#FAFAF8',
  white: '#FFFFFF',
  black: '#000000',
  ochre: '#D9A62E',
  sage: '#9DB59F',
  sageTint: '#E6EDE6',
  danger: '#A33A2E',
  dangerDark: '#7E2A20',
  dangerTint: '#F8E9E6',
} as const;

declare module '@mui/material/styles' {
  interface Palette {
    ink: Palette['primary'];
    /** Pale backgrounds behind icons and rows: sage for neutral, danger for errors. */
    tint: { sage: string; danger: string };
    /** Quiet surfaces: table header, row dividers and empty image or bar tracks. */
    surface: { header: string; track: string };
    /** Text and accents on the dark sidebar and login panel. */
    inverse: { text: string; muted: string; soft: string; subtle: string; hover: string };
    /** Category chart slices, in order. */
    chart: string[];
  }
  interface PaletteOptions {
    ink?: PaletteOptions['primary'];
    tint?: Palette['tint'];
    surface?: Palette['surface'];
    inverse?: Palette['inverse'];
    chart?: string[];
  }
  interface TypeText {
    /** Body copy a step lighter than the ink. */
    soft: string;
    /** Secondary labels on charts. */
    muted: string;
  }
}

const INK = COLORS.ink;
const BORDER = COLORS.border;
const INPUT_BORDER = COLORS.stone;
const CONTROL_RADIUS = 10;
const CARD_RADIUS = 14;

const baseTheme = createTheme({
  palette: {
    primary: { main: COLORS.ochre, contrastText: INK },
    secondary: { main: COLORS.sage, contrastText: INK },
    error: { main: COLORS.danger, dark: COLORS.dangerDark, contrastText: COLORS.white },
    ink: { main: INK, contrastText: COLORS.white },
    background: { default: COLORS.canvas, paper: COLORS.white },
    text: { primary: INK, secondary: COLORS.grey, soft: COLORS.inkSoft, muted: COLORS.slate },
    divider: BORDER,
    tint: { sage: COLORS.sageTint, danger: COLORS.dangerTint },
    surface: { header: COLORS.header, track: COLORS.track },
    inverse: {
      text: COLORS.canvas,
      muted: COLORS.silver,
      soft: COLORS.border,
      subtle: COLORS.mist,
      hover: alpha(COLORS.white, 0.08),
    },
    chart: [INK, COLORS.ochre, COLORS.sage, COLORS.slate, COLORS.stone],
    common: { black: COLORS.black, white: COLORS.white },
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
    // Same spacing semantics as CSS gap, so hidden children never leave a margin behind.
    MuiStack: {
      defaultProps: { useFlexGap: true },
    },
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
