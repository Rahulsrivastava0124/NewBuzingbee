import { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Eye, EyeOff, Search } from "lucide-react";

// Tinted square that holds an icon: stat cards, empty states.
export function IconTile({ children, color = "primary", size = 44 }) {
  return (
    <Box
      sx={(t) => ({
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "12px",
        display: "grid",
        placeItems: "center",
        color: `${color}.main`,
        bgcolor: `color-mix(in srgb, ${t.vars.palette[color].main} 14%, transparent)`,
      })}
    >
      {children}
    </Box>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        mb: 3,
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            flexShrink: 0,
            width: { xs: "100%", sm: "auto" },
            "& > *": { flex: { xs: "1 1 auto", sm: "0 0 auto" } },
          }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

export function LoadingState({ text = "Loading..." }) {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "center", py: 10 }}
    >
      <CircularProgress color="primary" />
      <Typography color="text.secondary">{text}</Typography>
    </Stack>
  );
}

export function EmptyState({ icon, title, children }) {
  return (
    <Paper sx={{ py: 8, px: 3, textAlign: "center" }}>
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        {icon && <IconTile size={64}>{icon}</IconTile>}
        {title && <Typography variant="h6">{title}</Typography>}
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {children}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function PasswordField({ disabled, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      {...props}
      disabled={disabled}
      type={show ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
                disabled={disabled}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function StatCard({ label, value, icon, color = "primary", caption, chip }) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      {/* Count and label on the left, icon on the right */}
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: 14 }} noWrap>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontSize: 28, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <IconTile color={color}>{icon}</IconTile>
      </Stack>
      {(caption || chip) && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5, minHeight: 24 }}>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
          {chip}
        </Stack>
      )}
    </Paper>
  );
}

// Rounded search box used in table toolbars
export function SearchField({ value, onChange, placeholder = "Search...", sx }) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{ maxWidth: { sm: 340 }, ...sx }}
      slotProps={{
        input: {
          sx: { borderRadius: 999 },
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} />
            </InputAdornment>
          ),
        },
        htmlInput: { "aria-label": placeholder },
      }}
    />
  );
}

// Toolbar row above a table: search on the left, filters on the right
export function TableToolbar({ children }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{ alignItems: { md: "center" }, justifyContent: "space-between", flexWrap: "wrap", rowGap: 1.5 }}
    >
      {children}
    </Stack>
  );
}
