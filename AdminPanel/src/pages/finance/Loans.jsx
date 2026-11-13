import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
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
import Typography from "@mui/material/Typography";
import { financeAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader } from "../../components/common";
import DataTable from "../../components/DataTable";
import { Modal } from "./shared";
import { PAYMENT_METHODS, dateToApi, dueLabel, fmtDate, methodLabel, money, toInputDate } from "./format";
import { Eye, HandCoins, Pencil, Plus, Trash2 } from "lucide-react";

const DIRECTION_LABEL = { taken: "Taken", given: "Given" };
const NUM = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

const blankLoan = () => ({
  direction: "taken",
  party: "",
  principal: "",
  startDate: toInputDate(),
  dueDate: "",
  method: "bank-transfer",
  note: "",
});

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

export default function Loans() {
  const { confirm, notify } = useFeedback();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState("all");
  const [editing, setEditing] = useState(null); // loan form (new or existing)
  const [repaying, setRepaying] = useState(null); // { loan, form }
  const [viewing, setViewing] = useState(null); // loan whose repayments are shown
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await financeAPI.loans.getAll({ direction: direction === "all" ? "" : direction });
      setData(res);
      setError("");
      // Keep an open history dialog in step with the latest numbers
      setViewing((v) => (v ? res.loans.find((l) => l._id === v._id) || null : v));
    } catch (e) {
      setError(e.message);
    }
  }, [direction]);

  useEffect(() => {
    load();
  }, [load]);

  const saveLoan = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const body = {
      ...editing,
      principal: Number(editing.principal),
      startDate: dateToApi(editing.startDate),
      dueDate: editing.dueDate ? dateToApi(editing.dueDate) : null,
    };
    try {
      if (editing._id) await financeAPI.loans.update(editing._id, body);
      else await financeAPI.loans.create(body);
      notify("Loan saved", "success");
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveRepayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await financeAPI.loans.addRepayment(repaying.loan._id, {
        ...repaying.form,
        amount: Number(repaying.form.amount),
        paidAt: dateToApi(repaying.form.paidAt),
      });
      notify("Repayment recorded", "success");
      setRepaying(null);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeLoan = async (loan) => {
    const ok = await confirm({
      title: "Delete loan",
      message: `Delete the loan ${loan.direction === "taken" ? "from" : "to"} ${loan.party}? Its repayments and wallet entries are removed too.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.loans.delete(loan._id);
      notify("Loan deleted", "success");
      setViewing(null);
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const removeRepayment = async (loan, r) => {
    const ok = await confirm({
      title: "Delete repayment",
      message: `Delete the ${money(r.amount)} repayment from ${fmtDate(r.paidAt)}?`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await financeAPI.loans.deleteRepayment(loan._id, r._id);
      notify("Repayment deleted", "success");
      await load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  if (error && !data) return <Alert severity="error">{error}</Alert>;
  if (!data) return <LoadingState text="Loading loans..." />;

  const { loans, totals } = data;
  const setLoan = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });
  const setRepay = (k) => (e) => setRepaying({ ...repaying, form: { ...repaying.form, [k]: e.target.value } });

  return (
    <Box>
      <PageHeader
        title="Loans"
        actions={
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => {
              setFormError("");
              setEditing(blankLoan());
            }}
          >
            Add loan
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stat
            label="Borrowed · still to repay"
            value={money(totals.borrowedOutstanding)}
            color={totals.borrowedOutstanding > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Stat
            label="Lent · still to collect"
            value={money(totals.lentOutstanding)}
            color={totals.lentOutstanding > 0 ? "warning.main" : undefined}
          />
        </Grid>
      </Grid>

      <DataTable
        rows={loans}
        minWidth={900}
        empty={{ icon: <HandCoins />, title: "No loans", text: "Add one when you borrow or lend money." }}
        toolbar={
          <ToggleButtonGroup exclusive size="small" value={direction} onChange={(_, v) => v && setDirection(v)}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="taken">Taken</ToggleButton>
            <ToggleButton value="given">Given</ToggleButton>
          </ToggleButtonGroup>
        }
        columns={[
          {
            key: "party",
            label: "With",
            mobile: "title",
            value: (l) => l.party,
            render: (l) => (
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{l.party}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {fmtDate(l.startDate)}
                </Typography>
              </Box>
            ),
          },
          {
            key: "direction",
            label: "Type",
            mobile: "subtitle",
            value: (l) => l.direction,
            render: (l) => (
              <Chip size="small" color={l.direction === "taken" ? "error" : "info"} label={DIRECTION_LABEL[l.direction]} />
            ),
          },
          { key: "principal", label: "Amount", align: "right", value: (l) => l.principal, render: (l) => money(l.principal) },
          {
            key: "repaid",
            label: "Repaid",
            align: "right",
            value: (l) => l.repaid,
            render: (l) => (
              <Box component="span" sx={{ color: l.repaid > 0 ? "success.main" : undefined }}>
                {money(l.repaid)}
              </Box>
            ),
          },
          {
            key: "balance",
            label: "Balance",
            align: "right",
            value: (l) => l.balance,
            render: (l) => (
              <Box component="span" sx={l.balance > 0 ? { fontWeight: 600 } : undefined}>
                {money(l.balance)}
              </Box>
            ),
          },
          {
            key: "dueDate",
            label: "Due",
            value: (l) => (l.dueDate ? new Date(l.dueDate).getTime() : null),
            render: (l) =>
              l.dueDate ? (
                <Box>
                  <Typography>{fmtDate(l.dueDate)}</Typography>
                  {l.status === "open" && (
                    <Typography variant="body2" color={new Date(l.dueDate) < new Date() ? "error" : "text.secondary"}>
                      {dueLabel(l.dueDate)}
                    </Typography>
                  )}
                </Box>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            label: "Status",
            value: (l) => l.status,
            render: (l) => (
              <Chip size="small" color={l.status === "closed" ? "success" : "default"} label={l.status === "closed" ? "Closed" : "Open"} />
            ),
          },
        ]}
        actions={(l) => (
          <>
            <Tooltip title="View">
              <IconButton size="small" color="info" aria-label="View" onClick={() => setViewing(l)}>
                <Eye />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                aria-label="Edit"
                onClick={() => {
                  setFormError("");
                  setEditing({
                    ...l,
                    startDate: toInputDate(l.startDate),
                    dueDate: l.dueDate ? toInputDate(l.dueDate) : "",
                  });
                }}
              >
                <Pencil />
              </IconButton>
            </Tooltip>
            {l.balance > 0 && (
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setFormError("");
                  setRepaying({
                    loan: l,
                    form: { amount: l.balance, paidAt: toInputDate(), method: "bank-transfer", note: "" },
                  });
                }}
              >
                Repay
              </Button>
            )}
            <Tooltip title="Delete loan">
              <IconButton size="small" color="error" aria-label={`Delete loan with ${l.party}`} onClick={() => removeLoan(l)}>
                <Trash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      {editing && (
        <Modal title={editing._id ? "Edit loan" : "Add loan"} busy={saving} onClose={() => setEditing(null)}>
          <Box component="form" onSubmit={saveLoan}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={12}>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  color="primary"
                  value={editing.direction}
                  onChange={(_, v) => v && setEditing({ ...editing, direction: v })}
                  disabled={Boolean(editing._id)}
                >
                  <ToggleButton value="taken">Loan taken (borrowed)</ToggleButton>
                  <ToggleButton value="given">Loan given (lent)</ToggleButton>
                </ToggleButtonGroup>
                {editing._id && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    The type can&apos;t be changed after the loan is created.
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={editing.direction === "taken" ? "Lender" : "Borrower"}
                  required
                  value={editing.party}
                  onChange={setLoan("party")}
                  helperText={editing.direction === "taken" ? "Bank or person you borrowed from" : "Person or company you lent to"}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Amount"
                  type="number"
                  required
                  value={editing.principal}
                  onChange={setLoan("principal")}
                  slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }}
                  helperText={editing._id ? `Already repaid: ${money(editing.repaid)}` : " "}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date"
                  type="date"
                  required
                  value={editing.startDate}
                  onChange={setLoan("startDate")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Repay by (optional)"
                  type="date"
                  value={editing.dueDate}
                  onChange={setLoan("dueDate")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Method" value={editing.method} onChange={setLoan("method")}>
                  {PAYMENT_METHODS.map(([v, label]) => (
                    <MenuItem key={v} value={v}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField label="Note" multiline minRows={2} value={editing.note} onChange={setLoan("note")} />
              </Grid>
              {formError && (
                <Grid size={12}>
                  <Alert severity="error">{formError}</Alert>
                </Grid>
              )}
            </Grid>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" disabled={saving} onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Save loan"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}

      {repaying && (
        <Modal
          title={`Repayment ${repaying.loan.direction === "taken" ? "to" : "from"} ${repaying.loan.party}`}
          busy={saving}
          onClose={() => setRepaying(null)}
        >
          <Box component="form" onSubmit={saveRepayment}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Balance: <b>{money(repaying.loan.balance)}</b>
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Amount"
                  type="number"
                  required
                  value={repaying.form.amount}
                  onChange={setRepay("amount")}
                  slotProps={{ htmlInput: { min: 0.01, max: repaying.loan.balance, step: "0.01" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date"
                  type="date"
                  required
                  value={repaying.form.paidAt}
                  onChange={setRepay("paidAt")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Method" value={repaying.form.method} onChange={setRepay("method")}>
                  {PAYMENT_METHODS.map(([v, label]) => (
                    <MenuItem key={v} value={v}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Note" value={repaying.form.note} onChange={setRepay("note")} />
              </Grid>
              {formError && (
                <Grid size={12}>
                  <Alert severity="error">{formError}</Alert>
                </Grid>
              )}
            </Grid>
            <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
              <Button color="inherit" disabled={saving} onClick={() => setRepaying(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Saving..." : "Record repayment"}
              </Button>
            </DialogActions>
          </Box>
        </Modal>
      )}

      {viewing && (
        <Modal
          wide
          title={`Loan ${viewing.direction === "taken" ? "from" : "to"} ${viewing.party}`}
          onClose={() => setViewing(null)}
        >
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ["Amount", money(viewing.principal)],
              ["Repaid", money(viewing.repaid)],
              ["Balance", money(viewing.balance)],
              ["Due", viewing.dueDate ? fmtDate(viewing.dueDate) : "—"],
            ].map(([label, value]) => (
              <Grid key={label} size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
          {viewing.note && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {viewing.note}
            </Typography>
          )}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Repayments
          </Typography>
          {viewing.repayments.length === 0 ? (
            <Typography color="text.secondary">No repayments yet.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...viewing.repayments]
                    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
                    .map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>{fmtDate(r.paidAt)}</TableCell>
                        <TableCell>{methodLabel(r.method)}</TableCell>
                        <TableCell>{r.note || "—"}</TableCell>
                        <TableCell align="right" sx={NUM}>
                          {money(r.amount)}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete repayment">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="Delete repayment"
                              onClick={() => removeRepayment(viewing, r)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Modal>
      )}
    </Box>
  );
}
