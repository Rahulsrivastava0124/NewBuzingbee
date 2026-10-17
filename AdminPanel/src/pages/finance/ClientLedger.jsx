import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ArrowLeft, BookOpen, FilePlus, Pencil, Printer } from "lucide-react";
import { adminAPI, financeAPI } from "../../services/api";
import ClientFormDialog from "./ClientFormDialog";
import { EmptyState, LoadingState, PageHeader } from "../../components/common";
import { dueLabel, fmtDate, methodLabel, money } from "./format";

function Stat({ label, value, sub, color }) {
  return (
    <Paper sx={{ p: 2.5, height: "100%" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, color: color || "text.primary" }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="body2" color="text.secondary">
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function ClientLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const { admin } = useOutletContext() || {};
  const [team, setTeam] = useState([]);

  const load = useCallback(() => {
    financeAPI.clients
      .ledger(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
    adminAPI.listUsers().then(setTeam).catch(() => {});
  }, [load]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <LoadingState text="Loading client ledger..." />;

  const { client, totals, nextDue, openInvoices, entries } = data;
  const openInvoice = (invoiceId) =>
    navigate(`/dashboard/finance/invoices/${invoiceId}`);

  return (
    <Box>
      <PageHeader
        title={client.name}
        subtitle={
          [
            client.company,
            client.email,
            client.phone,
            client.managedBy ? `Managed by ${client.managedBy.username}` : "",
            client.personal ? "Personal" : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Client ledger"
        }
        actions={
          <>
            <Button
              className="no-print"
              color="inherit"
              startIcon={<ArrowLeft />}
              onClick={() => navigate("/dashboard/finance/clients")}
            >
              Clients
            </Button>
            <Button
              className="no-print"
              variant="outlined"
              startIcon={<Printer />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            {(admin?.role === "super" ||
              !client.managedBy ||
              String(client.managedBy._id) === String(admin?._id)) && (
              <Button
                className="no-print"
                variant="outlined"
                startIcon={<Pencil />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
            <Button
              className="no-print"
              variant="contained"
              startIcon={<FilePlus />}
              onClick={() => navigate(`/dashboard/finance/invoices/new?client=${client._id}`)}
            >
              New invoice
            </Button>
          </>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Invoiced" value={money(totals.invoiced)} sub={`${totals.invoiceCount} invoices`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Received" value={money(totals.paid)} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Balance due"
            value={money(totals.balance)}
            color={totals.balance > 0 ? "error.main" : undefined}
            sub={totals.overdueAmount > 0 ? `${money(totals.overdueAmount)} overdue` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Next due"
            value={nextDue ? fmtDate(nextDue.dueDate) : "Nothing due"}
            color={nextDue?.overdue ? "error.main" : undefined}
            sub={
              nextDue
                ? `${dueLabel(nextDue.dueDate)} · ${money(nextDue.amount)}`
                : "All invoices are settled"
            }
          />
        </Grid>
      </Grid>

      {openInvoices.length > 0 && (
        <Paper className="no-print" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
            Open invoices
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Due date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {openInvoices.map((inv) => (
                  <TableRow key={inv._id} hover>
                    <TableCell>
                      <Link
                        component="button"
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                        onClick={() => openInvoice(inv._id)}
                      >
                        {inv.number}
                      </Link>
                    </TableCell>
                    <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={inv.overdue ? "error" : "info"}
                        label={dueLabel(inv.dueDate)}
                      />
                    </TableCell>
                    <TableCell align="right">{money(inv.total)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {money(inv.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />}>
          No invoices have been sent to this client yet. The ledger fills in as
          soon as an invoice is marked sent.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
            Statement of account
          </Typography>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Particulars</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e, i) => (
                <TableRow key={`${e.type}-${e.paymentId || e.invoiceId}-${i}`} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(e.date)}</TableCell>
                  <TableCell>
                    {e.description}
                    {e.type === "invoice" && e.dueDate && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        Due {fmtDate(e.dueDate)}
                      </Typography>
                    )}
                    {e.type === "payment" && (
                      <Typography variant="caption" color="text.secondary" component="div">
                        {methodLabel(e.method)}
                        {e.reference ? ` · ${e.reference}` : ""}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => openInvoice(e.invoiceId)}
                    >
                      {e.ref}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{e.debit ? money(e.debit) : "—"}</TableCell>
                  <TableCell
                    align="right"
                    sx={e.credit ? { color: "success.main", fontWeight: 600 } : undefined}
                  >
                    {e.credit ? money(e.credit) : "—"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {money(e.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                  Totals
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {money(totals.invoiced)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: "success.main" }}>
                  {money(totals.paid)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {money(totals.balance)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      <Stack sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Drafts and cancelled invoices are not included.
        </Typography>
      </Stack>
      {editing && (
        <ClientFormDialog
          client={client}
          team={team}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </Box>
  );
}
