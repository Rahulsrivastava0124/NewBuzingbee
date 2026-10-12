import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { Modal } from "./shared";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  dateToApi,
  fmtDate,
  methodLabel,
  money,
  titleCase,
  toInputDate,
} from "./format";
import { Pencil, Plus, Printer, Receipt, Search, Trash2 } from "lucide-react";

const blank = () => ({
  title: "",
  category: "other",
  amount: "",
  vendor: "",
  method: "bank-transfer",
  spentAt: toInputDate(),
  note: "",
});

export default function Expenses() {
  const { confirm, notify } = useFeedback();
  const [expenses, setExpenses] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.expenses.getAll({ search, category });
      setExpenses(data.expenses || []);
      setByCategory(data.byCategory || []);
      setTotalAmount(data.totalAmount || 0);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = { ...editing, spentAt: dateToApi(editing.spentAt) };
      if (editing._id) await financeAPI.expenses.update(editing._id, body);
      else await financeAPI.expenses.create(body);
      setEditing(null);
      notify("Expense saved", "success");
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (x) => {
    const ok = await confirm({
      title: "Delete expense",
      message: `Delete expense "${x.title}"?`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.expenses.delete(x._id);
      notify("Expense deleted", "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (loading) return <LoadingState text="Loading expenses..." />;

  return (
    <Box sx={{ maxWidth: 1400 }}>
      <PageHeader
        title="Expenses"
        subtitle={`${expenses.length} entries · ${money(totalAmount)}`}
        actions={
          <>
            <Button
              className="no-print"
              variant="outlined"
              startIcon={<Printer />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              className="no-print"
              variant="contained"
              startIcon={<Plus />}
              onClick={() => setEditing(blank())}
            >
              Add Expense
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {byCategory.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {byCategory.slice(0, 4).map((c) => (
            <Grid key={c.category} size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: "uppercase" }}
                >
                  {titleCase(c.category)}
                </Typography>
                <Typography variant="h6">{money(c.amount)}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Stack className="no-print" direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by title or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { md: 380 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ maxWidth: { md: 220 } }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {EXPENSE_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {titleCase(c)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {expenses.length === 0 ? (
        <EmptyState icon={<Receipt size={48} />}>
          No expenses recorded.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right" className="no-print">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((x) => (
                <TableRow key={x._id} hover>
                  <TableCell>{fmtDate(x.spentAt)}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{x.title}</Typography>
                    {x.note && (
                      <Typography variant="caption" color="text.secondary">
                        {x.note}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{titleCase(x.category)}</TableCell>
                  <TableCell>{x.vendor || "—"}</TableCell>
                  <TableCell>{methodLabel(x.method)}</TableCell>
                  <TableCell align="right" sx={{ color: "error.main", fontWeight: 700 }}>
                    {money(x.amount)}
                  </TableCell>
                  <TableCell align="right" className="no-print" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label="Edit"
                        onClick={() => setEditing({ ...x, spentAt: toInputDate(x.spentAt) })}
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete"
                        onClick={() => remove(x)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && (
        <Modal title={editing._id ? "Edit expense" : "Add expense"} onClose={() => setEditing(null)}>
          <Box component="form" onSubmit={save}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={12}>
                <TextField label="Title" required value={editing.title} onChange={set("title")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label="Amount (₹)"
                  required
                  value={editing.amount}
                  onChange={set("amount")}
                  slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="date"
                  label="Date"
                  value={editing.spentAt}
                  onChange={set("spentAt")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Category" value={editing.category} onChange={set("category")}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {titleCase(c)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Paid via" value={editing.method} onChange={set("method")}>
                  {PAYMENT_METHODS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField label="Vendor" value={editing.vendor} onChange={set("vendor")} />
              </Grid>
              <Grid size={12}>
                <TextField label="Note" value={editing.note} onChange={set("note")} />
              </Grid>
              {formError && (
                <Grid size={12}>
                  <Alert severity="error">{formError}</Alert>
                </Grid>
              )}
            </Grid>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save expense"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
