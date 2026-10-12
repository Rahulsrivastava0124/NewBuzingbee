import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { LoadingState, PageHeader } from "../../components/common";
import { dateToApi, money, toInputDate } from "./format";
import { Plus, Trash2 } from "lucide-react";

const blankItem = () => ({ description: "", quantity: 1, rate: 0 });

function TotalRow({ label, value, strong }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography sx={{ fontWeight: strong ? 700 : 400, fontSize: strong ? 17 : 14 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: strong ? 700 : 500, fontSize: strong ? 17 : 14 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function InvoiceForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 15);
    return {
      client: params.get("client") || "",
      issueDate: toInputDate(),
      dueDate: toInputDate(due),
      items: [blankItem()],
      taxRate: 18,
      discount: 0,
      notes: "",
      terms: "Payment due within 15 days of invoice date.",
    };
  });

  useEffect(() => {
    financeAPI.clients
      .getAll()
      .then((d) => setClients(d.clients || []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!id) return;
    financeAPI.invoices
      .getById(id)
      .then(({ invoice }) =>
        setForm({
          client: invoice.client?._id || "",
          issueDate: toInputDate(invoice.issueDate),
          dueDate: toInputDate(invoice.dueDate),
          items: invoice.items.map(({ description, quantity, rate }) => ({
            description,
            quantity,
            rate,
          })),
          taxRate: invoice.taxRate,
          discount: invoice.discount,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
      0,
    );
    const taxable = Math.max(subtotal - (Number(form.discount) || 0), 0);
    const tax = (taxable * (Number(form.taxRate) || 0)) / 100;
    return { subtotal, tax, total: taxable + tax };
  }, [form.items, form.discount, form.taxRate]);

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setItem = (idx, k, v) =>
    setForm({
      ...form,
      items: form.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)),
    });

  const submit = async (e, status) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        issueDate: dateToApi(form.issueDate),
        dueDate: dateToApi(form.dueDate),
      };
      if (!id) payload.status = status;
      const data = id
        ? await financeAPI.invoices.update(id, payload)
        : await financeAPI.invoices.create(payload);
      navigate(`/dashboard/finance/invoices/${data.invoice._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading invoice..." />;

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <PageHeader title={id ? "Edit Invoice" : "New Invoice"} />

      <Paper component="form" sx={{ p: { xs: 2, sm: 3 } }} onSubmit={(e) => submit(e, "sent")}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              required
              label="Client"
              value={form.client}
              onChange={setField("client")}
            >
              {clients.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              type="date"
              label="Issue date"
              value={form.issueDate}
              onChange={setField("issueDate")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              type="date"
              required
              label="Due date"
              value={form.dueDate}
              onChange={setField("dueDate")}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: form.issueDate },
              }}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Line items
        </Typography>
        <Stack spacing={1.5}>
          {form.items.map((it, idx) => (
            <Grid container spacing={1.5} key={idx} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  placeholder="Service / item"
                  value={it.description}
                  onChange={(e) => setItem(idx, "description", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4, sm: 2 }}>
                <TextField
                  type="number"
                  label="Qty"
                  value={it.quantity}
                  onChange={(e) => setItem(idx, "quantity", e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                />
              </Grid>
              <Grid size={{ xs: 5, sm: 2 }}>
                <TextField
                  type="number"
                  label="Rate (₹)"
                  value={it.rate}
                  onChange={(e) => setItem(idx, "rate", e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                />
              </Grid>
              <Grid size={{ xs: 3, sm: 2 }}>
                <Typography sx={{ fontWeight: 600, textAlign: "right" }}>
                  {money((Number(it.quantity) || 0) * (Number(it.rate) || 0))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }} sx={{ textAlign: "right" }}>
                <IconButton
                  color="error"
                  aria-label="Remove item"
                  disabled={form.items.length === 1}
                  onClick={() =>
                    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                  }
                >
                  <Trash2 />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box>
            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={() => setForm({ ...form, items: [...form.items, blankItem()] })}
            >
              Add item
            </Button>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  type="number"
                  label="Tax / GST (%)"
                  value={form.taxRate}
                  onChange={setField("taxRate")}
                  slotProps={{ htmlInput: { min: 0, max: 100, step: "any" } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  type="number"
                  label="Discount (₹)"
                  value={form.discount}
                  onChange={setField("discount")}
                  slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  error={Number(form.discount) > totals.subtotal}
                  helperText={
                    Number(form.discount) > totals.subtotal
                      ? "Discount exceeds the subtotal"
                      : undefined
                  }
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Notes"
                  multiline
                  minRows={2}
                  value={form.notes}
                  onChange={setField("notes")}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Terms"
                  multiline
                  minRows={2}
                  value={form.terms}
                  onChange={setField("terms")}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 2, bgcolor: "action.hover" }}>
              <Stack spacing={1}>
                <TotalRow label="Subtotal" value={money(totals.subtotal)} />
                <TotalRow label="Discount" value={`− ${money(form.discount)}`} />
                <TotalRow label={`Tax (${Number(form.taxRate) || 0}%)`} value={money(totals.tax)} />
                <Divider />
                <TotalRow strong label="Total" value={money(totals.total)} />
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 3, justifyContent: "flex-end", flexWrap: "wrap", rowGap: 1 }}
        >
          <Button color="inherit" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          {!id && (
            <Button
              variant="outlined"
              disabled={saving}
              onClick={(e) => submit(e, "draft")}
            >
              Save as draft
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : id ? "Save changes" : "Create & mark sent"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
