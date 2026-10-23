import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Mail, Save, Send } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PasswordField } from "../../components/common";

const PRESETS = [
  { label: "GoDaddy Workspace", host: "smtpout.secureserver.net", port: 465, secure: true },
  { label: "Microsoft 365", host: "smtp.office365.com", port: 587, secure: false },
  { label: "Gmail", host: "smtp.gmail.com", port: 465, secure: true },
  { label: "Titan", host: "smtp.titan.email", port: 587, secure: false },
];

export default function EmailTab() {
  const { notify } = useFeedback();
  const [form, setForm] = useState({
    host: "",
    port: 465,
    secure: true,
    user: "",
    from: "",
    pass: "",
  });
  const [passSet, setPassSet] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    settingsAPI
      .get()
      .then(({ smtp }) => {
        setForm({
          host: smtp.host || "",
          port: smtp.port || 465,
          secure: Boolean(smtp.secure),
          user: smtp.user || "",
          from: smtp.from || "",
          pass: "",
        });
        setPassSet(smtp.passSet);
        setConfigured(smtp.configured);
        setTestTo(smtp.user || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const applyPreset = (preset) =>
    setForm((prev) => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setConnection(null);
    try {
      const data = await settingsAPI.saveSmtp({
        host: form.host,
        port: Number(form.port),
        secure: form.secure,
        user: form.user,
        from: form.from,
        pass: form.pass,
      });
      setPassSet(data.smtp.passSet);
      setConfigured(data.smtp.configured);
      setForm((prev) => ({ ...prev, pass: "" }));
      setConnection(data.connection);
      notify(
        data.connection.connected
          ? "Email settings saved and connected"
          : "Settings saved, but the connection check failed",
        data.connection.connected ? "success" : "warning",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const data = await settingsAPI.testSmtp({ to: testTo });
      notify(data.message, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <LoadingState text="Loading email settings..." />;

  return (
    <Stack spacing={3}>
      <Paper component="form" onSubmit={save} sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
          <Mail size={22} />
          <Typography variant="h6">Email (SMTP)</Typography>
          <Chip
            size="small"
            color={configured ? "success" : "warning"}
            label={configured ? "Configured" : "Not configured"}
            variant="outlined"
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label}
              clickable
              onClick={() => applyPreset(p)}
              variant={form.host === p.host ? "filled" : "outlined"}
              color={form.host === p.host ? "primary" : "default"}
            />
          ))}
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField label="SMTP host" required value={form.host} onChange={set("host")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Port"
              type="number"
              required
              value={form.port}
              onChange={set("port")}
              slotProps={{ htmlInput: { min: 1, max: 65535 } }}
            />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.secure}
                  onChange={(e) => setForm((p) => ({ ...p, secure: e.target.checked }))}
                />
              }
              label={
                form.secure
                  ? "SSL/TLS from the start (usually port 465)"
                  : "STARTTLS upgrade (usually port 587)"
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Username (full email address)"
              type="email"
              required
              value={form.user}
              onChange={set("user")}
              autoComplete="off"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordField
              label="Password"
              value={form.pass}
              onChange={set("pass")}
              autoComplete="new-password"
              placeholder={passSet ? "Saved - leave blank to keep" : ""}
              helperText={passSet ? "A password is saved. Type to replace it." : "Required"}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Sender (From)"
              value={form.from}
              onChange={set("from")}
              placeholder="BuzingBee <hr@buzingbee.com>"
              helperText="Must be the same mailbox as the username, or an alias it may send as"
            />
          </Grid>
        </Grid>

        {connection && (
          <Alert
            severity={connection.connected ? "success" : "error"}
            sx={{ mt: 3 }}
          >
            {connection.connected ? (
              `Connected to the mail server${connection.latencyMs ? ` in ${(connection.latencyMs / 1000).toFixed(1)}s` : ""}.`
            ) : (
              <>
                <b>Could not sign in.</b> {connection.message || "Check the details below."}
                {connection.missing?.length > 0 && ` Missing: ${connection.missing.join(", ")}.`}
                {connection.hints?.length > 0 && (
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                    {connection.hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
            {saving ? "Saving & checking..." : "Save & check connection"}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h6">Send a test email</Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Send to"
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={sendTest}
            disabled={testing || !testTo}
            sx={{ flexShrink: 0, alignSelf: { sm: "flex-start" } }}
          >
            {testing ? "Sending..." : "Send test"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
