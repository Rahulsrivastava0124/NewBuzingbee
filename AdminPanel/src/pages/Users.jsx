import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import { SERVICE_LABELS, adminAPI, financeAPI, portalHost } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { LoadingState, PageHeader } from "../components/common";
import DataTable from "../components/DataTable";
import { Modal } from "./finance/shared";
import { PAYMENT_METHODS, dateToApi, money, toInputDate } from "./finance/format";

const ROLE_COLORS = { super: "warning", admin: "primary", team: "default" };
const ROLE_LABELS = { super: "Super admin", admin: "Admin", team: "Team" };
// "other" is for enquiries only, not something a person handles
const SERVICE_KEYS = Object.keys(SERVICE_LABELS).filter((k) => k !== "other");
const EMPTY_USER = { username: "", email: "", phone: "", services: [], role: "team", showBills: false };

// Two-column form grid (one column on phones); FULL spans both columns
const FORM_GRID = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  minWidth: { sm: 560 }, // the shared Modal sizes to its content
  columnGap: 2,
  rowGap: 2.5,
  pt: 1,
};
const FULL = { gridColumn: "1 / -1" };

// Shared by the Add and Edit dialogs
function PhoneField({ value, onChange }) {
  return (
    <TextField
      label="Phone number"
      type="tel"
      autoComplete="tel"
      value={value.phone}
      onChange={(e) => onChange({ ...value, phone: e.target.value })}
      placeholder="+91 98765 43210"
    />
  );
}

