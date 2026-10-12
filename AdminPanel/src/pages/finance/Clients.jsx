import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
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
import { adminAPI, financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { Modal } from "./shared";
import { dueLabel, fmtDate, money } from "./format";
import { BookOpen, Contact, FilePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";

const EMPTY = {
  managedBy: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  gstin: "",
  notes: "",
};

export default function Clients() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [team, setTeam] = useState([]);
  const [me, setMe] = useState(null);
  const [managerFilter, setManagerFilter] = useState("all");

  useEffect(() => {
    adminAPI
      .listUsers()
      .then(setTeam)
      .catch(() => {});
    adminAPI
      .getProfile()
      .then((res) => setMe(res?.admin || null))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.clients.getAll({
        search,
        managedBy: managerFilter === "all" ? "" : managerFilter,
      });
      setClients(data.clients || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, managerFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce typing
    return () => clearTimeout(t);
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing._id) await financeAPI.clients.update(editing._id, editing);
      else await financeAPI.clients.create(editing);
      setEditing(null);
      notify("Client saved", "success");
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    const ok = await confirm({
      title: "Delete client",
      message: `Delete client "${c.name}"?`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.clients.delete(c._id);
      notify("Client deleted", "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  if (loading) return <LoadingState text="Loading clients..." />;

  return (
    <Box sx={{ maxWidth: 1400 }}>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients`}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setEditing({ ...EMPTY, managedBy: me?._id || "" })}
          >
            Add Client
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by name, company or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { sm: 420 } }}
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
          label="Managed by"
          value={managerFilter}
          onChange={(e) => setManagerFilter(e.target.value)}
          sx={{ maxWidth: { sm: 240 } }}
        >
          <MenuItem value="all">Everyone</MenuItem>
          {me && <MenuItem value="me">Me</MenuItem>}
          <MenuItem value="none">Unassigned</MenuItem>
          {team.map((t) => (
            <MenuItem key={t._id} value={t._id}>
              {t.username}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {clients.length === 0 ? (
        <EmptyState icon={<Contact size={48} />}>
          No clients yet. Add your first client to start invoicing.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Managed by</TableCell>
                <TableCell align="right">Invoices</TableCell>
                <TableCell align="right">Invoiced</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell>Next due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      sx={{ fontWeight: 700, textAlign: "left" }}
                      onClick={() => navigate(`/dashboard/finance/clients/${c._id}`)}
                    >
                      {c.name}
                    </Link>
                    {c.company && (
                      <Typography variant="caption" color="text.secondary">
                        {c.company}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.email || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {c.managedBy ? (
                      <Chip size="small" variant="outlined" label={c.managedBy.username} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{c.invoiceCount}</TableCell>
                  <TableCell align="right">{money(c.invoiced)}</TableCell>
                  <TableCell
                    align="right"
                    sx={c.outstanding > 0 ? { color: "error.main", fontWeight: 700 } : undefined}
                  >
                    {money(c.outstanding)}
                  </TableCell>
                  <TableCell>
                    {c.nextDue ? (
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              new Date(c.nextDue.dueDate) < new Date()
                                ? "error.main"
                                : "text.primary",
                          }}
                        >
                          {fmtDate(c.nextDue.dueDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dueLabel(c.nextDue.dueDate)} · {money(c.nextDue.amount)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nothing due
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Ledger">
                      <IconButton
                        size="small"
                        aria-label="Ledger"
                        onClick={() => navigate(`/dashboard/finance/clients/${c._id}`)}
                      >
                        <BookOpen size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="New invoice">
                      <IconButton
                        size="small"
                        aria-label="New invoice"
                        onClick={() => navigate(`/dashboard/finance/invoices/new?client=${c._id}`)}
                      >
                        <FilePlus size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label="Edit"
                        onClick={() => setEditing({ ...EMPTY, ...c, managedBy: c.managedBy?._id || "" })}
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete"
                        onClick={() => remove(c)}
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
        <Modal title={editing._id ? "Edit client" : "Add client"} onClose={() => setEditing(null)}>
          <Box component="form" onSubmit={save}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Name" required value={editing.name} onChange={set("name")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Company" value={editing.company} onChange={set("company")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Email" type="email" value={editing.email} onChange={set("email")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone" value={editing.phone} onChange={set("phone")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="GSTIN" value={editing.gstin} onChange={set("gstin")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Address" value={editing.address} onChange={set("address")} />
              </Grid>
              <Grid size={12}>
                <TextField
                  select
                  label="Managed by"
                  value={editing.managedBy || ""}
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
              <Grid size={12}>
                <TextField
                  label="Notes"
                  multiline
                  minRows={2}
                  value={editing.notes}
                  onChange={set("notes")}
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
                {saving ? "Saving..." : "Save client"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
