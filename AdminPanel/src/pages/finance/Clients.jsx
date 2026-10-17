import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { adminAPI, financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../../components/common";
import DataTable from "../../components/DataTable";
import ClientFormDialog from "./ClientFormDialog";
import { money } from "./format";

import { Contact, Plus, Trash2 } from "lucide-react";

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

  const totalDue = clients.reduce((t, c) => t + (c.outstanding || 0), 0);

  const columns = [
    {
      key: "company",
      label: "Company",
      mobile: "title",
      value: (c) => c.company || c.name,
      render: (c) => (
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>
              {c.company || c.name}
            </Typography>
            {c.personal && <Chip size="small" variant="outlined" label="Personal" />}
          </Stack>
          {c.company && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {c.name}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: "email",
      label: "Email",
      mobile: "subtitle",
      value: (c) => c.email || "",
      render: (c) => c.email || <Typography component="span" color="text.secondary">—</Typography>,
    },
    { key: "invoiced", label: "Total", align: "right", value: (c) => c.invoiced, render: (c) => money(c.invoiced) },
    {
      key: "paid",
      label: "Paid",
      align: "right",
      value: (c) => c.paid,
      render: (c) => (
        <Box component="span" sx={{ color: c.paid > 0 ? "success.main" : undefined }}>
          {money(c.paid)}
        </Box>
      ),
    },
    {
      key: "outstanding",
      label: "Due",
      align: "right",
      value: (c) => c.outstanding,
      render: (c) => (
        <Box component="span" sx={c.outstanding > 0 ? { color: "error.main", fontWeight: 600 } : undefined}>
          {money(c.outstanding)}
        </Box>
      ),
    },
    { key: "invoiceCount", label: "Invoices", align: "right", value: (c) => c.invoiceCount },
    {
      key: "managedBy",
      label: "Managed by",
      value: (c) => c.managedBy?.username || "",
      render: (c) =>
        c.managedBy?.username || (
          <Typography component="span" color="text.secondary">
            Unassigned
          </Typography>
        ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · ${money(totalDue)} due`}
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

      <DataTable
        columns={columns}
        rows={clients}
        minWidth={1000}
        onRowClick={view}
        empty={{ icon: <Contact />, title: "No clients", text: "Add your first client to start invoicing." }}
        toolbar={
          <TableToolbar>
            <SearchField value={search} onChange={setSearch} placeholder="Search name, company or email..." />
            <TextField
              select
              label="Managed by"
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              sx={{ minWidth: 200, width: { md: "auto" } }}
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
          </TableToolbar>
        }
        actions={(c) => (
          <>
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
          </>
        )}
      />

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
