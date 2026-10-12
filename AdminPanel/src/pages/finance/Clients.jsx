import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
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
import ClientFormDialog from "./ClientFormDialog";
import { money } from "./format";

const NUM = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
import { Contact, Plus, Search, Trash2 } from "lucide-react";

export default function Clients() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [team, setTeam] = useState([]);
  const [me, setMe] = useState(null);
  const [managerFilter, setManagerFilter] = useState("all");

  useEffect(() => {
    adminAPI.listUsers().then(setTeam).catch(() => {});
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

  if (loading) return <LoadingState text="Loading clients..." />;

  const view = (c) => navigate(`/dashboard/finance/clients/${c._id}`);
  // Mirrors the server: super admin edits any client, others only their own or unassigned ones
  const canEdit = (c) =>
    me?.role === "super" || !c.managedBy || String(c.managedBy._id || c.managedBy) === String(me?._id);

  return (
    <Box>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients`}
        actions={
          <Button variant="contained" startIcon={<Plus />} onClick={() => setAdding(true)}>
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
          <Table sx={{ minWidth: 1060 }}>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell align="right">Due</TableCell>
                <TableCell align="right">Invoices</TableCell>
                <TableCell>Managed by</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Link
                        component="button"
                        underline="hover"
                        color="inherit"
                        sx={{ fontWeight: 600, textAlign: "left" }}
                        onClick={() => view(c)}
                      >
                        {c.company || c.name}
                      </Link>
                      {c.personal && <Chip size="small" variant="outlined" label="Personal" />}
                    </Stack>
                    {c.company && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {c.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography noWrap color={c.email ? "text.primary" : "text.secondary"}>
                      {c.email || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={NUM}>{money(c.invoiced)}</TableCell>
                  <TableCell align="right" sx={{ ...NUM, color: c.paid > 0 ? "success.main" : undefined }}>
                    {money(c.paid)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ ...NUM, ...(c.outstanding > 0 && { color: "error.main", fontWeight: 600 }) }}
                  >
                    {money(c.outstanding)}
                  </TableCell>
                  <TableCell align="right" sx={NUM}>{c.invoiceCount}</TableCell>
                  <TableCell>
                    {c.managedBy?.username || (
                      <Typography component="span" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                      <Button size="small" variant="outlined" onClick={() => view(c)}>
                        View
                      </Button>
                      {canEdit(c) && (
                        <Button size="small" variant="outlined" onClick={() => setEditing(c)}>
                          Edit
                        </Button>
                      )}
                      {c.nextDue && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/dashboard/finance/invoices/${c.nextDue.invoiceId}?pay=1`)}
                        >
                          Pay
                        </Button>
                      )}
                      {canEdit(c) && (
                        <Tooltip title="Delete client">
                          <IconButton size="small" color="error" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}>
                            <Trash2 />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {editing && (
        <ClientFormDialog
          client={editing}
          team={team}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {adding && (
        <ClientFormDialog
          team={team}
          defaultManager={me?._id || ""}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </Box>
  );
}
