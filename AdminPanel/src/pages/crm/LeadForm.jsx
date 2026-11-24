import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SERVICE_LABELS, leadAPI } from "../../services/api";
import { Modal } from "../finance/shared";
import { dateToApi, toInputDate } from "../finance/format";
import {
  BUDGET_TYPES,
  INTEREST_LEVELS,
  LOST_REASONS,
  SOURCES,
  STAGES,
  TEMPERATURES,
  toInputDateTime,
} from "./labels";

// Same two-column grid as the Add/Edit user dialogs
const FORM_GRID = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  minWidth: { sm: 560 },
  columnGap: 2,
  rowGap: 2.5,
  pt: 1,
};
const FULL = { gridColumn: "1 / -1" };
const DATE_LABEL = { inputLabel: { shrink: true } };

const toForm = (l = {}) => ({
  businessName: l.businessName || "",
  contactPerson: l.contactPerson || "",
  phone: l.phone || "",
  email: l.email || "",
  source: l.source || "hunter-x",
  industry: l.industry || "",
  services: l.services || [],
  owner: l.owner?._id || l.owner || "",
  temperature: l.temperature || "cold",
  disqualifyReason: l.disqualifyReason || "",
  stage: l.stage || "new",
  lostReason: l.lostReason || "",
  budgetType: l.budget?.type || "unknown",
  budgetAmount: l.budget?.amount ?? "",
  proposalValue: l.proposalValue ?? "",
  lastContactAt: l.lastContactAt ? toInputDate(l.lastContactAt) : "",
  nextFollowUpAt: l.nextFollowUpAt ? toInputDate(l.nextFollowUpAt) : "",
  meetingAt: toInputDateTime(l.meetingAt),
  nextAction: l.nextAction || "",
  currentMarketing: l.currentMarketing || "",
  mainProblem: l.mainProblem || "",
  decisionMaker: l.decisionMaker || "",
  interest: l.interest || "",
  doNotContact: Boolean(l.doNotContact),
  enquiry: l.enquiry || undefined,
});

const options = (labels) =>
  Object.entries(labels).map(([v, l]) => (
    <MenuItem key={v} value={v}>
      {l}
    </MenuItem>
  ));

const Section = ({ children }) => (
  <Typography variant="overline" color="text.secondary" sx={{ ...FULL, mb: -1.5, mt: 1 }}>
    {children}
  </Typography>
);

/**
 * Create (no lead._id) or edit a lead. `lead` may carry prefilled values, e.g. from an enquiry.
 * owners: users to assign; canAssign: managers pick the owner, team members own what they add.
 */
