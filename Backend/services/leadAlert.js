// Team alerts for a new website enquiry: an email to the company address and a
// WhatsApp message to the admins who serve the requested service. Sent only once
// the visitor's phone is verified (sites without phone verification: on submit).
//
// WhatsApp goes to the admins who serve the requested service (Admin.services). When nobody serves it (or the visitor picked
// "Other" / nothing) it goes to the super admin instead.
//
// Approved authkey.io template (AUTHKEY_LEAD_ALERT_WID), body variables in order:
//   {{1}} service (website)   {{2}} name   {{3}} phone, email   {{4}} budget
// The visitor's message is not sent; it is in the email alert and the admin panel.
const Admin = require("../models/Admin");
const Settings = require("../models/Settings");
const { sendMail } = require("./mailService");
const { normalizeIndianMobile, sendWhatsAppTemplate } = require("../utils/whatsappOtp");

const SERVICE_LABELS = {
  "web-development": "Web Development",
  "mobile-app": "Mobile App Development",
  "ai-ml": "AI & ML Development",
  seo: "SEO Optimization",
  "social-media": "Social Media Marketing",
  ppc: "Google & Meta Ads",
  "email-marketing": "Email Marketing",
  branding: "Brand Identity & Logo",
  ecommerce: "E-Commerce Solutions",
  other: "Other",
};

const BUDGET_LABELS = {
  "below-5k": "Below ₹5,000",
  "5k-10k": "₹5,000 - ₹10,000",
  "10k-25k": "₹10,000 - ₹25,000",
  "25k-50k": "₹25,000 - ₹50,000",
  "50k-1l": "₹50,000 - ₹1,00,000",
  "above-1l": "Above ₹1,00,000",
};

const SITE_LABELS = { buzingbee: "BuzingBee", hustlershive: "Hustlers Hive" };

// approved template "website leads"; AUTHKEY_LEAD_ALERT_WID overrides it
const leadAlertWid = () => process.env.AUTHKEY_LEAD_ALERT_WID || "55801";

// WhatsApp rejects template values with line breaks, tabs or long runs of spaces,
// and empty values; visitor text is flattened and shortened
const clean = (value, max = 60) => {
  const text = String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!text) return "-";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

// Meta allows only a few variables for a short template, so related fields share one
const templateValues = (e) => {
  const service = SERVICE_LABELS[e.service] || e.service || "Not specified";
  const site = SITE_LABELS[e.site] || e.site;
  return [
    clean(site ? `${service} (${site})` : service, 80),
    clean(e.name),
    clean([e.phone, e.email].filter(Boolean).join(", "), 140),
    clean(BUDGET_LABELS[e.budget] || e.budget || "Not specified"),
  ];
};

// Admins to alert: those serving the enquiry's service, else the super admin.
// Each WhatsApp number is alerted once, even if two accounts share it.
const findRecipients = async (service) => {
  const withPhone = await Admin.find({ phone: { $nin: ["", null] } }).select("username role phone services");
  let picked = service ? withPhone.filter((a) => (a.services || []).includes(service)) : [];
  if (picked.length === 0) picked = withPhone.filter((a) => a.role === "super");

  const phones = new Map();
  for (const admin of picked) {
    const phone = normalizeIndianMobile(admin.phone);
    if (phone && !phones.has(phone)) phones.set(phone, admin.username);
  }
  return [...phones].map(([phone, username]) => ({ phone, username }));
};

// Never throws; returns how many alerts went out
const sendLeadAlert = async (enquiry) => {
  const wid = leadAlertWid();
  if (!wid || !process.env.AUTHKEY_API_KEY) return 0;

  const recipients = await findRecipients(enquiry.service);
  const values = templateValues(enquiry);
  const results = await Promise.allSettled(recipients.map((r) => sendWhatsAppTemplate(r.phone, wid, values)));

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[lead-alert] WhatsApp to ${recipients[i].username} failed:`, r.reason?.message);
    }
  });
  return results.filter((r) => r.status === "fulfilled").length;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// Tells the team a lead came in, at the company email from Settings (or the super
// admin's address). The visitor's text only goes into the body, escaped.
const buildTeamAlert = (e) => {
  const rows = [
    ["Website", e.site],
    ["Name", e.name],
    ["Email", e.email],
    ["Phone", e.phone],
    ["Service", e.service],
    ["Budget", e.budget],
    ["Source", e.source],
  ].filter(([, v]) => v);
  return {
    subject: `New enquiry: ${e.name.replace(/[\r\n]+/g, " ").slice(0, 80)}${e.service ? ` (${e.service})` : ""}`,
    replyTo: e.email,
    text: [...rows.map(([k, v]) => `${k}: ${v}`), "", e.message, "", "Open Enquiries in the admin panel to follow up."].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a">
        <h2 style="margin:0 0 12px">New enquiry</h2>
        <table style="border-collapse:collapse">${rows
          .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
          .join("")}</table>
        <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:6px">${escapeHtml(e.message)}</p>
        <p style="color:#64748b;font-size:13px">Open Enquiries in the admin panel to follow up.</p>
      </div>`,
  };
};

const notifyTeam = async (enquiry) => {
  const settings = await Settings.findOne({ key: "main" }).select("company.email").lean();
  const to = settings?.company?.email || Admin.SUPER_EMAIL;
  await sendMail({ to, ...buildTeamAlert(enquiry) });
};

// Email + WhatsApp alert for a lead. Called once the visitor's phone is verified
// (or straight after submission on sites without phone verification). Never throws.
const alertTeam = (enquiry) => {
  notifyTeam(enquiry).catch((error) => {
    console.error("[enquiry] team alert email failed:", error.message);
  });
  sendLeadAlert(enquiry).catch((error) => {
    console.error("[enquiry] WhatsApp lead alert failed:", error.message);
  });
};

module.exports = { alertTeam, buildTeamAlert, sendLeadAlert, findRecipients, templateValues, SERVICE_LABELS };
