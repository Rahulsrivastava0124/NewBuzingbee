// Turns a phone-verified website enquiry into a CRM lead automatically.
// Owner: the admin serving the enquiry's service who has the fewest open leads;
// when nobody serves it, the lead stays unassigned for a manager to pick up.
const Lead = require("../models/Lead");
const Admin = require("../models/Admin");
const { nextSequence } = require("../models/Counter");
const { SERVICE_LABELS } = require("./leadAlert");

// Website budget ranges, as the most the visitor said they would spend
const BUDGET_AMOUNTS = {
  "below-5k": 5000,
  "5k-10k": 10000,
  "10k-25k": 25000,
  "25k-50k": 50000,
  "50k-1l": 100000,
  "above-1l": 100000,
};

const pickOwner = async (service) => {
  if (!service || !Admin.SERVICES.includes(service)) return null;
  const serving = await Admin.find({ services: service }).select("_id");
  if (serving.length === 0) return null;
  const counts = await Promise.all(
    serving.map((a) => Lead.countDocuments({ owner: a._id, dealStatus: "open" })),
  );
  let best = 0;
  counts.forEach((c, i) => {
    if (c < counts[best]) best = i;
  });
  return serving[best]._id;
};

// Returns the lead (existing or new); never creates two leads for one enquiry
const createLeadFromEnquiry = async (enquiry) => {
  const existing = await Lead.findOne({ enquiry: enquiry._id });
  if (existing) return existing;

  const service = Admin.SERVICES.includes(enquiry.service) ? enquiry.service : "";
  const amount = BUDGET_AMOUNTS[enquiry.budget] ?? null;
  const serviceLabel = SERVICE_LABELS[enquiry.service] || enquiry.service || "not specified";

  const lead = new Lead({
    businessName: enquiry.name,
    contactPerson: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    source: "website",
    services: service ? [service] : enquiry.service ? ["other"] : [],
    temperature: "warm",
    budget: amount ? { type: "estimated", amount } : { type: "unknown", amount: null },
    mainProblem: String(enquiry.message || "").slice(0, 2000),
    owner: await pickOwner(service),
    enquiry: enquiry._id,
  });
  lead.activities.push({
    type: "note",
    note: `Website enquiry for ${serviceLabel}; WhatsApp number verified. Created automatically.`,
    byName: "Website",
  });
  await lead.validate(); // reject before using up a lead number
  lead.leadId = `BB${String(await nextSequence("lead")).padStart(3, "0")}`;
  await lead.save();
  return lead;
};

module.exports = { createLeadFromEnquiry, pickOwner };
