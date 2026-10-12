import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { adminAPI, financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { StatusBadge } from "./shared";
import { fmtDate, money, titleCase } from "./format";
import { Plus, ReceiptText, Search, Trash2 } from "lucide-react";

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

  return (
    <Box>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} shown · ${money(invoices.reduce((t, i) => t + (i.total || 0), 0))} billed`}
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: { md: 360 } }}
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
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={status}
          onChange={(_, v) => v && setStatus(v)}
          sx={{ flexWrap: "wrap" }}
        >
          {FILTERS.map((s) => (
            <ToggleButton key={s} value={s} sx={{ px: 1.75 }}>
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
            sx={{ minWidth: 200, maxWidth: { md: 240 }, ml: { md: "auto !important" } }}
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

      {invoices.length === 0 ? (
        <EmptyState icon={<ReceiptText size={48} />}>
          No invoices found.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: isSuper ? 940 : 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Client</TableCell>
                {isSuper && <TableCell>Billed by</TableCell>}
                <TableCell>Issued</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id} hover>
                  <TableCell>
                    <Link component="button" underline="hover" color="inherit" sx={{ fontWeight: 600 }} onClick={() => open(inv)}>
                      {inv.number}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.client?.name || "—"}</TableCell>
                  {isSuper && <TableCell>{inv.billedBy?.username || "—"}</TableCell>}
                  <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                  <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell align="right">{money(inv.total)}</TableCell>
                  <TableCell align="right">{money(inv.balance)}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
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
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Delete ${inv.number}`}
                          onClick={() => remove(inv)}
                        >
                          <Trash2 />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