export default function LeadForm({ lead, owners = [], canAssign, onClose, onSaved }) {
  const editing = Boolean(lead?._id);
  const [form, setForm] = useState(() => toForm(lead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.temperature === "not-qualified" && !form.disqualifyReason.trim()) {
      setError("Give a reason for marking the lead not qualified");
      return;
    }
    if (form.stage === "lost" && !form.lostReason) {
      setError("Choose why the deal was lost");
      return;
    }
    const { budgetType, budgetAmount, owner, ...rest } = form;
    const body = {
      ...rest,
      budget: { type: budgetType, amount: budgetAmount },
      lastContactAt: dateToApi(form.lastContactAt) || null,
      nextFollowUpAt: dateToApi(form.nextFollowUpAt) || null,
      meetingAt: form.meetingAt ? new Date(form.meetingAt).toISOString() : null,
      ...(canAssign && owner ? { owner } : {}),
    };
    setSaving(true);
    try {
      const res = editing ? await leadAPI.update(lead._id, body) : await leadAPI.create(body);
      onSaved(res.lead);
    } catch (err) {
      setError(err.message || "Could not save the lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal wide busy={saving} title={editing ? `Edit ${lead.leadId}` : "New lead"} onClose={onClose}>
      <Box component="form" onSubmit={submit}>
        <Box sx={FORM_GRID}>
          <TextField label="Business name" required value={form.businessName} onChange={set("businessName")} autoFocus />
          <TextField label="Contact person" value={form.contactPerson} onChange={set("contactPerson")} />
          <TextField label="Phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
          <TextField select label="Lead source" value={form.source} onChange={set("source")}>
            {options(SOURCES)}
          </TextField>
          <TextField label="Industry" value={form.industry} onChange={set("industry")} />
          <TextField
            select
            label="Required services"
            value={form.services}
            onChange={set("services")}
            sx={FULL}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((k) => (
                      <Chip key={k} size="small" label={SERVICE_LABELS[k] || k} />
                    ))}
                  </Box>
                ),
              },
            }}
          >
            {Object.entries(SERVICE_LABELS).map(([k, l]) => (
              <MenuItem key={k} value={k}>
                <Checkbox size="small" checked={form.services.includes(k)} sx={{ py: 0 }} />
                <ListItemText primary={l} />
              </MenuItem>
            ))}
          </TextField>
          {canAssign && (
            <TextField select label="Sales owner" value={form.owner} onChange={set("owner")} sx={FULL} helperText={form.owner ? " " : "Defaults to you"}>
              {owners.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.username}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Section>Qualification</Section>
          <TextField select label="Lead temperature" value={form.temperature} onChange={set("temperature")}>
            {options(TEMPERATURES)}
          </TextField>
          <TextField select label="Lead stage" value={form.stage} onChange={set("stage")}>
            {options(STAGES)}
          </TextField>
          {form.temperature === "not-qualified" && (
            <TextField label="Why not qualified?" required value={form.disqualifyReason} onChange={set("disqualifyReason")} sx={FULL} />
          )}
          {form.stage === "lost" && (
            <TextField select label="Lost reason" required value={form.lostReason} onChange={set("lostReason")} sx={FULL}>
              {options(LOST_REASONS)}
            </TextField>
          )}
          <TextField select label="Budget" value={form.budgetType} onChange={set("budgetType")}>
            {options(BUDGET_TYPES)}
          </TextField>
          <TextField
            label="Budget amount (₹)"
            type="number"
            value={form.budgetAmount}
            onChange={set("budgetAmount")}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          <TextField
            label="Proposal value (₹)"
            type="number"
            value={form.proposalValue}
            onChange={set("proposalValue")}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          <TextField select label="Interest level" value={form.interest} onChange={set("interest")}>
            <MenuItem value="">—</MenuItem>
            {options(INTEREST_LEVELS)}
          </TextField>

          <Section>Follow-up</Section>
          <TextField type="date" label="Last contact" value={form.lastContactAt} onChange={set("lastContactAt")} slotProps={DATE_LABEL} />
          <TextField
            type="date"
            label="Next follow-up"
            value={form.nextFollowUpAt}
            onChange={set("nextFollowUpAt")}
            slotProps={DATE_LABEL}
            helperText="Leave blank to follow the cadence"
          />
          <TextField type="datetime-local" label="Meeting" value={form.meetingAt} onChange={set("meetingAt")} slotProps={DATE_LABEL} />
          <TextField label="Next action" value={form.nextAction} onChange={set("nextAction")} />

          <Section>Handover</Section>
          <TextField label="Current marketing" value={form.currentMarketing} onChange={set("currentMarketing")} />
          <TextField label="Decision maker" value={form.decisionMaker} onChange={set("decisionMaker")} />
          <TextField label="Main problem" multiline minRows={2} value={form.mainProblem} onChange={set("mainProblem")} sx={FULL} />
          <FormControlLabel
            sx={FULL}
            control={<Switch checked={form.doNotContact} onChange={(e) => setForm({ ...form, doNotContact: e.target.checked })} />}
            label="Do not contact (stops follow-ups)"
          />
          {error && (
            <Alert severity="error" sx={FULL}>
              {error}
            </Alert>
          )}
        </Box>
        <DialogActions sx={{ px: 0, pt: 3, pb: 0 }}>
          <Button color="inherit" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Create lead"}
          </Button>
        </DialogActions>
      </Box>
    </Modal>
  );
}
