import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Building2, ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { settingsAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState } from "../../components/common";

const EMPTY = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  gstin: "",
  pan: "",
  logoUrl: "",
  invoiceFooter: "",
};

export default function CompanyTab() {
  const { notify } = useFeedback();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    settingsAPI
      .get()
      .then((data) => setForm({ ...EMPTY, ...data.company }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Logo changes are saved immediately; the rest of the form saves with the button
  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Logo must be a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be 2 MB or smaller.");
      return;
    }

    setError("");
    setLogoBusy(true);
    try {
      const data = await settingsAPI.uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      notify("Logo updated", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const handleLogoRemove = async () => {
    setLogoBusy(true);
    try {
      await settingsAPI.removeLogo();
      setForm((prev) => ({ ...prev, logoUrl: "" }));
      notify("Logo removed", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    try {
      const data = await settingsAPI.saveCompany(form);
      setForm({ ...EMPTY, ...data.company });
      notify("Company details saved", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading company details..." />;

  return (
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
        <Building2 size={22} />
        <Typography variant="h6">Company details</Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Shown on invoices and used as the sender identity in emails.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Company name" required value={form.name} onChange={set("name")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Legal name"
            value={form.legalName}
            onChange={set("legalName")}
            helperText="Registered entity name, if different"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Phone" value={form.phone} onChange={set("phone")} />
        </Grid>
        <Grid size={12}>
          <TextField label="Website" value={form.website} onChange={set("website")} placeholder="https://buzingbee.com" />
        </Grid>
        <Grid size={12}>
          <TextField label="Address" value={form.address} onChange={set("address")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="City" value={form.city} onChange={set("city")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="State" value={form.state} onChange={set("state")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Postal code" value={form.postalCode} onChange={set("postalCode")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Country" value={form.country} onChange={set("country")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="GSTIN" value={form.gstin} onChange={set("gstin")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="PAN" value={form.pan} onChange={set("pan")} />
        </Grid>
        <Grid size={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Logo
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" } }}
          >
            <Box
              sx={{
                width: 160,
                height: 80,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              {form.logoUrl ? (
                <Box
                  component="img"
                  src={form.logoUrl}
                  alt="Company logo"
                  sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              ) : (
                <ImagePlus size={28} color="var(--mui-palette-text-disabled)" />
              )}
            </Box>
            <Stack spacing={1}>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleLogoFile}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  disabled={logoBusy}
                  onClick={() => fileRef.current?.click()}
                >
                  {logoBusy ? "Uploading..." : form.logoUrl ? "Replace logo" : "Upload logo"}
                </Button>
                {form.logoUrl && (
                  <Button
                    color="error"
                    startIcon={<Trash2 />}
                    disabled={logoBusy}
                    onClick={handleLogoRemove}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG or WebP, up to 2 MB. A wide logo on a transparent
                background looks best on invoices.
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid size={12}>
          <TextField
            label="Invoice footer"
            multiline
            minRows={2}
            value={form.invoiceFooter}
            onChange={set("invoiceFooter")}
            placeholder="Bank details, payment instructions, thank-you note…"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
          {saving ? "Saving..." : "Save company details"}
        </Button>
      </Box>
    </Paper>
  );
}
