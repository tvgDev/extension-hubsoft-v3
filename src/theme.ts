import { createTheme } from "@mui/material/styles";

// Cores e medidas tiradas da tela de agentes do FOCUS Chat, para o módulo
// parecer parte do sistema.
export const colors = {
  navy: "#192d3e",
  navyDark: "#122130",
  pageBackground: "#f9fafc",
  text: "#334256",
  textMuted: "#64748b",
  label: "#9e9e9e",
  border: "#e2e8f0",
  inputBorder: "#c4c4c4",
};

export const headerGradient = `linear-gradient(90deg, ${colors.navyDark} 0%, ${colors.navy} 100%)`;

export const theme = createTheme({
  palette: {
    primary: { main: colors.navy, contrastText: "#ffffff" },
    secondary: { main: "#0e7490" },
    background: { default: colors.pageBackground, paper: "#ffffff" },
    text: { primary: colors.text, secondary: colors.textMuted, disabled: colors.label },
    divider: colors.border,
    success: { main: "#15803d" },
    warning: { main: "#b45309" },
    error: { main: "#b91c1c" },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    h6: { fontWeight: 700 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: false },
      styleOverrides: { root: { letterSpacing: "0.02em" } },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          fontSize: "1rem",
          minWidth: 160,
          color: colors.textMuted,
          "&.Mui-selected": { color: colors.navy },
        },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 2, backgroundColor: colors.navy } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: colors.label } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: colors.inputBorder },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, color: colors.navy } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
  },
});
