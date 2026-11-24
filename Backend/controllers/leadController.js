const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Admin = require("../models/Admin");
const Enquiry = require("../models/Enquiry");
const { nextSequence } = require("../models/Counter");

const fail = (res, message, error) => {
  // Schema checks (enum, required, custom reasons) are the caller's mistake
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    const first = Object.values(error.errors || {})[0];
    return res.status(400).json({ success: false, message: first?.message || error.message });
  }
  return res.status(500).json({ success: false, message, error: error?.message });
};
const bad = (res, message) => res.status(400).json({ success: false, message });
const notFound = (res) => res.status(404).json({ success: false, message: "Lead not found" });

const isManager = (req) => req.admin.role === "super" || req.admin.role === "admin";
// Team members only ever see the leads assigned to them
const scope = (req) => (isManager(req) ? {} : { owner: req.admin.id });

const TEXT_FIELDS = [
  "businessName",
  "contactPerson",
  "phone",
  "email",
  "source",
  "industry",
  "temperature",
  "disqualifyReason",
  "stage",
  "lostReason",
  "nextAction",
  "currentMarketing",
  "mainProblem",
  "decisionMaker",
  "interest",
];
const DATE_FIELDS = ["lastContactAt", "nextFollowUpAt", "meetingAt"];

const applyFields = (lead, body) => {
  TEXT_FIELDS.forEach((k) => {
    if (body[k] !== undefined) lead[k] = body[k] == null ? "" : String(body[k]);
  });
  DATE_FIELDS.forEach((k) => {
    if (body[k] !== undefined) lead[k] = body[k] || null;
  });
  if (body.services !== undefined) lead.services = Array.isArray(body.services) ? body.services : [];
  if (body.proposalValue !== undefined) {
    lead.proposalValue = body.proposalValue === "" || body.proposalValue == null ? null : Number(body.proposalValue);
  }
  if (body.budget !== undefined) {
    const { type, amount } = body.budget || {};
    lead.budget = {
      type: type || "unknown",
      amount: amount === "" || amount == null ? null : Number(amount),
    };
  }
  if (body.doNotContact !== undefined) lead.doNotContact = Boolean(body.doNotContact);
};

// Managers may assign anyone; team members always own what they create
const resolveOwner = async (req, requested) => {
  if (!isManager(req) || !requested) return req.admin.id;
  if (!mongoose.isValidObjectId(requested) || !(await Admin.exists({ _id: requested }))) return null;
  return requested;
};

const findScoped = (req) =>
  mongoose.isValidObjectId(req.params.id) ? Lead.findOne({ _id: req.params.id, ...scope(req) }) : null;

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const getLeads = async (req, res) => {
  try {
    const { temperature, stage, owner, dealStatus, followUp } = req.query;
    const query = { ...scope(req) };
    if (temperature) query.temperature = temperature;
    if (stage) query.stage = stage;
    if (dealStatus) query.dealStatus = dealStatus;
    if (owner && isManager(req) && mongoose.isValidObjectId(owner)) query.owner = owner;
    if (followUp === "due") query.nextFollowUpAt = { $ne: null, $lte: endOfToday() };
    const leads = await Lead.find(query)
      .select("-activities")
      .populate("owner", "username")
      .sort({ createdAt: -1 });
    return res.json({ success: true, leads });
  } catch (error) {
    return fail(res, "Failed to fetch leads", error);
  }
};

const getLead = async (req, res) => {
  try {
    const lead = await findScoped(req)?.populate("owner", "username email phone");
    if (!lead) return notFound(res);
    return res.json({ success: true, lead });
  } catch (error) {
    return fail(res, "Failed to fetch lead", error);
  }
};

const createLead = async (req, res) => {
  try {
    const body = req.body || {};
    if (!String(body.businessName || "").trim()) return bad(res, "Enter the business name");
    const owner = await resolveOwner(req, body.owner);
    if (!owner) return bad(res, "Choose a valid sales owner");

    let enquiry = null;
    if (body.enquiry) {
      if (!mongoose.isValidObjectId(body.enquiry) || !(await Enquiry.exists({ _id: body.enquiry }))) {
        return bad(res, "Enquiry not found");
      }
      const existing = await Lead.findOne({ enquiry: body.enquiry }).select("leadId");
      if (existing) return bad(res, `This enquiry is already lead ${existing.leadId}`);
      enquiry = body.enquiry;
    }

    const lead = new Lead({ owner, enquiry, createdBy: req.admin.id });
    applyFields(lead, body);
    await lead.validate(); // reject before using up a lead number
    lead.leadId = `BB${String(await nextSequence("lead")).padStart(3, "0")}`;
    await lead.save();
    return res.status(201).json({ success: true, lead });
  } catch (error) {
    return fail(res, "Failed to create lead", error);
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await findScoped(req);
    if (!lead) return notFound(res);
    const body = req.body || {};
    if (body.businessName !== undefined && !String(body.businessName).trim()) {
      return bad(res, "Enter the business name");
    }
    if (body.owner !== undefined && String(body.owner) !== String(lead.owner)) {
      if (!isManager(req)) return res.status(403).json({ success: false, message: "Only admins can reassign leads" });
      const owner = await resolveOwner(req, body.owner);
      if (!owner) return bad(res, "Choose a valid sales owner");
      lead.owner = owner;
    }
    applyFields(lead, body);
    await lead.save();
    return res.json({ success: true, lead });
  } catch (error) {
    return fail(res, "Failed to update lead", error);
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = mongoose.isValidObjectId(req.params.id) ? await Lead.findByIdAndDelete(req.params.id) : null;
    if (!lead) return notFound(res);
    return res.json({ success: true, message: "Lead deleted" });
  } catch (error) {
    return fail(res, "Failed to delete lead", error);
  }
};

