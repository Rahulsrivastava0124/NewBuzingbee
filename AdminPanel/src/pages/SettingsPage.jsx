import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { adminAPI } from "../services/api";
import { IconTile, LoadingState, PageHeader, PasswordField } from "../components/common";
import CompanyTab from "./settings/CompanyTab";
import EmailTab from "./settings/EmailTab";
import ActivityTab from "./settings/ActivityTab";
import { Building2, Lock, Mail, MailCheck, Save, ScrollText, User } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";

const EMPTY_PASSWORDS = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
};

const RESEND_SECONDS = 60;

function SectionTitle({ icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
      <IconTile>{icon}</IconTile>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

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
  const [otpSending, setOtpSending] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminAPI.getProfile();
        const admin = response?.admin || null;
        setProfile(admin);
        setForm({ username: admin?.username || "", email: admin?.email || "" });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleInputChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setProfileSuccess("");
    setProfileError("");
  };

  const handlePasswordInputChange = (key) => (event) => {
    const value = key === "otp" ? event.target.value.replace(/\D/g, "").slice(0, 6) : event.target.value;
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
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
    setOtpSentTo("");
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

  // Same checks the server makes, so the code isn't emailed for a form that will fail
  const passwordProblem = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) return "All password fields are required.";
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (newPassword !== confirmPassword) return "New password and confirm password do not match.";
    if (newPassword === currentPassword) return "New password must be different from the current one.";
    return "";
  };

  const sendCode = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    const problem = passwordProblem();
    if (problem) {
      setPasswordError(problem);
      return;
    }
    setOtpSending(true);
    try {
      const response = await adminAPI.sendPasswordOtp();
      setOtpSentTo(response?.message || "Verification code sent to your email.");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setPasswordError(err.message || "Could not send the verification code");
    } finally {
      setOtpSending(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const problem = passwordProblem();
    if (problem) {
      setPasswordError(problem);
      return;
    }
    if (!otpSentTo) {
      await sendCode();
      return;
    }
    if (passwordForm.otp.length !== 6) {
      setPasswordError("Enter the 6-digit code from your email.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await adminAPI.updateProfile(passwordForm);
      setPasswordSuccess(response?.message || "Password updated successfully.");
      setPasswordForm(EMPTY_PASSWORDS);
      setOtpSentTo("");
      setCooldown(0);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading profile settings..." />;

  const passwordBusy = passwordSaving || otpSending;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper component="form" onSubmit={handleProfileSubmit} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionTitle
              icon={<User />}
              title="Profile"
              subtitle={`ID: ${profile?._id || profile?.id || "—"}`}
            />
            <Grid container spacing={2}>
              {profileError && (
                <Grid size={12}>
                  <Alert severity="error">{profileError}</Alert>
                </Grid>
              )}
              {profileSuccess && (
                <Grid size={12}>
                  <Alert severity="success">{profileSuccess}</Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                <TextField
                  label="Username"
                  value={form.username}
                  onChange={handleInputChange("username")}
                  autoComplete="username"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange("email")}
                  autoComplete="email"
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 3 }}>
              <Button variant="outlined" onClick={handleReset} disabled={profileSaving}>
                Reset
              </Button>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save changes"}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper component="form" onSubmit={handlePasswordSubmit} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionTitle
              icon={<Lock />}
              title="Change password"
              subtitle="We'll email you a 6-digit code to confirm it's you."
            />
            <Grid container spacing={2}>
              {passwordError && (
                <Grid size={12}>
                  <Alert severity="error">{passwordError}</Alert>
                </Grid>
              )}
              {passwordSuccess && (
                <Grid size={12}>
                  <Alert severity="success">{passwordSuccess}</Alert>
                </Grid>
              )}
              <Grid size={12}>
                <PasswordField
                  label="Current password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange("currentPassword")}
                  autoComplete="current-password"
                  disabled={passwordBusy}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <PasswordField
                  label="New password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange("newPassword")}
                  autoComplete="new-password"
                  helperText="At least 8 characters"
                  disabled={passwordBusy}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <PasswordField
                  label="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange("confirmPassword")}
                  autoComplete="new-password"
                  disabled={passwordBusy}
                />
              </Grid>

              {otpSentTo && (
                <>
                  <Grid size={12}>
                    <Alert severity="info" icon={<MailCheck size={18} />}>
                      {otpSentTo}. It expires in 10 minutes.
                    </Alert>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Verification code"
                      value={passwordForm.otp}
                      onChange={handlePasswordInputChange("otp")}
                      autoComplete="one-time-code"
                      autoFocus
                      disabled={passwordSaving}
                      slotProps={{
                        htmlInput: {
                          inputMode: "numeric",
                          maxLength: 6,
                          style: { letterSpacing: "0.4em", fontVariantNumeric: "tabular-nums" },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                    <Button onClick={sendCode} disabled={cooldown > 0 || passwordBusy}>
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 3 }}>
              <Button variant="outlined" onClick={handlePasswordReset} disabled={passwordBusy}>
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={otpSentTo ? <Save /> : <Mail />}
                disabled={passwordBusy || Boolean(otpSentTo && passwordForm.otp.length !== 6)}
              >
                {otpSending
                  ? "Sending code..."
                  : passwordSaving
                    ? "Saving..."
                    : otpSentTo
                      ? "Update password"
                      : "Send verification code"}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

const TABS = [
  { key: "profile", label: "Profile & password", icon: <User size={18} /> },
  { key: "company", label: "Company", icon: <Building2 size={18} />, superOnly: true },
  { key: "email", label: "Email (SMTP)", icon: <Mail size={18} />, superOnly: true },
  { key: "activity", label: "Activity log", icon: <ScrollText size={18} />, superOnly: true },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const { admin } = useOutletContext() || {};
  const tabs = TABS.filter((t) => !t.superOnly || admin?.role === "super");
  const current = tabs.some((t) => t.key === params.get("tab"))
    ? params.get("tab")
    : "profile";

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle={
          tabs.length > 1
            ? "Your profile, company details, outgoing email and activity."
            : "Your profile and password."
        }
      />
      <Tabs
        value={current}
        onChange={(_, value) => setParams({ tab: value }, { replace: true })}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((t) => (
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
      {current === "activity" && <ActivityTab />}
    </Box>
  );
}
