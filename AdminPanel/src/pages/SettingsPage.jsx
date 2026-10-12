import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminAPI } from "../services/api";
import { LoadingState, PageHeader, PasswordField } from "../components/common";
import CompanyTab from "./settings/CompanyTab";
import EmailTab from "./settings/EmailTab";
import { Building2, Lock, Mail, Save, User } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const EMPTY_PASSWORDS = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORDS);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminAPI.getProfile();
        const admin = response?.admin || null;
        setProfile(admin);
        setForm({
          username: admin?.username || "",
          email: admin?.email || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setProfileSuccess("");
    setProfileError("");
  };

  const handlePasswordInputChange = (key) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [key]: event.target.value }));
    setPasswordSuccess("");
    setPasswordError("");
  };

  const handleReset = () => {
    setForm({ username: profile?.username || "", email: profile?.email || "" });
    setProfileError("");
    setProfileSuccess("");
  };

  const handlePasswordReset = () => {
    setPasswordForm(EMPTY_PASSWORDS);
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const payload = { username: form.username.trim(), email: form.email.trim() };
    if (!payload.username || !payload.email) {
      setProfileError("Username and email are required.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await adminAPI.updateProfile(payload);
      const updatedAdmin = response?.admin || null;
      setProfile((prev) => ({ ...prev, ...updatedAdmin }));
      setForm({
        username: updatedAdmin?.username || payload.username,
        email: updatedAdmin?.email || payload.email,
      });
      setProfileSuccess(response?.message || "Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const payload = { ...passwordForm };
    if (!payload.currentPassword || !payload.newPassword || !payload.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (payload.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (payload.newPassword !== payload.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await adminAPI.updateProfile(payload);
      setPasswordSuccess(response?.message || "Password updated successfully.");
      setPasswordForm(EMPTY_PASSWORDS);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading profile settings..." />;

  return (
    <Box sx={{ maxWidth: 640 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
            <User />
          </Avatar>
          <Box>
            <Typography variant="h6">Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {profile?._id || profile?.id || "—"}
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleProfileSubmit}>
          <Stack spacing={2.5}>
            {profileError && <Alert severity="error">{profileError}</Alert>}
            {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}
            <TextField
              label="Username"
              value={form.username}
              onChange={handleInputChange("username")}
              autoComplete="username"
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleInputChange("email")}
              autoComplete="email"
            />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
              <Button color="inherit" onClick={handleReset} disabled={profileSaving}>
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Lock />
          </Avatar>
          <Box>
            <Typography variant="h6">Change Password</Typography>
            <Typography variant="body2" color="text.secondary">
              Keep your account secure by updating your password regularly.
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handlePasswordSubmit}>
          <Stack spacing={2.5}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}
            <PasswordField
              label="Current password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange("currentPassword")}
              autoComplete="current-password"
              disabled={passwordSaving}
            />
            <PasswordField
              label="New password"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange("newPassword")}
              autoComplete="new-password"
              disabled={passwordSaving}
            />
            <PasswordField
              label="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange("confirmPassword")}
              autoComplete="new-password"
              disabled={passwordSaving}
            />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
              <Button color="inherit" onClick={handlePasswordReset} disabled={passwordSaving}>
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={passwordSaving}
              >
                {passwordSaving ? "Saving..." : "Update Password"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

const TABS = [
  { key: "profile", label: "Profile & password", icon: <User size={18} /> },
  { key: "company", label: "Company", icon: <Building2 size={18} /> },
  { key: "email", label: "Email (SMTP)", icon: <Mail size={18} /> },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const current = TABS.some((t) => t.key === params.get("tab"))
    ? params.get("tab")
    : "profile";

  return (
    <Box sx={{ maxWidth: 900 }}>
      <PageHeader
        title="Settings"
        subtitle="Your profile, company details and outgoing email."
      />
      <Tabs
        value={current}
        onChange={(_, value) => setParams({ tab: value }, { replace: true })}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>

      {current === "profile" && <ProfileSettings />}
      {current === "company" && <CompanyTab />}
      {current === "email" && <EmailTab />}
    </Box>
  );
}