const addActivity = async (req, res) => {
  try {
    const lead = await findScoped(req);
    if (!lead) return notFound(res);
    const { type, note, at } = req.body || {};
    if (!Lead.ACTIVITY_TYPES.includes(type)) return bad(res, "Choose what kind of activity this was");
    if (at && Number.isNaN(new Date(at).getTime())) return bad(res, "Invalid date");
    if (type === "note" && !String(note || "").trim()) return bad(res, "Write the note");
    lead.logActivity({ type, note, at, by: req.admin.id, byName: req.admin.username });
    await lead.save();
    await lead.populate("owner", "username email phone");
    return res.status(201).json({ success: true, lead });
  } catch (error) {
    return fail(res, "Failed to log activity", error);
  }
};

const deleteActivity = async (req, res) => {
  try {
    const lead = await findScoped(req);
    if (!lead) return notFound(res);
    const activity = lead.activities.id(req.params.activityId);
    if (!activity) return res.status(404).json({ success: false, message: "Activity not found" });
    // Only the person who logged it (or a manager) can remove it
    if (!isManager(req) && String(activity.by) !== req.admin.id) {
      return res.status(403).json({ success: false, message: "You can only remove your own entries" });
    }
    activity.deleteOne();
    await lead.save();
    await lead.populate("owner", "username email phone");
    return res.json({ success: true, lead });
  } catch (error) {
    return fail(res, "Failed to remove activity", error);
  }
};

// Monday 00:00 of the current week
const startOfWeek = (now = new Date()) => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

// Weekly benchmarks the sales team works to
const TARGETS = {
  prospects: 50,
  outreach: 40,
  conversations: 15,
  qualified: 8,
  meetings: 4,
  proposals: 2,
  followUps: 100,
};

// ponytail: counts in memory over the scoped leads; move to an aggregation if leads reach tens of thousands
const weeklyNumbers = (leads, now = new Date()) => {
  const from = startOfWeek(now);
  const inWeek = (d) => d && new Date(d) >= from && new Date(d) <= now;
  const count = (fn) => leads.filter(fn).length;
  const activities = leads.flatMap((l) => l.activities || []).filter((a) => inWeek(a.at));
  const contactsDone = activities.filter((a) => Lead.CONTACT_TYPES.includes(a.type)).length;
  // Due earlier than today and still not done (today's are not late yet)
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const overdue = count((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) < today && !Lead.isClosed(l));
  return {
    from,
    prospects: count((l) => inWeek(l.createdAt)),
    outreach: count((l) => inWeek(l.firstContactAt)),
    conversations: activities.filter((a) => a.type === "conversation").length,
    qualified: count((l) => inWeek(l.qualifiedAt)),
    meetings: count((l) => inWeek(l.meetingBookedAt)),
    proposals: count((l) => inWeek(l.proposalSentAt)),
    // Follow-ups done this week vs. those still overdue right now
    followUps: contactsDone + overdue ? Math.round((contactsDone / (contactsDone + overdue)) * 100) : 100,
    followUpsDone: contactsDone,
    followUpsOverdue: overdue,
  };
};

const getWeeklyStats = async (req, res) => {
  try {
    const query = { ...scope(req) };
    if (req.query.owner && isManager(req) && mongoose.isValidObjectId(req.query.owner)) query.owner = req.query.owner;
    const leads = await Lead.find(query)
      .select("createdAt firstContactAt qualifiedAt meetingBookedAt proposalSentAt nextFollowUpAt stage temperature doNotContact activities.type activities.at")
      .lean();
    return res.json({ success: true, week: weeklyNumbers(leads), targets: TARGETS });
  } catch (error) {
    return fail(res, "Failed to load weekly numbers", error);
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addActivity,
  deleteActivity,
  getWeeklyStats,
  weeklyNumbers,
  startOfWeek,
};
