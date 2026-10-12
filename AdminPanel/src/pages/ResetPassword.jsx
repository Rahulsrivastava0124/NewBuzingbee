import { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { adminAPI } from "../services/api";
import BrandMark from "../components/Brand";
import { PasswordField } from "../components/common";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await adminAPI.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Could not reset the password.");
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
          <Typography variant="h5">Choose a new password</Typography>
          <Typography color="text.secondary">
            Use at least 8 characters. You will sign in with it right after.
          </Typography>
        </Stack>

        {!token ? (
          <Alert severity="error">
            This reset link is missing its token. Request a new link from the
            sign-in page.
          </Alert>
        ) : done ? (
          <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
            <CircleCheck size={40} color="var(--mui-palette-success-main)" />
            <Alert severity="success" sx={{ width: "100%" }}>
              Password updated. Taking you to sign in...
            </Alert>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <PasswordField
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                disabled={loading}
              />
              <PasswordField
                label="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? "Saving..." : "Update password"}
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
