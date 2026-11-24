import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowLeft, ClipboardCopy, Pencil, Send, Trash2 } from "lucide-react";
import { SERVICE_LABELS, adminAPI, leadAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { LoadingState, PageHeader } from "../../components/common";
import { Modal } from "../finance/shared";
import { dueLabel, fmtDate, money } from "../finance/format";
import LeadForm from "./LeadForm";
import {
  ACTIVITY_TYPES,
  BUDGET_TYPES,
  DEAL_COLORS,
  DEAL_STATUSES,
  INTEREST_LEVELS,
  LOST_REASONS,
  SOURCES,
  STAGES,
  TEMPERATURES,
  TEMPERATURE_COLORS,
  fmtDateTime,
  handoverText,
  toInputDateTime,
} from "./labels";

function Field({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography component="div" sx={{ wordBreak: "break-word" }}>
        {children || "—"}
      </Typography>
    </Box>
  );
}

const GRID = { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 };
const newActivity = () => ({ type: "call", note: "", at: toInputDateTime(new Date()) });

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify, confirm } = useFeedback();
  const [lead, setLead] = useState(null);
  const [me, setMe] = useState(null);
  const [owners, setOwners] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [handover, setHandover] = useState(false);
  const [activity, setActivity] = useState(newActivity);
  const [logging, setLogging] = useState(false);
  const isManager = me?.role === "super" || me?.role === "admin";

  const load = useCallback(async () => {
    try {
      const res = await leadAPI.getById(id);
      setLead(res.lead);
    } catch (err) {
      setError(err.message || "Could not load the lead");
    }
  }, [id]);

  useEffect(() => {
    load();
    adminAPI
      .getProfile()
      .then((res) => setMe(res?.admin || null))
      .catch(() => {});
    adminAPI
      .listUsers()
      .then(setOwners)
      .catch(() => {});
  }, [load]);

  const logActivity = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await leadAPI.addActivity(id, { ...activity, at: activity.at ? new Date(activity.at).toISOString() : undefined });
      setLead(res.lead);
      setActivity(newActivity());
      notify("Activity logged", "success");
    } catch (err) {
      notify(err.message || "Could not log activity", "error");
    } finally {
      setLogging(false);
    }
  };

  const removeActivity = async (a) => {
    const ok = await confirm({ title: "Remove entry", message: "Remove this activity from the log?", confirmLabel: "Remove" });
    if (!ok) return;
    try {
      const res = await leadAPI.deleteActivity(id, a._id);
      setLead(res.lead);
    } catch (err) {
      notify(err.message || "Could not remove the entry", "error");
    }
  };

  const removeLead = async () => {
    const ok = await confirm({
      title: "Delete lead",
      message: `Delete ${lead.leadId} (${lead.businessName}) and its activity log? This cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await leadAPI.delete(id);
      notify("Lead deleted", "success");
      navigate("/dashboard/crm/leads");
    } catch (err) {
      notify(err.message || "Could not delete the lead", "error");
    }
  };

  const copyHandover = async () => {
    try {
      await navigator.clipboard.writeText(handoverText(lead));
      notify("Handover copied", "success");
    } catch {
      notify("Copy failed; select the text and copy it", "error");
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!lead) return <LoadingState text="Loading lead..." />;

  const followUp = lead.doNotContact
    ? "Do not contact"
    : lead.nextFollowUpAt
      ? `${fmtDate(lead.nextFollowUpAt)} (${dueLabel(lead.nextFollowUpAt)})`
      : "None (closed)";
  const activities = [...(lead.activities || [])].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <Box>
      <PageHeader
        title={lead.businessName}
        subtitle={`${lead.leadId} · ${SOURCES[lead.source]} · owned by ${lead.owner?.username || "—"}`}
        actions={
          <>
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={() => navigate("/dashboard/crm/leads")}>
              Leads
            </Button>
            <Button variant="outlined" startIcon={<Pencil size={16} />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="contained" startIcon={<Send size={16} />} onClick={() => setHandover(true)}>
              Handover to Ritik
            </Button>
            {isManager && (
              <Tooltip title="Delete lead">
                <IconButton color="error" aria-label="Delete lead" onClick={removeLead}>
                  <Trash2 />
                </IconButton>
              </Tooltip>
            )}
          </>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
              <Chip label={TEMPERATURES[lead.temperature]} color={TEMPERATURE_COLORS[lead.temperature]} />
              <Chip label={STAGES[lead.stage]} variant="outlined" />
              <Chip label={`Deal: ${DEAL_STATUSES[lead.dealStatus]}`} color={DEAL_COLORS[lead.dealStatus]} variant="outlined" />
              {lead.doNotContact && <Chip label="Do not contact" color="error" />}
            </Stack>
            <Box sx={GRID}>
              <Field label="Contact person">{lead.contactPerson}</Field>
              <Field label="Industry">{lead.industry}</Field>
              <Field label="Phone">{lead.phone && <Link href={`tel:${lead.phone}`}>{lead.phone}</Link>}</Field>
              <Field label="Email">{lead.email && <Link href={`mailto:${lead.email}`}>{lead.email}</Link>}</Field>
              <Field label="Required services">{(lead.services || []).map((s) => SERVICE_LABELS[s] || s).join(", ")}</Field>
              <Field label="Budget">
                {BUDGET_TYPES[lead.budget?.type] || "Unknown"}
                {lead.budget?.amount != null ? ` · ${money(lead.budget.amount)}` : ""}
              </Field>
              <Field label="Proposal value">{lead.proposalValue != null && money(lead.proposalValue)}</Field>
              <Field label="Meeting">{lead.meetingAt && fmtDateTime(lead.meetingAt)}</Field>
              <Field label="Last contact">{lead.lastContactAt && fmtDate(lead.lastContactAt)}</Field>
              <Field label="Next follow-up">{followUp}</Field>
              <Field label="Next action">{lead.nextAction}</Field>
              {lead.temperature === "not-qualified" && <Field label="Not qualified because">{lead.disqualifyReason}</Field>}
              {lead.stage === "lost" && <Field label="Lost reason">{LOST_REASONS[lead.lostReason]}</Field>}
            </Box>
            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Handover details
            </Typography>
            <Box sx={GRID}>
              <Field label="Current marketing">{lead.currentMarketing}</Field>
              <Field label="Decision maker">{lead.decisionMaker}</Field>
              <Field label="Interest">{INTEREST_LEVELS[lead.interest]}</Field>
              <Field label="Main problem">{lead.mainProblem}</Field>
            </Box>
          </Paper>
        </Stack>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontSize: 16, mb: 2 }}>
            Activity log
          </Typography>
          <Box component="form" onSubmit={logActivity} sx={{ display: "grid", gap: 1.5, mb: 2.5 }}>
            <Box sx={GRID}>
              <TextField select size="small" label="Type" value={activity.type} onChange={(e) => setActivity({ ...activity, type: e.target.value })}>
                {Object.entries(ACTIVITY_TYPES).map(([v, l]) => (
                  <MenuItem key={v} value={v}>
                    {l}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="datetime-local"
                label="When"
                value={activity.at}
                onChange={(e) => setActivity({ ...activity, at: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              size="small"
              label="Note"
              multiline
              minRows={2}
              value={activity.note}
              onChange={(e) => setActivity({ ...activity, note: e.target.value })}
              required={activity.type === "note"}
            />
            <Button type="submit" variant="contained" disabled={logging} sx={{ justifySelf: "start" }}>
              {logging ? "Saving..." : "Log activity"}
            </Button>
          </Box>
          {activities.length === 0 ? (
            <Typography color="text.secondary">Nothing logged yet.</Typography>
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {activities.map((a) => (
                <Stack key={a._id} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ACTIVITY_TYPES[a.type]}
                    </Typography>
                    {a.note && <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{a.note}</Typography>}
                    <Typography variant="caption" color="text.secondary">
                      {fmtDateTime(a.at)}
                      {a.byName ? ` · ${a.byName}` : ""}
                    </Typography>
                  </Box>
                  {(isManager || String(a.by) === String(me?._id || me?.id)) && (
                    <IconButton size="small" aria-label="Remove entry" onClick={() => removeActivity(a)}>
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {editing && (
        <LeadForm
          lead={lead}
          owners={owners}
          canAssign={isManager}
          onClose={() => setEditing(false)}
          onSaved={() => {
            notify("Lead updated", "success");
            setEditing(false);
            load();
          }}
        />
      )}

      {handover && (
        <Modal title="Lead handover" onClose={() => setHandover(false)}>
          <Box
            component="pre"
            sx={{ m: 0, p: 2, bgcolor: "action.hover", borderRadius: 1, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14 }}
          >
            {handoverText(lead)}
          </Box>
          <Stack direction="row" sx={{ justifyContent: "flex-end", pt: 2 }}>
            <Button variant="contained" startIcon={<ClipboardCopy size={16} />} onClick={copyHandover}>
              Copy
            </Button>
          </Stack>
        </Modal>
      )}
    </Box>
  );
}
