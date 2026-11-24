import { SERVICE_LABELS } from "../../services/api";
import { money } from "../finance/format";

export const SOURCES = { "hunter-x": "Hunter X", website: "Website", referral: "Referral", other: "Other" };
export const TEMPERATURES = { hot: "Hot", warm: "Warm", cold: "Cold", "not-qualified": "Not qualified" };
export const TEMPERATURE_COLORS = { hot: "error", warm: "warning", cold: "info", "not-qualified": "default" };
export const STAGES = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  "meeting-booked": "Meeting booked",
  "proposal-sent": "Proposal sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};
export const DEAL_STATUSES = { open: "Open", won: "Won", lost: "Lost" };
export const DEAL_COLORS = { open: "default", won: "success", lost: "error" };
export const BUDGET_TYPES = { disclosed: "Disclosed", estimated: "Estimated", unknown: "Unknown" };
export const LOST_REASONS = { budget: "Budget", "no-response": "No response", competitor: "Competitor", other: "Other" };
export const INTEREST_LEVELS = { high: "High", medium: "Medium", low: "Low" };
export const ACTIVITY_TYPES = {
  call: "Call attempt",
  message: "Message (WhatsApp/SMS)",
  email: "Email",
  conversation: "Conversation (spoke with them)",
  meeting: "Meeting",
  note: "Note",
};

// <input type="datetime-local"> value in local time
export const toInputDateTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

const budgetText = (b) => {
  if (!b || b.type === "unknown" || !b.type) return b?.amount ? money(b.amount) : "Unknown";
  return `${b.amount ? money(b.amount) : "—"} (${BUDGET_TYPES[b.type].toLowerCase()})`;
};

// The summary Anshu sends Ritik once a lead is ready for a discovery call
export const handoverText = (l) =>
  [
    "LEAD HANDOVER – BUZINGBEE",
    "",
    `Business Name: ${l.businessName}`,
    `Contact Person: ${[l.contactPerson, l.phone, l.email].filter(Boolean).join(" · ") || "—"}`,
    `Industry: ${l.industry || "—"}`,
    `Lead Source: ${SOURCES[l.source] || l.source}`,
    `Required Service: ${(l.services || []).map((s) => SERVICE_LABELS[s] || s).join(", ") || "—"}`,
    `Current Marketing: ${l.currentMarketing || "—"}`,
    `Main Problem: ${l.mainProblem || "—"}`,
    `Budget: ${budgetText(l.budget)}`,
    `Decision Maker: ${l.decisionMaker || "—"}`,
    `Interest: ${INTEREST_LEVELS[l.interest] || "—"}`,
    `Meeting: ${l.meetingAt ? fmtDateTime(l.meetingAt) : "Not booked"}`,
    `Next Action: ${l.nextAction || "—"}`,
  ].join("\n");

