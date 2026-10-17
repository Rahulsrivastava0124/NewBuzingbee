import { useEffect, useState } from "react";
import { useFeedback } from "../components/Feedback";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminAPI, authHelper, PORTAL, PORTAL_LABELS } from "../services/api";

// Set by the dashboard when an account was signed out for using the wrong portal
const readPortalNotice = () => {
  try {
    const notice = JSON.parse(sessionStorage.getItem("portalNotice") || "null");
    sessionStorage.removeItem("portalNotice");
    return notice;
  } catch {
    return null;
  }
};
import { PasswordField } from "../components/common";
import BrandMark from "../components/Brand";

export default function Login() {
  const navigate = useNavigate();
  const { notify } = useFeedback();

  // Deferred (and cancelled on cleanup) so it fires exactly once, after the
  // toast container is ready, even when React runs effects twice in dev
  useEffect(() => {
    if (!sessionStorage.getItem("sessionExpired")) return undefined;
    const t = setTimeout(() => {
      sessionStorage.removeItem("sessionExpired");
      notify("Your session expired. Please sign in again.", "warning");
    }, 0);
    return () => clearTimeout(t);
  }, [notify]);
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [portalNotice] = useState(readPortalNotice);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminAPI.login({
        username: formData.loginId,
        email: formData.loginId,
        password: formData.password,
      });

      if (response.token) {
        authHelper.saveToken(response.token, response.expiresAt);
        notify(`Welcome back${response.data?.username ? `, ${response.data.username}` : ""}!`, "success");
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
      <Paper
        sx={{
          width: "100%",
          maxWidth: 460,
          minHeight: { sm: 560 },
          p: { xs: 4, sm: 6 },
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Stack spacing={1.5} sx={{ alignItems: "center", mb: 4, textAlign: "center" }}>
          <BrandMark size={68} />
          {PORTAL && (
            <Chip color="primary" label={`${PORTAL_LABELS[PORTAL]} sign in`} sx={{ fontWeight: 600 }} />
          )}
          <Typography color="text.secondary">
            Welcome back to your creative workspace
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {portalNotice && (
              <Alert severity="warning">
                This account is a {PORTAL_LABELS[portalNotice.role] || portalNotice.role} account and signs in at{" "}
                <Link href={`${window.location.protocol}//${portalNotice.host}/login`} sx={{ fontWeight: 600 }}>
                  {portalNotice.host}
                </Link>
                .
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              size="medium"
              label="Username or Email"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              placeholder="admin or admin@buzingbee.com"
              required
              autoFocus
              autoComplete="username"
              disabled={loading}
            />

            <PasswordField
              size="medium"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
            />

            <Box sx={{ textAlign: "right", mt: -1 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                underline="hover"
                sx={{ fontSize: 14, fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ minHeight: 52, fontSize: 16 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
