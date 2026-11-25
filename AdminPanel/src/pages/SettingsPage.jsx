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
import { IconTile, LoadingState, PageHeader } from "../components/common";
import CompanyTab from "./settings/CompanyTab";
import EmailTab from "./settings/EmailTab";
import ActivityTab from "./settings/ActivityTab";
import PaymentTab from "./settings/PaymentTab";
import { Building2, KeyRound, Landmark, Mail, MessageCircle, Save, ScrollText, User } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";

function SectionTitle({ icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
      <IconTile>{icon}</IconTile>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });

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

  const handleInputChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setProfileSuccess("");
    setProfileError("");
  };

  const handleReset = () => {
    setForm({ username: profile?.username || "", email: profile?.email || "" });
    setProfileError("");
    setProfileSuccess("");
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

  if (loading) return <LoadingState text="Loading profile settings..." />;

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
          <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
            <SectionTitle
              icon={<KeyRound />}
              title="How you sign in"
              subtitle="There are no passwords. Each sign-in uses a one-time code."
            />
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <MessageCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <Typography variant="body2">
                  <strong>WhatsApp:</strong> a code goes to the mobile number saved on your account
                  {profile?.phone ? ` (${profile.phone})` : " (none saved yet; ask the super admin to add it)"}.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Mail size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <Typography variant="body2">
                  <strong>Email:</strong> a code goes to {profile?.email || "your account email"}. If you change your
                  email here, use the new address next time you sign in.
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

const TABS = [
  { key: "profile", label: "Profile", icon: <User size={18} /> },
  // Super admin's payment details live on the Company tab
  { key: "payment", label: "Payment details", icon: <Landmark size={18} />, notSuper: true },
  { key: "company", label: "Company", icon: <Building2 size={18} />, superOnly: true },
  { key: "email", label: "Email (SMTP)", icon: <Mail size={18} />, superOnly: true },
  { key: "activity", label: "Activity log", icon: <ScrollText size={18} />, superOnly: true },
];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const { admin } = useOutletContext() || {};
  const isSuper = admin?.role === "super";
  const tabs = TABS.filter((t) => (t.superOnly ? isSuper : t.notSuper ? !isSuper : true));
  const current = tabs.some((t) => t.key === params.get("tab"))
    ? params.get("tab")
    : "profile";

  return (
    <Box>
      <PageHeader
        title="Settings"
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
      {current === "payment" && <PaymentTab />}
      {current === "company" && <CompanyTab />}
      {current === "email" && <EmailTab />}
      {current === "activity" && <ActivityTab />}
    </Box>
  );
}
