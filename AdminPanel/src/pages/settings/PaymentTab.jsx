import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Landmark, Save } from "lucide-react";
import { adminAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState } from "../../components/common";

const EMPTY = { bankAccountName: "", bankName: "", bankAccountNumber: "", bankIfsc: "", upiId: "" };

// The signed-in admin's own bank/UPI details, printed on their personal clients' invoices
export default function PaymentTab() {
  const { notify } = useFeedback();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminAPI
      .getProfile()
      .then((data) => setForm({ ...EMPTY, ...data.admin?.payment }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data = await adminAPI.updatePayment(form);
      setForm({ ...EMPTY, ...data.payment });
      notify("Payment details saved", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading payment details..." />;

  return (
    <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
        <Landmark size={22} />
        <Typography variant="h6">Payment details</Typography>
      </Stack>
      <Box sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Account holder name" value={form.bankAccountName} onChange={set("bankAccountName")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Bank name" value={form.bankName} onChange={set("bankName")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Account number" value={form.bankAccountNumber} onChange={set("bankAccountNumber")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="IFSC" value={form.bankIfsc} onChange={set("bankIfsc")} />
        </Grid>
        <Grid size={12}>
          <TextField label="UPI ID" value={form.upiId} onChange={set("upiId")} placeholder="name@okaxis" />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
          {saving ? "Saving..." : "Save payment details"}
        </Button>
      </Box>
    </Paper>
  );
}
