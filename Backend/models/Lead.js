const mongoose = require("mongoose");
const { SERVICES } = require("./Admin");

const SOURCES = ["hunter-x", "website", "referral", "other"];
const TEMPERATURES = ["hot", "warm", "cold", "not-qualified"];
const STAGES = [
  "new",
  "contacted",
  "qualified",
  "meeting-booked",
  "proposal-sent",
  "negotiation",
  "won",
  "lost",
];
const BUDGET_TYPES = ["disclosed", "estimated", "unknown"];
const LOST_REASONS = ["budget", "no-response", "competitor", "other"];
const INTEREST_LEVELS = ["high", "medium", "low"];
// "conversation" = actually spoke with them (counts toward meaningful conversations);
// call/message/email are outreach attempts
const ACTIVITY_TYPES = ["call", "message", "email", "conversation", "meeting", "note"];
const CONTACT_TYPES = ["call", "message", "email", "conversation", "meeting"];

// Follow-up cadence, in days after the first contact: Day 1 second attempt,
// Day 3 value follow-up, Day 5–7 call/message, Day 10–14 final active follow-up
const CADENCE_DAYS = [1, 3, 6, 12];
const NURTURE_DAYS = 30;
const DAY_MS = 86400000;

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ACTIVITY_TYPES, required: true },
  note: { type: String, trim: true, default: "" },
  at: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  byName: { type: String, default: "" },
});

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true },
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    source: { type: String, enum: SOURCES, default: "other" },
    industry: { type: String, trim: true, default: "" },
    services: { type: [{ type: String, enum: [...SERVICES, "other"] }], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },

    temperature: { type: String, enum: TEMPERATURES, default: "cold", index: true },
    disqualifyReason: { type: String, trim: true, default: "" },
    stage: { type: String, enum: STAGES, default: "new", index: true },
    budget: {
      type: { type: String, enum: BUDGET_TYPES, default: "unknown" },
      amount: { type: Number, min: 0, default: null },
    },

    firstContactAt: { type: Date, default: null },
    lastContactAt: { type: Date, default: null },
    contactAttempts: { type: Number, default: 0 },
    nextFollowUpAt: { type: Date, default: null, index: true },
    meetingAt: { type: Date, default: null },
    proposalValue: { type: Number, min: 0, default: null },
    // Follows the stage: won/lost close the deal, everything else is open
    dealStatus: { type: String, enum: ["open", "won", "lost"], default: "open", index: true },
    lostReason: { type: String, enum: [...LOST_REASONS, ""], default: "" },
    nextAction: { type: String, trim: true, default: "" },

    // Handover to the closer
    currentMarketing: { type: String, trim: true, default: "" },
    mainProblem: { type: String, trim: true, default: "" },
    decisionMaker: { type: String, trim: true, default: "" },
    interest: { type: String, enum: [...INTEREST_LEVELS, ""], default: "" },
    doNotContact: { type: Boolean, default: false },

    // First time the lead reached these stages (weekly targets count them)
    qualifiedAt: { type: Date, default: null },
    meetingBookedAt: { type: Date, default: null },
    proposalSentAt: { type: Date, default: null },

    enquiry: { type: mongoose.Schema.Types.ObjectId, ref: "Enquiry", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    activities: { type: [activitySchema], default: [] },
  },
  { timestamps: true },
);

// Further along the pipeline than `stage`? (won counts as past every open stage)
const reached = (stage, target) =>
  stage !== "lost" && STAGES.indexOf(stage) >= STAGES.indexOf(target);

const isClosed = (lead) =>
  lead.doNotContact ||
  lead.temperature === "not-qualified" ||
  lead.stage === "won" ||
  lead.stage === "lost";

// Next follow-up from the cadence, or null once the lead needs no more chasing.
// Day 0 (no contact yet) is due straight away.
const suggestFollowUp = (lead, now = new Date()) => {
  if (isClosed(lead)) return null;
  if (!lead.firstContactAt || !lead.contactAttempts) return now;
  const offset = CADENCE_DAYS[lead.contactAttempts - 1];
  if (offset !== undefined) return new Date(new Date(lead.firstContactAt).getTime() + offset * DAY_MS);
  return new Date(new Date(lead.lastContactAt || now).getTime() + NURTURE_DAYS * DAY_MS);
};

leadSchema.pre("validate", function () {
  if (this.temperature === "not-qualified" && !this.disqualifyReason) {
    this.invalidate("disqualifyReason", "Give a reason for marking the lead not qualified");
  }
  if (this.stage === "lost" && !this.lostReason) {
    this.invalidate("lostReason", "Choose why the deal was lost");
  }
  this.dealStatus = this.stage === "won" || this.stage === "lost" ? this.stage : "open";

  const now = new Date();
  if (!this.qualifiedAt && reached(this.stage, "qualified")) this.qualifiedAt = now;
  if (!this.meetingBookedAt && reached(this.stage, "meeting-booked")) this.meetingBookedAt = now;
  if (!this.proposalSentAt && reached(this.stage, "proposal-sent")) this.proposalSentAt = now;
  // Open leads always have a next follow-up; closed ones never do
  if (isClosed(this)) this.nextFollowUpAt = null;
  else if (!this.nextFollowUpAt) this.nextFollowUpAt = suggestFollowUp(this, now);
});

// Records a contact (call, message, meeting...) and moves the follow-up along the cadence
leadSchema.methods.logActivity = function ({ type, note, at, by, byName }) {
  const when = at ? new Date(at) : new Date();
  this.activities.push({ type, note, at: when, by, byName });
  if (!CONTACT_TYPES.includes(type)) return;
  if (!this.firstContactAt) this.firstContactAt = when;
  if (!this.lastContactAt || when > this.lastContactAt) this.lastContactAt = when;
  this.contactAttempts += 1;
  if (this.stage === "new") this.stage = "contacted";
  this.nextFollowUpAt = suggestFollowUp(this, when);
};

module.exports = mongoose.model("Lead", leadSchema);
Object.assign(module.exports, {
  SOURCES,
  TEMPERATURES,
  STAGES,
  BUDGET_TYPES,
  LOST_REASONS,
  INTEREST_LEVELS,
  ACTIVITY_TYPES,
  CONTACT_TYPES,
  CADENCE_DAYS,
  suggestFollowUp,
  isClosed,
});
