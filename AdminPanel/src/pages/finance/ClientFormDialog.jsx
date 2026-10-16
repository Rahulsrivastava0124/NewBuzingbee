import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { Modal } from "./shared";

const EMPTY = {
  managedBy: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  gstin: "",
  notes: "",
  personal: false,
};

// Add (client = null) or edit a client
export default function ClientFormDialog({ client, defaultManager = "", team, onClose, onSaved }) {
  const { notify } = useFeedback();
  // Personal clients are for admin/team members; the super admin doesn't get the option
  const { admin } = useOutletContext() || {};
  const canMarkPersonal = admin?.role !== "super";
  const [form, setForm] = useState(() =>
    client
      ? { ...EMPTY, ...client, managedBy: client.managedBy?._id || client.managedBy || "", personal: Boolean(client.personal) }
      : { ...EMPTY, managedBy: defaultManager },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (client?._id) await financeAPI.clients.update(client._id, form);
      else await financeAPI.clients.create(form);
      notify("Client saved", "success");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={client?._id ? "Edit client" : "Add client"} onClose={onClose}>
      <Box component="form" onSubmit={save}>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Name" required value={form.name} onChange={set("name")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Company" value={form.company} onChange={set("company")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Phone" value={form.phone} onChange={set("phone")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="GSTIN" value={form.gstin} onChange={set("gstin")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Address" value={form.address} onChange={set("address")} />
          </Grid>
          <Grid size={12}>
            <TextField
              select
              label="Managed by"
              value={form.managedBy || ""}
              onChange={set("managedBy")}
              helperText="The team member responsible for this client"
            >
              <MenuItem value="">Unassigned</MenuItem>
              {team.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.username}
                  {t.email ? ` (${t.email})` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {canMarkPersonal && (
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.personal}
                    onChange={(e) => setForm({ ...form, personal: e.target.checked })}
                  />
                }
                label="Personal client"
              />
              <FormHelperText sx={{ mt: -0.5 }}>
                Only the person managing this client can see it and its invoices, not even the
                super admin. Leave unticked to share it with the team.
              </FormHelperText>
            </Grid>
          )}
          <Grid size={12}>
            <TextField label="Notes" multiline minRows={2} value={form.notes} onChange={set("notes")} />
          </Grid>
          {error && (
            <Grid size={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
        <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : "Save client"}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
}
