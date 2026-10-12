import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminAPI, authHelper } from "../services/api";
import { PasswordField } from "../components/common";
import BrandMark from "../components/Brand";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
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
      <Paper sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
        <Stack spacing={1} sx={{ alignItems: "center", mb: 3, textAlign: "center" }}>
          <BrandMark size={56} />
          <Typography variant="h5">BuzingBee</Typography>
          <Typography color="text.secondary">
            Welcome back to your creative workspace
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
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
