import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Plus, RefreshCw, Target } from "lucide-react";
import { adminAPI, leadAPI } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { PageHeader, SearchField } from "../../components/common";
import DataTable from "../../components/DataTable";
import { dueLabel, fmtDate, money } from "../finance/format";
import LeadForm from "./LeadForm";
import { DEAL_COLORS, DEAL_STATUSES, SOURCES, STAGES, TEMPERATURES, TEMPERATURE_COLORS } from "./labels";

const TARGET_ROWS = [
  ["prospects", "New prospects researched"],
  ["outreach", "First outreach attempts"],
  ["conversations", "Meaningful conversations"],
  ["qualified", "Qualified leads"],
  ["meetings", "Meetings booked"],
  ["proposals", "Proposals sent", "2–4"],
  ["followUps", "Follow-ups due completed", "100%"],
];

function WeeklyTargets({ owner }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    leadAPI
      .weekly({ owner })
      .then(setData)
      .catch(() => setData(null));
  }, [owner]);
  if (!data) return null;
  const { week, targets } = data;
  return (
    <Paper sx={{ p: 2.5, mb: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <Target size={18} />
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          This week's targets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          since {fmtDate(week.from)}
        </Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {TARGET_ROWS.map(([key, label, goalText]) => {
          const value = week[key];
          const goal = targets[key];
          const pct = Math.min(100, goal ? (value / goal) * 100 : 0);
          const isPct = key === "followUps";
          return (
            <Box key={key}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isPct ? `${value}%` : value} / {goalText || goal}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={pct}
                color={pct >= 100 ? "success" : "primary"}
                sx={{ height: 6, borderRadius: 1 }}
              />
              {isPct && (
                <Typography variant="caption" color="text.secondary">
                  {week.followUpsDone} done · {week.followUpsOverdue} overdue
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

const filterSelect = (label, value, onChange, labels, extra) => (
  <TextField select size="small" fullWidth={false} label={label} value={value} onChange={(e) => onChange(e.target.value)} sx={{ flex: { xs: "1 1 calc(50% - 6px)", sm: "1 1 135px" }, maxWidth: { sm: 170 } }}>
    <MenuItem value="">All</MenuItem>
    {extra}
    {Object.entries(labels).map(([v, l]) => (
      <MenuItem key={v} value={v}>
        {l}
      </MenuItem>
    ))}
  </TextField>
);

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useFeedback();
  const [me, setMe] = useState(null);
  const [owners, setOwners] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [filters, setFilters] = useState({ temperature: "", stage: "", owner: "", dealStatus: "" });
  // Prefilled lead from "Convert to lead" on the Enquiries page
  const [creating, setCreating] = useState(location.state?.prefill || null);
  const isManager = me?.role === "super" || me?.role === "admin";

  useEffect(() => {
    adminAPI
      .getProfile()
      .then((res) => setMe(res?.admin || null))
      .catch(() => {});
    adminAPI
      .listUsers()
      .then(setOwners)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadAPI.getAll({ ...filters, followUp: view === "due" ? "due" : "" });
      setLeads(res.leads || []);
    } catch (err) {
      notify(err.message || "Could not load leads", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, view, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.leadId, l.businessName, l.contactPerson, l.phone, l.email, l.industry].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [leads, search]);

  const setFilter = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <Box>
      <PageHeader
        title="Leads"
        subtitle={isManager ? "Every lead in the pipeline" : "Leads assigned to you"}
        actions={
          <>
            <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreating({})}>
              New lead
            </Button>
          </>
        }
      />

      <WeeklyTargets owner={filters.owner} />

      <DataTable
        rows={rows}
        loading={loading}
        minWidth={1000}
        onRowClick={(l) => navigate(`/dashboard/crm/leads/${l._id}`)}
        empty={{ icon: <Target />, title: view === "due" ? "No follow-ups due" : "No leads", text: view === "due" ? "You're all caught up." : "Add one with the New lead button." }}
        toolbar={
          // One wrapping row; gap (not Stack spacing) so wrapped lines start flush left
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search leads..."
              sx={{ flex: { xs: "1 1 100%", sm: "1 1 200px" }, maxWidth: { sm: 300 } }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, v) => v && setView(v)}
              sx={{ height: 40, "& .MuiToggleButton-root": { px: 1.5, whiteSpace: "nowrap" } }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="due">Follow-ups due</ToggleButton>
            </ToggleButtonGroup>
            {filterSelect("Temperature", filters.temperature, setFilter("temperature"), TEMPERATURES)}
            {filterSelect("Stage", filters.stage, setFilter("stage"), STAGES)}
            {filterSelect("Deal", filters.dealStatus, setFilter("dealStatus"), DEAL_STATUSES)}
            {isManager &&
              filterSelect(
                "Owner",
                filters.owner,
                setFilter("owner"),
                Object.fromEntries(owners.map((u) => [u._id, u.username])),
              )}
          </Box>
        }
        columns={[
          {
            key: "businessName",
            label: "Lead",
            mobile: "title",
            value: (l) => l.businessName,
            render: (l) => (
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }} noWrap>
                  {l.businessName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {l.leadId}
                  {l.contactPerson ? ` · ${l.contactPerson}` : ""} · {SOURCES[l.source]}
                </Typography>
              </Box>
            ),
          },
          {
            key: "temperature",
            label: "Temperature",
            mobile: "subtitle",
            value: (l) => Object.keys(TEMPERATURES).indexOf(l.temperature),
            render: (l) => <Chip size="small" label={TEMPERATURES[l.temperature]} color={TEMPERATURE_COLORS[l.temperature]} />,
          },
          { key: "stage", label: "Stage", value: (l) => Object.keys(STAGES).indexOf(l.stage), render: (l) => STAGES[l.stage] },
          { key: "owner", label: "Owner", value: (l) => l.owner?.username || "" },
          {
            key: "nextFollowUpAt",
            label: "Next follow-up",
            value: (l) => (l.nextFollowUpAt ? new Date(l.nextFollowUpAt).getTime() : null),
            render: (l) => {
              if (l.doNotContact) return <Chip size="small" label="Do not contact" />;
              if (!l.nextFollowUpAt) return "—";
              const label = dueLabel(l.nextFollowUpAt);
              const late = /overdue|today/.test(label);
              return (
                <Box>
                  <Typography variant="body2">{fmtDate(l.nextFollowUpAt)}</Typography>
                  <Typography variant="caption" color={late ? "error.main" : "text.secondary"}>
                    {label}
                  </Typography>
                </Box>
              );
            },
          },
          {
            key: "proposalValue",
            label: "Proposal",
            align: "right",
            value: (l) => l.proposalValue ?? null,
            render: (l) => (l.proposalValue != null ? money(l.proposalValue) : "—"),
          },
          {
            key: "dealStatus",
            label: "Deal",
            render: (l) => <Chip size="small" label={DEAL_STATUSES[l.dealStatus]} color={DEAL_COLORS[l.dealStatus]} variant="outlined" />,
            value: (l) => l.dealStatus,
          },
        ]}
      />

      {creating && (
        <LeadForm
          lead={creating}
          owners={owners}
          canAssign={isManager}
          onClose={() => {
            setCreating(null);
            navigate(location.pathname, { replace: true, state: null });
          }}
          onSaved={(lead) => {
            notify(`Lead ${lead.leadId} created`, "success");
            navigate(`/dashboard/crm/leads/${lead._id}`);
          }}
        />
      )}
    </Box>
  );
}
