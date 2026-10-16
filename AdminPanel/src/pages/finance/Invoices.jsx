import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { adminAPI, financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../../components/common";
import DataTable from "../../components/DataTable";
import { StatusBadge } from "./shared";
import { fmtDate, money, titleCase } from "./format";
import { Plus, ReceiptText, Trash2 } from "lucide-react";

const FILTERS = ["all", "draft", "sent", "partial", "overdue", "paid", "cancelled"];

export default function Invoices() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  // Super admin sees everyone's bills and can narrow to one person
  const { admin } = useOutletContext() || {};
  const isSuper = admin?.role === "super";
  const [billedBy, setBilledBy] = useState("");
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (!isSuper) return;
    adminAPI.listUsers().then(setPeople).catch(() => {});
  }, [isSuper]);

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.invoices.getAll({ status, search, billedBy });
      setInvoices(data.invoices || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, search, billedBy]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async (inv) => {
    const ok = await confirm({
      title: "Delete invoice",
      message: `Delete ${inv.number}? Its payments and wallet entries are removed too.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.invoices.delete(inv._id);
      notify("Invoice deleted", "success");
      await load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  if (loading) return <LoadingState text="Loading invoices..." />;

  const open = (inv) => navigate(`/dashboard/finance/invoices/${inv._id}`);
  const billed = invoices.reduce((t, i) => t + (i.total || 0), 0);
  const due = invoices.reduce((t, i) => t + (i.status === "cancelled" ? 0 : i.balance || 0), 0);

  const columns = [
    {
      key: "number",
      label: "Invoice",
      mobile: "title",
      render: (inv) => <Typography sx={{ fontWeight: 600 }}>{inv.number}</Typography>,
      value: (inv) => inv.number,
    },
    { key: "client", label: "Client", mobile: "subtitle", value: (inv) => inv.client?.name || "—" },
    ...(isSuper ? [{ key: "billedBy", label: "Billed by", value: (inv) => inv.billedBy?.username || "—" }] : []),
    {
      key: "dueDate",
      label: "Due",
      value: (inv) => new Date(inv.dueDate).getTime(),
      render: (inv) => fmtDate(inv.dueDate),
    },
    { key: "total", label: "Total", align: "right", value: (inv) => inv.total, render: (inv) => money(inv.total) },
    {
      key: "balance",
      label: "Balance",
      align: "right",
      value: (inv) => inv.balance,
      render: (inv) => (
        <Box component="span" sx={inv.balance > 0 && inv.status !== "cancelled" ? { fontWeight: 600 } : undefined}>
          {money(inv.balance)}
        </Box>
      ),
    },
    { key: "status", label: "Status", value: (inv) => inv.status, render: (inv) => <StatusBadge status={inv.status} /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${money(billed)} billed · ${money(due)} due`}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => navigate("/dashboard/finance/invoices/new")}
          >
            New Invoice
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
        rows={invoices}
        minWidth={isSuper ? 900 : 780}
        onRowClick={open}
        empty={{ icon: <ReceiptText />, title: "No invoices", text: "No invoices match these filters." }}
        toolbar={
          <TableToolbar>
            <SearchField value={search} onChange={setSearch} placeholder="Search invoice number..." />
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}>
              <ToggleButtonGroup exclusive size="small" value={status} onChange={(_, v) => v && setStatus(v)}>
                {FILTERS.map((s) => (
                  <ToggleButton key={s} value={s}>
                    {titleCase(s)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {isSuper && (
                <TextField
                  select
                  label="Billed by"
                  value={billedBy}
                  onChange={(e) => setBilledBy(e.target.value)}
                  sx={{ minWidth: 180, width: "auto" }}
                >
                  <MenuItem value="">All people</MenuItem>
                  {people.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.username}
                      {p._id === admin?._id ? " (you)" : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </TableToolbar>
        }
        actions={(inv) => (
          <>
            <Button size="small" variant="outlined" onClick={() => open(inv)}>
              View
            </Button>
            {!["cancelled", "paid"].includes(inv.status) && inv.balance > 0 && (
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate(`/dashboard/finance/invoices/${inv._id}?pay=1`)}
              >
                Pay
              </Button>
            )}
            <Tooltip title="Delete invoice">
              <IconButton size="small" color="error" aria-label={`Delete ${inv.number}`} onClick={() => remove(inv)}>
                <Trash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      />
    </Box>
  );
}
