import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
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
import Typography from "@mui/material/Typography";
import { financeAPI, settingsAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState } from "../../components/common";
import { Modal, StatusBadge } from "./shared";
import {
  PAYMENT_METHODS,
  dateToApi,
  fmtDate,
  methodLabel,
  money,
  toInputDate,
} from "./format";
import { ArrowLeft, Ban, Banknote, Link2, Pencil, Printer, Send, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import BrandMark from "../../components/Brand";

function SumRow({ label, value, strong, color }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography sx={{ fontWeight: strong ? 700 : 400, fontSize: strong ? 17 : 14 }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontWeight: strong ? 700 : 500, fontSize: strong ? 17 : 14, color }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payTo, setPayTo] = useState(null);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({});
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await financeAPI.invoices.getById(id);
      setInvoice(data.invoice);
      setPayments(data.payments || []);
      setPayTo(data.payTo);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  // A different invoice starts from a clean slate
  useEffect(() => {
    setInvoice(null);
    setError("");
    load();
  }, [load]);

  // Company details printed in the invoice header (Settings > Company)
  const [company, setCompany] = useState({});
  useEffect(() => {
    settingsAPI
      .get()
      .then((data) => setCompany(data.company || {}))
      .catch(() => {});
  }, []);

  // Personal clients pay their managing admin (Settings > Payment details); others pay the company
  const payee = invoice?.client?.personal
    ? { ...payTo, payeeName: payTo?.bankAccountName || payTo?.name }
    : { ...company, payeeName: company.name || company.legalName };

  // UPI deep link for the balance due; any UPI app opens it with the amount filled in
  const upiLink =
    invoice && payee.upiId && invoice.status !== "cancelled" && invoice.balance > 0
      ? "upi://pay?" +
        [
          ["pa", payee.upiId],
          ["pn", payee.payeeName],
          ["am", Number(invoice.balance).toFixed(2)],
          ["cu", "INR"],
          ["tn", `Invoice ${invoice.number}`],
        ]
          .filter(([, v]) => v)
          // Keep "@" literal: some UPI apps don't decode %40 in the payee address
          .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%40/g, "@")}`)
          .join("&")
      : "";
  const [qr, setQr] = useState({ link: "", url: "" });
  useEffect(() => {
    if (!upiLink) return;
    let live = true;
    QRCode.toDataURL(upiLink, { margin: 1, width: 240 })
      .then((url) => live && setQr({ link: upiLink, url }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [upiLink]);
  const qrUrl = qr.link === upiLink ? qr.url : "";

  const copyPayLink = () =>
    navigator.clipboard
      .writeText(upiLink)
      .then(() => notify("UPI payment link copied", "success"))
      .catch(() => notify("Could not copy the link", "error"));

  const openPay = () => {
    setPay({
      amount: invoice.balance,
      method: "upi",
      reference: "",
      paidAt: toInputDate(),
      note: "",
    });
    setPayError("");
    setPayOpen(true);
  };

  // "Pay" from the Clients/Invoices tables lands here with ?pay=1
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!invoice || params.get("pay") !== "1") return;
    setParams({}, { replace: true });
    if (!["cancelled", "paid"].includes(invoice.status) && invoice.balance > 0) openPay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setPayError("");
    try {
      await financeAPI.invoices.addPayment(id, { ...pay, paidAt: dateToApi(pay.paidAt) });
      setPayOpen(false);
      notify("Payment recorded", "success");
      await load();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status) => {
    try {
      await financeAPI.invoices.update(id, { status });
      await load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const cancelInvoice = async () => {
    const ok = await confirm({
      title: "Cancel invoice",
      message: `Cancel ${invoice.number}? It will no longer accept payments.`,
      confirmLabel: "Cancel invoice",
    });
    if (ok) setStatus("cancelled");
  };

  const removePayment = async (p) => {
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

  // A failed first load replaces the page; a failed refresh only shows a banner (below)
  if (!invoice) return error ? <Alert severity="error">{error}</Alert> : <LoadingState text="Loading invoice..." />;

  const c = invoice.client || {};

  // Browsers use the page title as the saved PDF's file name
  const printInvoice = () => {
    const prev = document.title;
    document.title = `${c.company || c.name || invoice.number} - ${fmtDate(invoice.issueDate)}`.replace(/[\\/:*?"<>|]/g, "-");
    window.addEventListener("afterprint", () => (document.title = prev), { once: true });
    window.print();
  };

  // Ledger: the invoice is a debit, each payment a credit (oldest first)
  let running = 0;
  const ledgerRows = [
    {
      date: invoice.issueDate,
      label: `Invoice ${invoice.number} raised`,
      debit: invoice.total,
      credit: 0,
    },
    ...[...payments]
      .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt))
      .map((p) => ({
        date: p.paidAt,
        label: `Payment received (${methodLabel(p.method)}${p.reference ? `, ${p.reference}` : ""})`,
        debit: 0,
        credit: p.amount,
      })),
  ].map((row) => {
    running = Math.round((running + row.debit - row.credit) * 100) / 100;
    return { ...row, balance: running };
  });
  const canPay = !["cancelled", "paid"].includes(invoice.status) && invoice.balance > 0;

  return (
    <Box>
      <Stack
        className="no-print"
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 } }}>
            {invoice.number}
          </Typography>
          <StatusBadge status={invoice.status} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Button
            color="inherit"
            startIcon={<ArrowLeft />}
            onClick={() => navigate("/dashboard/finance/invoices")}
          >
            Back
          </Button>
          {invoice.status === "draft" && (
            <Button variant="outlined" startIcon={<Send />} onClick={() => setStatus("sent")}>
              Mark sent
            </Button>
          )}
          {!["cancelled", "paid"].includes(invoice.status) && (
            <Button
              variant="outlined"
              startIcon={<Pencil />}
              onClick={() => navigate(`/dashboard/finance/invoices/${id}/edit`)}
            >
              Edit
            </Button>
          )}
          <Button variant="outlined" startIcon={<Printer />} onClick={printInvoice}>
            Invoice PDF
          </Button>
          {upiLink && (
            <Button variant="outlined" startIcon={<Link2 />} onClick={copyPayLink}>
              Copy pay link
            </Button>
          )}
          {canPay && (
            <Button variant="contained" startIcon={<Banknote />} onClick={openPay}>
              Record payment
            </Button>
          )}
          {invoice.status !== "cancelled" && invoice.amountPaid === 0 && (
            <Button color="error" startIcon={<Ban />} onClick={cancelInvoice}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" className="no-print" sx={{ mb: 2 }}>
          Couldn't refresh this invoice: {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2.5, sm: 5 }, "@media print": { border: 0, p: 0 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", mb: 4 }}
        >
          <Box>
            <Box sx={{ mb: 1.5 }}>
              <BrandMark size={56} />
            </Box>
            {company.legalName && (
              <Typography variant="body2" color="text.secondary">
                {company.legalName}
              </Typography>
            )}
            {company.email && (
              <Typography variant="body2" color="text.secondary">
                {company.email}
              </Typography>
            )}
            {(company.address || company.city) && (
              <Typography variant="body2" color="text.secondary">
                {[
                  company.address,
                  company.city,
                  [company.state, company.postalCode].filter(Boolean).join(" "),
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Typography>
            )}
            {company.phone && (
              <Typography variant="body2" color="text.secondary">
                {company.phone}
              </Typography>
            )}
            {(company.gstin || company.pan) && (
              <Typography variant="body2" color="text.secondary">
                {[company.gstin && `GSTIN: ${company.gstin}`, company.pan && `PAN: ${company.pan}`]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: { sm: "right" }, flexShrink: 0 }}>
            <Typography
              component="h2"
              sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1.1 }}
            >
              INVOICE
            </Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 18, mt: 0.5, mb: 1.5 }}>
              # {invoice.number}
            </Typography>
            <Typography>
              <b>Issued:</b> {fmtDate(invoice.issueDate)}
            </Typography>
            <Typography>
              <b>Due:</b> {fmtDate(invoice.dueDate)}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            BILL TO
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
          {c.company && <Typography>{c.company}</Typography>}
          {c.address && <Typography>{c.address}</Typography>}
          {c.email && <Typography>{c.email}</Typography>}
          {c.gstin && <Typography>GSTIN: {c.gstin}</Typography>}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell>{it.description}</TableCell>
                  <TableCell align="right">{it.quantity}</TableCell>
                  <TableCell align="right">{money(it.rate)}</TableCell>
                  <TableCell align="right">{money(it.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack spacing={1} sx={{ ml: "auto", mt: 3, width: { xs: "100%", sm: 300 } }}>
          <SumRow label="Subtotal" value={money(invoice.subtotal)} />
          {invoice.discount > 0 && (
            <SumRow label="Discount" value={`− ${money(invoice.discount)}`} />
          )}
          {invoice.taxRate > 0 && (
            <SumRow label={`Tax (${invoice.taxRate}%)`} value={money(invoice.taxAmount)} />
          )}
          <Divider />
          <SumRow strong label="Total" value={money(invoice.total)} />
          <SumRow label="Paid" value={money(invoice.amountPaid)} color="success.main" />
          <Divider />
          <SumRow strong label="Balance due" value={money(invoice.balance)} />
          {canPay && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "right" }}>
              Next due date: <b>{fmtDate(invoice.dueDate)}</b>
            </Typography>
          )}
        </Stack>

        {/* Partly paid: the invoice lists what has been received so far */}
        {canPay && payments.length > 0 && (
          <Box sx={{ mt: 4, breakInside: "avoid" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              PAYMENT HISTORY
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{fmtDate(p.paidAt)}</TableCell>
                    <TableCell>{methodLabel(p.method)}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                    <TableCell align="right">{money(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {(payee.bankAccountNumber || payee.upiId) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider", justifyContent: "space-between", breakInside: "avoid" }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                PAYMENT INFORMATION
              </Typography>
              {[
                ["Account name", payee.bankAccountName],
                ["Bank", payee.bankName],
                ["Account no.", payee.bankAccountNumber],
                ["IFSC", payee.bankIfsc],
                ["UPI ID", payee.upiId],
              ]
                .filter(([, v]) => v)
                .map(([label, v]) => (
                  <Typography key={label} variant="body2">
                    <b>{label}:</b> {v}
                  </Typography>
                ))}
              {upiLink && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <b>Amount due:</b> {money(invoice.balance)} ·{" "}
                  <Box component="a" href={upiLink} sx={{ color: "primary.dark", fontWeight: 600 }}>
                    Pay via UPI
                  </Box>
                </Typography>
              )}
            </Box>
            {qrUrl && (
              <Box sx={{ textAlign: "center", flexShrink: 0 }}>
                <Box component="img" src={qrUrl} alt="UPI payment QR code" sx={{ width: 120, height: 120, display: "block", mx: "auto" }} />
                <Typography variant="caption" color="text.secondary">
                  Scan to pay {money(invoice.balance)}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {company.invoiceFooter && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 4, whiteSpace: "pre-line" }}
          >
            {company.invoiceFooter}
          </Typography>
        )}

        {(invoice.notes || invoice.terms) && (
          <Box sx={{ mt: 4 }}>
            {invoice.notes && <Typography sx={{ mb: 1 }}>{invoice.notes}</Typography>}
            {invoice.terms && (
              <Typography variant="body2" color="text.secondary">
                {invoice.terms}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <Paper className="no-print" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
          Invoice ledger
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Particulars</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{fmtDate(row.date)}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">{row.debit ? money(row.debit) : "—"}</TableCell>
                  <TableCell
                    align="right"
                    sx={row.credit ? { color: "success.main", fontWeight: 600 } : undefined}
                  >
                    {row.credit ? money(row.credit) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {money(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper className="no-print" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
          Payment history
        </Typography>
        {payments.length === 0 ? (
          <Typography color="text.secondary" sx={{ px: 2.5, pb: 2.5 }}>
            No payments recorded yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{fmtDate(p.paidAt)}</TableCell>
                    <TableCell>{methodLabel(p.method)}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                    <TableCell>{p.note || "—"}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main", fontWeight: 600 }}>
                      {money(p.amount)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Remove payment"
                        onClick={() => removePayment(p)}
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
      </Paper>

      {payOpen && (
        <Modal title="Record payment" onClose={() => setPayOpen(false)}>
          <Box component="form" onSubmit={submitPayment}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="number"
                  label="Amount (₹)"
                  required
                  value={pay.amount}
                  onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                  helperText={`Balance due ${money(invoice.balance)}`}
                  slotProps={{ htmlInput: { step: "any", min: 0.01, max: invoice.balance } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="date"
                  label="Date"
                  value={pay.paidAt}
                  onChange={(e) => setPay({ ...pay, paidAt: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Method"
                  value={pay.method}
                  onChange={(e) => setPay({ ...pay, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Reference / UTR"
                  value={pay.reference}
                  onChange={(e) => setPay({ ...pay, reference: e.target.value })}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Note"
                  value={pay.note}
                  onChange={(e) => setPay({ ...pay, note: e.target.value })}
                />
              </Grid>
              {payError && (
                <Grid size={12}>
                  <Alert severity="error">{payError}</Alert>
                </Grid>
              )}
            </Grid>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" onClick={() => setPayOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save payment"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
