import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { adminAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { LoadingState, PageHeader } from "../components/common";

const ROLE_COLORS = { super: "warning", admin: "primary", team: "default" };
const ROLE_LABELS = { super: "Super admin", admin: "Admin", team: "Team" };

export default function Users() {
  const { notify, confirm } = useFeedback();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "team", showBills: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSuper = me?.role === "super";

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
      const list = await adminAPI.listUsers();
      setUsers(list);
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
    if (!form.username || !form.email || !form.password) {
      setError("Username, email and password are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createUser(form);
      notify("User created", "success");
      setOpen(false);
      setForm({ username: "", email: "", password: "", role: "team", showBills: true });
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

  if (!isSuper) {
    return (
      <Box>
        <PageHeader title="User management" />
        <Alert severity="info">
          Only the super admin (team@buzingbee.com) can manage users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="User management"
        subtitle="Super admin manages who can sign in and what role they hold."
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
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setOpen(true)}
            >
              Add user
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingState text="Loading users..." />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Show bills</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isSelf = me?.id === u._id;
                const pinned = u.role === "super";
                return (
                  <TableRow key={u._id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {u.username}
                        {isSelf && (
                          <Chip size="small" label="you" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {pinned ? (
                        <Chip
                          size="small"
                          label={ROLE_LABELS.super}
                          color={ROLE_COLORS.super}
                        />
                      ) : (
                        <Select
                          size="small"
                          value={u.role || "admin"}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={isSelf}
                        >
                          <MenuItem value="admin">{ROLE_LABELS.admin}</MenuItem>
                          <MenuItem value="team">{ROLE_LABELS.team}</MenuItem>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          pinned
                            ? "Super admin cannot be deleted"
                            : isSelf
                              ? "You cannot delete yourself"
                              : "Delete user"
                        }
                      >
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(u)}
                            disabled={pinned || isSelf}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              helperText="At least 8 characters"
            />
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <MenuItem value="admin">{ROLE_LABELS.admin}</MenuItem>
              <MenuItem value="team">{ROLE_LABELS.team}</MenuItem>
            </Select>
            <FormControlLabel
              control={
                <Switch
                  checked={form.showBills}
                  onChange={(e) => setForm({ ...form, showBills: e.target.checked })}
                />
              }
              label="Show bills (Finance section)"
            />
          </Stack>
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
