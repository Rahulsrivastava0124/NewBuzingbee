import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader, TableToolbar } from "../../components/common";
import DataTable from "../../components/DataTable";
import { Modal } from "./shared";
import { dateToApi, fmtDate, money, titleCase, toInputDate } from "./format";
import { BookOpen, Plus, Printer } from "lucide-react";

const SOURCES = [
  ["all", "All sources"],
  ["payment", "Invoice payments"],
  ["expense", "Expenses"],
  ["manual", "Manual"],
  ["loan", "Loans"],
  ["loan-repayment", "Loan repayments"],
  ["payout", "Expense wallet payouts"],
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
  const { notify } = useFeedback();
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

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (!data && !error) return <LoadingState text="Loading ledger..." />;
  if (!data) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <PageHeader
        title="Wallet & Ledger"
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
              onClick={() => {
                setFormError("");
                setEditing(blank());
              }}
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

      <DataTable
        columns={[
          {
            key: "date",
            label: "Date",
            value: (e) => new Date(e.date).getTime(),
            render: (e) => fmtDate(e.date),
          },
          { key: "description", label: "Description", mobile: "title", value: (e) => e.description },
          {
            key: "category",
            label: "Category",
            mobile: "subtitle",
            value: (e) => titleCase(e.category),
          },
          // Classic ledger: money out and money in each get their own column
          ...[
            ["debit", "Debit", "error.main"],
            ["credit", "Credit", "success.main"],
          ].map(([type, label, color]) => ({
            key: type,
            label,
            align: "right",
            value: (e) => (e.type === type ? e.amount : 0),
            render: (e) =>
              e.type === type ? (
                <Box component="span" sx={{ fontWeight: 600, color }}>
                  {money(e.amount)}
                </Box>
              ) : (
                <Box component="span" sx={{ color: "text.disabled" }}>
                  —
                </Box>
              ),
          })),
          {
            key: "balanceAfter",
            label: "Balance",
            align: "right",
            value: (e) => e.balanceAfter,
            render: (e) => money(e.balanceAfter),
          },
        ]}
        rows={data.entries}
        minWidth={820}
        pageSize={50}
        empty={{ icon: <BookOpen />, title: "No entries", text: "No ledger entries match these filters." }}
        toolbar={
          <TableToolbar>
            <ToggleButtonGroup exclusive size="small" value={type} onChange={(_, v) => v && setType(v)}>
              {["all", "credit", "debit"].map((t) => (
                <ToggleButton key={t} value={t}>
                  {titleCase(t)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                label="Source"
                value={refType}
                onChange={(e) => setRefType(e.target.value)}
                sx={{ minWidth: 190 }}
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
                sx={{ minWidth: 160 }}
              />
              <TextField
                type="date"
                label="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 160 }}
              />
            </Stack>
          </TableToolbar>
        }
      />

      {editing && (
        <Modal title="Manual ledger entry" busy={saving} onClose={() => setEditing(null)}>
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
              <Button color="inherit" disabled={saving} onClick={() => setEditing(null)}>
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
