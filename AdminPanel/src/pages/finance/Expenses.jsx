import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../../components/common";
import DataTable from "../../components/DataTable";
import { Modal, StatusBadge } from "./shared";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  dateToApi,
  fmtDate,
  money,
  titleCase,
  toInputDate,
} from "./format";
import { Check, Plus, Printer, Receipt, X } from "lucide-react";

const blank = () => ({
  title: "",
  category: "other",
  amount: "",
  vendor: "",
  method: "bank-transfer",
  spentAt: toInputDate(),
  note: "",
  paidFrom: "mine",
});

// Admin/team: their own expense wallet. Balance < 0 means the company owes them.
function WalletCards({ wallet }) {
  const cards = [
    ["Received", wallet.paid, "success.main"],
    ["Spent", wallet.spent, "error.main"],
    [wallet.balance < 0 ? "Owed to you" : "Balance in hand", Math.abs(wallet.balance), wallet.balance < 0 ? "warning.main" : "text.primary"],
  ];
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {cards.map(([label, value, color]) => (
        <Grid key={label} size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6" sx={{ color, fontVariantNumeric: "tabular-nums" }}>
              {money(value)}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default function Expenses() {
  const { confirm, notify } = useFeedback();
  const { admin } = useOutletContext() || {};
  const isSuper = admin?.role === "super";
  const [wallet, setWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [spentBy, setSpentBy] = useState("all");
  const [status, setStatus] = useState("all");
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
      const [data, walletData] = await Promise.all([
        financeAPI.expenses.getAll({
          search,
          category,
          spentBy: isSuper && spentBy !== "all" ? spentBy : undefined,
          status: status !== "all" ? status : undefined,
        }),
        isSuper ? financeAPI.expenseWallets.getAll() : financeAPI.expenseWallets.mine(),
      ]);
      if (isSuper) setWallets(walletData.wallets || []);
      else setWallet(walletData);
      setExpenses(data.expenses || []);
      setByCategory(data.byCategory || []);
      setTotalAmount(data.totalAmount || 0);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, spentBy, status, isSuper]);

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
      await financeAPI.expenses.create(body);
      setEditing(null);
      notify(isSuper ? "Expense saved" : "Expense sent to the super admin for approval", "success");
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const review = async (x, approve) => {
    try {
      await (approve ? financeAPI.expenses.approve(x._id) : financeAPI.expenses.reject(x._id));
      notify(approve ? `Approved "${x.title}"` : `Rejected "${x.title}"`, "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const cancel = async (x) => {
    const ok = await confirm({
      title: "Cancel expense",
      message: `Cancel "${x.title}"? It won't be sent for approval.`,
      confirmLabel: "Cancel expense",
    });
    if (!ok) return;
    try {
      await financeAPI.expenses.cancel(x._id);
      notify(`Cancelled "${x.title}"`, "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (loading) return <LoadingState text="Loading expenses..." />;

  const columns = [
    {
      key: "spentAt",
      label: "Date",
      value: (x) => new Date(x.spentAt).getTime(),
      render: (x) => fmtDate(x.spentAt),
    },
    {
      key: "title",
      label: "Title",
      mobile: "title",
      value: (x) => x.title,
      render: (x) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>{x.title}</Typography>
          {x.note && (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
              {x.note}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: "category",
      label: "Category",
      mobile: "subtitle",
      value: (x) => x.category,
      render: (x) => <Chip size="small" label={titleCase(x.category)} />,
    },
    { key: "createdBy", label: "Added by", value: (x) => x.createdBy?.username || "—" },
    {
      key: "status",
      label: "Status",
      value: (x) => x.status || "approved",
      render: (x) => <StatusBadge status={x.status || "approved"} />,
    },
    { key: "vendor", label: "Vendor", value: (x) => x.vendor || "" , render: (x) => x.vendor || "—" },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      value: (x) => x.amount,
      render: (x) => (
        <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>
          {money(x.amount)}
        </Box>
      ),
    },
  ];

  return (
    <Box>
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

      {!isSuper && wallet && <WalletCards wallet={wallet} />}

      {byCategory.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {byCategory.slice(0, 4).map((c) => (
            <Grid key={c.category} size={{ xs: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {titleCase(c.category)}
                </Typography>
                <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {money(c.amount)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <DataTable
        columns={columns}
        rows={expenses}
        minWidth={900}
        pageSize={50}
        empty={{ icon: <Receipt />, title: "No expenses", text: "No expenses match these filters." }}
        toolbar={
          <TableToolbar>
            <SearchField value={search} onChange={setSearch} placeholder="Search title or vendor..." />
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ minWidth: 200, width: { md: "auto" } }}
            >
              <MenuItem value="all">All categories</MenuItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {titleCase(c)}
                </MenuItem>
              ))}
            </TextField>
            {isSuper && (
              <TextField
                select
                label="Paid from"
                value={spentBy}
                onChange={(e) => setSpentBy(e.target.value)}
                sx={{ minWidth: 180, width: { md: "auto" } }}
              >
                <MenuItem value="all">Everyone</MenuItem>
                <MenuItem value="company">Company</MenuItem>
                {wallets.map((w) => (
                  <MenuItem key={w.adminId} value={w.adminId}>
                    {w.username}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 160, width: { md: "auto" } }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </TableToolbar>
        }
        // Pending expenses only: the super admin approves or rejects, the owner can cancel
        actions={(x) =>
          x.status === "pending" &&
          (isSuper ? (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" color="success" aria-label={`Approve ${x.title}`} onClick={() => review(x, true)}>
                  <Check />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" color="error" aria-label={`Reject ${x.title}`} onClick={() => review(x, false)}>
                  <X />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Cancel expense">
              <IconButton size="small" color="warning" aria-label={`Cancel ${x.title}`} onClick={() => cancel(x)}>
                <X />
              </IconButton>
            </Tooltip>
          ))
        }
      />

      {editing && (
        <Modal title="Add expense" onClose={() => setEditing(null)}>
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
              {!isSuper && (
                <Grid size={12}>
                  <TextField select label="Paid from" value={editing.paidFrom} onChange={set("paidFrom")}>
                    <MenuItem value="mine">My expense wallet</MenuItem>
                    <MenuItem value="company">Company wallet</MenuItem>
                  </TextField>
                </Grid>
              )}
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
