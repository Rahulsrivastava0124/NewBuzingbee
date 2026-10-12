import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
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
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { StatusBadge } from "./shared";
import { fmtDate, money, titleCase } from "./format";
import { Eye, Plus, ReceiptText, Search, Trash2 } from "lucide-react";

const FILTERS = ["all", "draft", "sent", "partial", "overdue", "paid", "cancelled"];

export default function Invoices() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.invoices.getAll({ status, search });
      setInvoices(data.invoices || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

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
    <Box sx={{ maxWidth: 1400 }}>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} shown`}
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
      </Stack>

      {invoices.length === 0 ? (
        <EmptyState icon={<ReceiptText size={48} />}>
          No invoices found.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Client</TableCell>
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
                    <Link component="button" underline="hover" sx={{ fontWeight: 700 }} onClick={() => open(inv)}>
                      {inv.number}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.client?.name || "—"}</TableCell>
                  <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                  <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell align="right">{money(inv.total)}</TableCell>
                  <TableCell align="right">{money(inv.balance)}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Open">
                      <IconButton size="small" aria-label="Open" onClick={() => open(inv)}>
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete"
                        onClick={() => remove(inv)}
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
    </Box>
  );
}
