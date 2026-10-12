import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { PAYMENT_METHODS, fmtDate, methodLabel, money } from "./format";
import { CreditCard, Printer, Trash2 } from "lucide-react";

export default function Payments() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.payments.getAll({ method, from, to });
      setPayments(data.payments || []);
      setTotalAmount(data.totalAmount || 0);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [method, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (p) => {
    const ok = await confirm({
      title: "Remove payment",
      message: `Remove payment of ${money(p.amount)}?`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await financeAPI.payments.delete(p._id);
      notify("Payment removed", "success");
      await load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  if (loading) return <LoadingState text="Loading payments..." />;

  return (
    <Box sx={{ maxWidth: 1400 }}>
      <PageHeader
        title="Payment history"
        subtitle={`${payments.length} payments · ${money(totalAmount)} received`}
        actions={
          <Button
            className="no-print"
            variant="outlined"
            startIcon={<Printer />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack className="no-print" direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          type="date"
          label="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ maxWidth: { md: 180 } }}
        />
        <TextField
          type="date"
          label="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ maxWidth: { md: 180 } }}
        />
        <TextField
          select
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          sx={{ maxWidth: { md: 200 } }}
        >
          <MenuItem value="all">All methods</MenuItem>
          {PAYMENT_METHODS.map(([v, l]) => (
            <MenuItem key={v} value={v}>
              {l}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {payments.length === 0 ? (
        <EmptyState icon={<CreditCard size={48} />}>
          No payments found.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell className="no-print" />
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell>{fmtDate(p.paidAt)}</TableCell>
                  <TableCell>{p.client?.name || "—"}</TableCell>
                  <TableCell>
                    {p.invoice ? (
                      <Link
                        component="button"
                        underline="hover"
                        sx={{ fontWeight: 700 }}
                        onClick={() => navigate(`/dashboard/finance/invoices/${p.invoice._id}`)}
                      >
                        {p.invoice.number}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{methodLabel(p.method)}</TableCell>
                  <TableCell>{p.reference || "—"}</TableCell>
                  <TableCell align="right" sx={{ color: "success.main", fontWeight: 700 }}>
                    {money(p.amount)}
                  </TableCell>
                  <TableCell align="right" className="no-print">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Remove payment"
                      onClick={() => remove(p)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
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
