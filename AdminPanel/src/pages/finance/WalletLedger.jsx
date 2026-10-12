import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { Modal, StatusBadge } from "./shared";
import { dateToApi, fmtDate, money, titleCase, toInputDate } from "./format";
import { BookOpen, Plus, Printer, Trash2 } from "lucide-react";

const SOURCES = [
  ["all", "All sources"],
  ["payment", "Invoice payments"],
  ["expense", "Expenses"],
  ["manual", "Manual"],
];

const blank = () => ({
  type: "credit",
  amount: "",
  description: "",
  category: "manual",
  date: toInputDate(),
});

function Stat({ label, value, color }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function WalletLedger() {
  const { confirm, notify } = useFeedback();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [type, setType] = useState("all");
  const [refType, setRefType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(
        await financeAPI.wallet.getLedger({
          type: type === "all" ? "" : type,
          refType,
          from,
          to,
        }),
      );
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [type, refType, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await financeAPI.wallet.addEntry({ ...editing, date: dateToApi(editing.date) });
      setEditing(null);
      notify("Ledger entry added", "success");
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    const ok = await confirm({
      title: "Delete entry",
      message: "Delete this manual entry?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.wallet.deleteEntry(entry._id);
      notify("Entry deleted", "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (!data && !error) return <LoadingState text="Loading ledger..." />;
  if (!data) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <PageHeader
        title="Wallet & Ledger"
        subtitle="Every payment received and expense paid, with running balance"
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
              Manual Entry
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stat
            label="Balance"
            value={money(data.balance)}
            color={data.balance < 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Stat label="Total credit" value={money(data.totalCredit)} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Stat label="Total debit" value={money(data.totalDebit)} color="error.main" />
        </Grid>
      </Grid>

      <Stack
        className="no-print"
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={type}
          onChange={(_, v) => v && setType(v)}
        >
          {["all", "credit", "debit"].map((t) => (
            <ToggleButton key={t} value={t} sx={{ px: 2 }}>
              {titleCase(t)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          select
          value={refType}
          onChange={(e) => setRefType(e.target.value)}
          sx={{ maxWidth: { lg: 220 } }}
        >
          {SOURCES.map(([v, l]) => (
            <MenuItem key={v} value={v}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ maxWidth: { lg: 180 } }}
        />
        <TextField
          type="date"
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ maxWidth: { lg: 180 } }}
        />
      </Stack>

      {data.entries.length === 0 ? (
        <EmptyState icon={<BookOpen size={48} />}>
          No ledger entries.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell className="no-print" />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.entries.map((e) => (
                <TableRow key={e._id} hover>
                  <TableCell>{fmtDate(e.date)}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell>{titleCase(e.category)}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.type} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: e.type === "credit" ? "success.main" : "error.main",
                    }}
                  >
                    {e.type === "credit" ? "+" : "−"} {money(e.amount)}
                  </TableCell>
                  <TableCell align="right">{money(e.balanceAfter)}</TableCell>
                  <TableCell align="right" className="no-print">
                    {e.refType === "manual" && (
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete entry"
                        onClick={() => remove(e)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && (
        <Modal title="Manual ledger entry" onClose={() => setEditing(null)}>
          <Box component="form" onSubmit={save}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Type" value={editing.type} onChange={set("type")}>
                  <MenuItem value="credit">Credit (money in)</MenuItem>
                  <MenuItem value="debit">Debit (money out)</MenuItem>
                </TextField>
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
              <Grid size={12}>
                <TextField
                  label="Description"
                  required
                  placeholder="Opening balance, owner draw, adjustment…"
                  value={editing.description}
                  onChange={set("description")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Category" value={editing.category} onChange={set("category")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="date"
                  label="Date"
                  value={editing.date}
                  onChange={set("date")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
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
                {saving ? "Saving..." : "Add entry"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
