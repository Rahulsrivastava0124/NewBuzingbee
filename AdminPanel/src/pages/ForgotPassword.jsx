import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ArrowLeft, MailCheck } from "lucide-react";
import { adminAPI } from "../services/api";
import BrandMark from "../components/Brand";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminAPI.forgotPassword({ email: identifier.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send the reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background:
          "radial-gradient(circle at 20% 10%, rgba(245,166,35,0.22), transparent 45%), radial-gradient(circle at 85% 90%, rgba(255,140,0,0.14), transparent 40%)",
        bgcolor: "background.default",
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
        <Stack spacing={1} sx={{ alignItems: "center", mb: 3, textAlign: "center" }}>
          <BrandMark size={56} />
          <Typography variant="h5">Forgot your password?</Typography>
          <Typography color="text.secondary">
            Enter your admin email or username and we will send you a link to
            choose a new password.
          </Typography>
        </Stack>

        {sent ? (
          <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
            <MailCheck size={40} color="var(--mui-palette-success-main)" />
            <Alert severity="success" sx={{ width: "100%" }}>
              If an account matches, a reset link is on its way. It expires in
              30 minutes.
            </Alert>
            <Button variant="outlined" onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !identifier.trim()}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </Stack>
          </Box>
        )}

        <Stack direction="row" sx={{ justifyContent: "center", mt: 3 }}>
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontWeight: 600 }}
          >
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
}
