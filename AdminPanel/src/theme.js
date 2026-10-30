import { createTheme } from "@mui/material/styles";

// Minimal palette: quiet greys everywhere, honey only for primary actions
const honey = "#f5a623";
const honeyDeep = "#e8920a";
const border = "#ececef";
const subtle = "#f4f4f5";
const ink = "#111827";
const muted = "#6b7280";

const SOFT_CHIP_COLORS = ["primary", "secondary", "success", "error", "warning", "info"];

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
    background: { default: "#f7f7f8", paper: "#ffffff" },
    text: { primary: ink, secondary: muted, disabled: "#9ca3af" },
    divider: border,
    action: { hover: "rgba(17, 24, 39, 0.04)" },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
        "*": { scrollbarWidth: "thin" },
      },
    },

    // Rounded (pill) buttons everywhere
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 38, paddingInline: 18 },
        sizeSmall: { minHeight: 32, paddingInline: 14 },
        sizeLarge: { minHeight: 46, paddingInline: 24 },
        startIcon: { marginRight: 8, "& > svg": { width: 18, height: 18 } },
        endIcon: { marginLeft: 8, "& > svg": { width: 18, height: 18 } },
        containedPrimary: { "&:hover": { backgroundColor: honeyDeep } },
        outlined: {
          borderColor: border,
          backgroundColor: "#fff",
          "&:hover": { borderColor: "#d4d4d8", backgroundColor: subtle },
        },
        outlinedPrimary: { color: ink },
        outlinedInherit: { color: ink },
        text: { "&:hover": { backgroundColor: subtle } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        // Plain icon buttons stay grey; coloured ones (view, edit, delete...) get a soft tint
        root: ({ ownerState }) => {
          const c = ownerState.color;
          if (!SOFT_CHIP_COLORS.includes(c)) return { borderRadius: 999, color: "#4b5563" };
          const main = `var(--mui-palette-${c}-main)`;
          return {
            borderRadius: 999,
            color: c === "primary" ? honeyDeep : main,
            backgroundColor: `color-mix(in srgb, ${main} 12%, transparent)`,
            "&:hover": { backgroundColor: `color-mix(in srgb, ${main} 22%, transparent)` },
            "&.Mui-disabled": { backgroundColor: "transparent" },
          };
        },
        sizeSmall: { padding: 6, "& svg": { width: 18, height: 18 } },
      },
    },

    // Flat cards: thin border, no shadow
    MuiPaper: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 16, borderColor: border, boxShadow: "none" },
      },
    },

    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: "#fff", borderRadius: 12 },
        notchedOutline: { borderColor: "#e4e4e7" },
      },
    },
    MuiInputAdornment: { styleOverrides: { root: { color: muted } } },

    // Segmented filters: grey track, white pill for the active option
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: subtle,
          borderRadius: 999,
          padding: 3,
          gap: 2,
          alignSelf: "flex-start",
          flexWrap: "wrap",
          maxWidth: "100%",
        },
        grouped: { border: 0, borderRadius: "999px !important", margin: "0 !important" },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 32,
          paddingInline: 14,
          border: 0,
          color: muted,
          "&:hover": { backgroundColor: "rgba(255,255,255,0.7)" },
          "&.Mui-selected, &.Mui-selected:hover": {
            color: ink,
            backgroundColor: "#fff",
            boxShadow: "0 1px 2px rgba(17, 24, 39, 0.08)",
          },
        },
      },
    },

    MuiTabs: { styleOverrides: { indicator: { height: 2, borderRadius: 2 } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 44 } } },

    // Quiet tables
    MuiTableContainer: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#f1f1f3", paddingBlock: 12, paddingInline: 10 },
        head: {
          fontSize: 12,
          fontWeight: 600,
          color: muted,
          whiteSpace: "nowrap",
          backgroundColor: "#fafafa",
          borderBottom: `1px solid ${border}`,
          paddingBlock: 10,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
          "tbody &:hover": { backgroundColor: "#fafafa" },
        },
      },
    },

    // Soft tinted chips instead of solid colour blocks
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          fontWeight: 600,
          fontSize: 12,
          height: 24,
          ...(ownerState.variant !== "outlined" &&
            SOFT_CHIP_COLORS.includes(ownerState.color) && {
              color: ownerState.color === "primary" ? honeyDeep : `var(--mui-palette-${ownerState.color}-main)`,
              backgroundColor: `color-mix(in srgb, var(--mui-palette-${ownerState.color}-main) 14%, transparent)`,
            }),
          ...(ownerState.variant !== "outlined" &&
            ownerState.color === "default" && { backgroundColor: subtle, color: ink }),
        }),
        label: { paddingInline: 10 },
        outlined: { borderColor: border },
      },
    },

    MuiDialog: {
      defaultProps: { fullWidth: true },
      styleOverrides: { paper: { borderRadius: 20, boxShadow: "0 20px 40px -12px rgba(17, 24, 39, 0.18)" } },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: "1.125rem", fontWeight: 700 } } },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 14, boxShadow: "0 12px 32px -8px rgba(17, 24, 39, 0.16)" },
      },
    },
    MuiMenuItem: { styleOverrides: { root: { borderRadius: 8, marginInline: 4 } } },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 14 } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: "#fff" } } },
    MuiToolbar: { styleOverrides: { root: { minHeight: 64 } } },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: `1px solid ${border}`, backgroundColor: "#fff" } },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 36, color: muted } } },
    MuiListItemText: { styleOverrides: { primary: { fontSize: 14, fontWeight: 500 } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8, backgroundColor: ink } },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12, alignItems: "center" } } },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: `1px solid ${border}` },
        toolbar: { minHeight: 52 },
      },
    },
  },
});

export default theme;
