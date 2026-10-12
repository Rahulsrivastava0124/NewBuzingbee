import { Component } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { RefreshCw, TriangleAlert } from "lucide-react";

// Last-resort guard so a render error shows a recoverable screen, not a blank page.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
        <Paper sx={{ p: 4, maxWidth: 420, textAlign: "center" }}>
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <TriangleAlert size={40} color="var(--mui-palette-warning-main)" />
            <Typography variant="h5">Something went wrong</Typography>
            <Typography color="text.secondary">
              The page hit an unexpected error. Reloading usually fixes it.
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshCw />}
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }
}
