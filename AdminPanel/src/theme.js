import { createTheme } from "@mui/material/styles";

const honey = "#f5a623";
const honeyDeep = "#e8920a";
const border = "#e2e8f0";
const ink = "#0f172a";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: honey, dark: honeyDeep, contrastText: ink },
    secondary: { main: "#3b82f6" },
    success: { main: "#059669" },
    error: { main: "#dc2626" },
    warning: { main: "#d97706" },
    info: { main: "#2563eb" },
    background: { default: "#f6f8fb", paper: "#ffffff" },
    text: { primary: ink, secondary: "#64748b", disabled: "#94a3b8" },
    divider: border,
    action: { hover: "rgba(15, 23, 42, 0.035)" },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  typography: {
    fontFamily:
      '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700, fontSize: "1.0625rem" },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    body2: { lineHeight: 1.55 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": { height: "100%" },
        body: { WebkitFontSmoothing: "antialiased" },
        // Lucide icons inherit the colour of their container
        "svg.lucide": { flexShrink: 0 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40, paddingInline: 16 },
        sizeSmall: { minHeight: 32, paddingInline: 12 },
        startIcon: { marginRight: 8, "& > svg": { width: 18, height: 18 } },
        endIcon: { marginLeft: 8, "& > svg": { width: 18, height: 18 } },
        containedPrimary: {
          "&:hover": { backgroundColor: honeyDeep },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10, color: "#475569" },
        sizeSmall: { padding: 6, "& svg": { width: 18, height: 18 } },
      },
    },
    MuiPaper: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 14,
          borderColor: border,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: "#fff", borderRadius: 10 },
        notchedOutline: { borderColor: "#dbe2ea" },
      },
    },
    MuiInputAdornment: {
      styleOverrides: { root: { color: "#64748b" } },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          borderRadius: 10,
          alignSelf: "flex-start",
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 40,
          borderColor: "#dbe2ea",
          color: "#475569",
          "&.Mui-selected": {
            color: ink,
            backgroundColor: "rgba(245, 166, 35, 0.18)",
            "&:hover": { backgroundColor: "rgba(245, 166, 35, 0.26)" },
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#eef2f6", paddingBlock: 14 },
        head: {
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#64748b",
          whiteSpace: "nowrap",
          backgroundColor: "#f8fafc",
          borderBottom: `1px solid ${border}`,
          paddingBlock: 12,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:last-child td": { borderBottom: 0 } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: 12, height: 24 },
        label: { paddingInline: 10 },
      },
    },
    MuiDialog: {
      defaultProps: { fullWidth: true },
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: "1.125rem", fontWeight: 700 } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundColor: "#fff" } },
    },
    MuiToolbar: {
      styleOverrides: { root: { minHeight: 64 } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${border}`, backgroundColor: "#fff" },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 36, color: "#64748b" } },
    },
    MuiListItemText: {
      styleOverrides: { primary: { fontSize: 14, fontWeight: 500 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10, alignItems: "center" } },
    },
  },
});

export default theme;