function ServicesField({ value, onChange }) {
  return (
    <TextField
      select
      label="Services they handle"
      value={value.services}
      onChange={(e) => onChange({ ...value, services: e.target.value })}
      sx={FULL}
      slotProps={{
        select: {
          multiple: true,
          renderValue: (selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((k) => (
                <Chip key={k} size="small" label={SERVICE_LABELS[k] || k} />
              ))}
            </Box>
          ),
        },
      }}
    >
      {SERVICE_KEYS.map((k) => (
        <MenuItem key={k} value={k}>
          <Checkbox size="small" checked={value.services.includes(k)} sx={{ py: 0 }} />
          <ListItemText primary={SERVICE_LABELS[k]} />
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function Users() {
  const { notify, confirm } = useFeedback();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Expense wallet per user (adminId -> { spent, paid, balance })
  const [wallets, setWallets] = useState({});
  const [paying, setPaying] = useState(null);
  const [payError, setPayError] = useState("");
  // user being edited: { user, username, email, phone, services }
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState("");

  const isSuper = me?.role === "super";
  const isAdmin = me?.role === "admin";
  // admins manage their team: team members only, edit only (no roles, bills, pay or delete)
  const rows = isSuper ? users : users.filter((u) => u.role === "team");

  useEffect(() => {
    adminAPI
      .getProfile()
      .then((res) =>
        setMe(
          res?.admin
            ? { id: String(res.admin._id || res.admin.id), role: res.admin.role }
            : null,
        ),
      )
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, walletData] = await Promise.all([
        adminAPI.listUsers(),
        financeAPI.expenseWallets.getAll().catch(() => ({ wallets: [] })),
      ]);
      setUsers(list);
      setWallets(Object.fromEntries((walletData.wallets || []).map((w) => [String(w.adminId), w])));
    } catch (err) {
      notify(err.message || "Could not load users", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setError("");
    if (!form.username || !form.email) {
      setError("Username and email are required");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createUser(form);
      notify("User created", "success");
      setOpen(false);
      setForm(EMPTY_USER);
      await load();
    } catch (err) {
      setError(err.message || "Could not create user");
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user, changes, doneMessage) => {
    try {
      await adminAPI.updateUser(user._id, changes);
      notify(doneMessage, "success");
      await load();
    } catch (err) {
      notify(err.message || "Could not update user", "error");
    }
  };

  const handleRoleChange = (user, nextRole) => {
    if (nextRole !== user.role) updateUser(user, { role: nextRole }, "Role updated");
  };

  const handleBillsChange = (user, showBills) =>
    updateUser(
      user,
      { showBills },
      showBills ? `${user.username} can now see bills` : `Bills hidden from ${user.username}`,
    );

  const handleDelete = async (user) => {
    const ok = await confirm({
      title: "Remove user",
      message: `Delete ${user.username} (${user.email})? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await adminAPI.deleteUser(user._id);
      notify("User removed", "success");
      await load();
    } catch (err) {
      notify(err.message || "Could not delete user", "error");
    }
  };

  const openEdit = (user) => {
    setEditError("");
    setEditing({
      user,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      services: user.services || [],
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const { user, username, email, phone, services } = editing;
    setSaving(true);
    setEditError("");
    try {
      await adminAPI.editUser(user._id, {
        username,
        email,
        phone,
        services,
      });
      notify(`${username} updated`, "success");
      setEditing(null);
      await load();
    } catch (err) {
      setEditError(err.message || "Could not update user");
    } finally {
      setSaving(false);
    }
  };

  // Pay defaults to what the company owes them, if anything
  const openPay = (user) => {
    const owed = -(wallets[user._id]?.balance || 0);
    setPayError("");
    setPaying({ user, amount: owed > 0 ? owed : "", method: "upi", paidAt: toInputDate(), note: "" });
  };

  const submitPay = async (e) => {
    e.preventDefault();
    setSaving(true);
    setPayError("");
    try {
      const { user, ...body } = paying;
      await financeAPI.expenseWallets.pay(user._id, { ...body, paidAt: dateToApi(body.paidAt) });
      notify(`Paid ${money(body.amount)} to ${user.username}`, "success");
      setPaying(null);
      await load();
    } catch (err) {
      setPayError(err.message || "Could not record payment");
    } finally {
      setSaving(false);
    }
  };

  const setPay = (k) => (e) => setPaying({ ...paying, [k]: e.target.value });

  // Spent / received / balance columns for each user's expense wallet
  const walletCol = (key, label, render) => ({
    key,
    label,
    align: "right",
    value: (u) => wallets[u._id]?.[key] ?? -Infinity,
    render: (u) => (wallets[u._id] ? render(wallets[u._id]) : "—"),
  });

  if (!isSuper && !isAdmin) {
    return (
      <Box>
        <PageHeader title="User management" />
        <Alert severity="info">
          Only the super admin and admins can manage users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isSuper ? "User management" : "My team"}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={load}
              disabled={loading}
            >
              Refresh
            </Button>
            {isSuper && (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => setOpen(true)}
              >
                Add user
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <LoadingState text="Loading users..." />
      ) : (
        <DataTable
          rows={rows}
          minWidth={1000}
          initialSort={{ key: "role", dir: "asc" }}
          empty={
            isSuper
              ? { icon: <ShieldCheck />, title: "No users", text: "Add someone with the button above." }
              : { icon: <ShieldCheck />, title: "No team members", text: "Ask the super admin to add team members." }
          }
          columns={[
            {
              key: "username",
              label: "User",
              mobile: "title",
              value: (u) => u.username,
              render: (u) => (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.main", color: "primary.contrastText" }}>
                    {u.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {u.username}
                      {me?.id === u._id && <Chip size="small" label="you" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </Typography>
                  </Box>
                </Stack>
              ),
            },
            {
              key: "role",
              label: "Role",
              mobile: "subtitle",
              value: (u) => ({ super: 0, admin: 1, team: 2 })[u.role || "admin"],
              render: (u) =>
                u.role === "super" || !isSuper ? (
                  !isSuper ? (
                    <Chip size="small" label={ROLE_LABELS[u.role] || u.role} color={ROLE_COLORS[u.role]} />
                  ) : (
                  <Chip size="small" label={ROLE_LABELS.super} color={ROLE_COLORS.super} />
                  )
                ) : (
                  <Select
                    size="small"
                    value={u.role || "admin"}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    disabled={me?.id === u._id}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="admin">{ROLE_LABELS.admin}</MenuItem>
                    <MenuItem value="team">{ROLE_LABELS.team}</MenuItem>
                  </Select>
                ),
            },
            {
              key: "showBills",
              label: "Show bills",
              sortable: false,
              render: (u) => {
                const pinned = u.role === "super";
                if (!isSuper) return u.showBills !== false ? "Yes" : "No";
                return (
                  <Tooltip
                    title={
                      pinned
                        ? "Super admin always sees bills"
                        : u.showBills !== false
                          ? "Can see invoices, payments and other finance pages"
                          : "Finance pages are hidden"
                    }
                  >
                    <span>
                      <Switch
                        checked={pinned || u.showBills !== false}
                        disabled={pinned}
                        onChange={(e) => handleBillsChange(u, e.target.checked)}
                        slotProps={{ input: { "aria-label": `Show bills to ${u.username}` } }}
                      />
                    </span>
                  </Tooltip>
                );
              },
            },
            walletCol("spent", "Spent", (w) => money(w.spent)),
            walletCol("paid", "Received", (w) => money(w.paid)),
            walletCol("balance", "Balance", (w) => (
              <Box
                component="span"
                sx={{ fontWeight: 600, color: w.balance < 0 ? "error.main" : w.balance > 0 ? "success.main" : "text.primary" }}
              >
                {w.balance < 0 ? `Owed ${money(-w.balance)}` : money(w.balance)}
              </Box>
            )),
          ]}
          actions={(u) => {
            const pinned = u.role === "super";
            const isSelf = me?.id === u._id;
            const editBtn = (
              <Tooltip title="Edit user">
                <IconButton size="small" aria-label={`Edit ${u.username}`} onClick={() => openEdit(u)}>
                  <Pencil size={18} />
                </IconButton>
              </Tooltip>
            );
            if (!isSuper) return editBtn;
            return (
              <>
                {editBtn}
                {!pinned && (
                  <Button size="small" variant="contained" onClick={() => openPay(u)}>
                    Pay
                  </Button>
                )}
                <Tooltip
                  title={pinned ? "Super admin cannot be deleted" : isSelf ? "You cannot delete yourself" : "Delete user"}
                >
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={`Delete ${u.username}`}
                      onClick={() => handleDelete(u)}
                      disabled={pinned || isSelf}
                    >
                      <Trash2 />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            );
          }}
        />
      )}

      {editing && (
        <Modal wide title={`Edit ${editing.user.username}`} onClose={() => setEditing(null)}>
          <Box component="form" onSubmit={submitEdit}>
            <Box sx={FORM_GRID}>
              <TextField
                label="Username"
                required
                value={editing.username}
                onChange={(e) => setEditing({ ...editing, username: e.target.value })}
                helperText="Letters, numbers and underscore"
                autoFocus
              />
              <TextField
                label="Email"
                type="email"
                required
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                disabled={editing.user.role === "super"}
                helperText={editing.user.role === "super" ? "The super admin's email is pinned" : " "}
              />
              <PhoneField value={editing} onChange={setEditing} />
              <ServicesField value={editing} onChange={setEditing} />
              {editError && (
                <Alert severity="error" sx={FULL}>
                  {editError}
                </Alert>
              )}
            </Box>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}

      {paying && (
        <Modal title={`Pay ${paying.user.username}`} onClose={() => setPaying(null)}>
          <Box component="form" onSubmit={submitPay}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {wallets[paying.user._id] && (
                <Typography variant="body2" color="text.secondary">
                  Spent {money(wallets[paying.user._id].spent)} · Received {money(wallets[paying.user._id].paid)}
                </Typography>
              )}
              <TextField
                type="number"
                label="Amount (₹)"
                required
                value={paying.amount}
                onChange={setPay("amount")}
                slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField select label="Paid via" value={paying.method} onChange={setPay("method")}>
                  {PAYMENT_METHODS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="date"
                  label="Date"
                  value={paying.paidAt}
                  onChange={setPay("paidAt")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField label="Note" value={paying.note} onChange={setPay("note")} />
              {payError && <Alert severity="error">{payError}</Alert>}
            </Stack>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" onClick={() => setPaying(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Record payment"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent dividers>
          <Box sx={FORM_GRID}>
            {error && (
              <Alert severity="error" sx={FULL}>
                {error}
              </Alert>
            )}
            <TextField
              label="Username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              helperText="Letters, numbers and underscore"
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              helperText="They sign in with a code sent here or to their WhatsApp"
            />
            <PhoneField value={form} onChange={setForm} />
            <ServicesField value={form} onChange={setForm} />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              helperText={
                <>
                  Signs in at <b>{portalHost(form.role)}</b>
                </>
              }
            >
              <MenuItem value="admin">{ROLE_LABELS.admin}</MenuItem>
              <MenuItem value="team">{ROLE_LABELS.team}</MenuItem>
            </TextField>
            <FormControlLabel
              sx={{ alignSelf: "start", mt: 1 }}
              control={
                <Switch
                  checked={form.showBills}
                  onChange={(e) => setForm({ ...form, showBills: e.target.checked })}
                />
              }
              label="Show bills (Finance section)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
