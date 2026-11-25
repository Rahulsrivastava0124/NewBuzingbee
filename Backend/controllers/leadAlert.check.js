// Run: node controllers/leadAlert.check.js  (no database or network needed)
// WhatsApp lead alert: goes to the admins serving the enquiry's service (once per
// number), verified enquiries become one CRM lead, uses 4 template variables, falls back to the super admin, flattens visitor text, off without a WID.
process.env.AUTHKEY_API_KEY = "test-key";
const assert = require("assert");
const Admin = require("../models/Admin");
const mailService = require("../services/mailService");
const mails = [];
mailService.sendMail = async (m) => mails.push(m);
const { sendLeadAlert, templateValues } = require("../services/leadAlert");

const admins = [
  new Admin({ username: "team", email: "team@buzingbee.com", role: "super", phone: "+91 95079 81942", services: [] }),
  new Admin({ username: "web1", email: "w1@x.com", role: "admin", phone: "9876543210", services: ["web-development"] }),
  new Admin({ username: "web2", email: "w2@x.com", role: "admin", phone: "09876543210", services: ["web-development", "seo"] }),
  new Admin({ username: "seo", email: "s@x.com", role: "admin", phone: "+91 91234 56789", services: ["seo"] }),
];
Admin.find = () => ({ select: async () => admins });

let sent = [];
global.fetch = async (url) => {
  sent.push(new URL(url).searchParams);
  return { ok: true, text: async () => "Submitted Successfully" };
};

const enquiry = {
  site: "buzingbee",
  name: "Asha\nRoy",
  phone: "+91 99999 88888",
  email: "asha@x.com",
  service: "web-development",
  budget: "10k-25k",
  message: "Need   a site\r\n\twith shop",
};

(async () => {
  // Default WID is the "website leads" template
  delete process.env.AUTHKEY_LEAD_ALERT_WID;
  assert.strictEqual(await sendLeadAlert(enquiry), 1);
  assert.strictEqual(sent[0].get("wid"), "55801");
  sent = [];

  process.env.AUTHKEY_LEAD_ALERT_WID = "60001";

  // Web enquiry: both web admins share a number, so one message
  assert.strictEqual(await sendLeadAlert(enquiry), 1);
  assert.strictEqual(sent[0].get("mobile"), "9876543210");
  assert.strictEqual(sent[0].get("wid"), "60001");
  assert.strictEqual(sent[0].get("1"), "Web Development (BuzingBee)");
  assert.strictEqual(sent[0].get("2"), "Asha Roy");
  assert.strictEqual(sent[0].get("3"), "+91 99999 88888, asha@x.com");
  assert.strictEqual(sent[0].get("4"), "₹10,000 - ₹25,000");
  assert.strictEqual(sent[0].get("5"), null);

  // SEO: two different numbers
  sent = [];
  assert.strictEqual(await sendLeadAlert({ ...enquiry, service: "seo" }), 2);
  assert.deepStrictEqual(sent.map((p) => p.get("mobile")).sort(), ["9123456789", "9876543210"]);

  // Nobody serves it / "other" / blank: super admin
  for (const service of ["branding", "other", ""]) {
    sent = [];
    assert.strictEqual(await sendLeadAlert({ ...enquiry, service }), 1);
    assert.strictEqual(sent[0].get("mobile"), "9507981942");
  }

  // Empty values become "-" (WhatsApp rejects empty variables); long text is cut
  const v = templateValues({ ...enquiry, name: " ", budget: "", phone: "", email: "y".repeat(300) });
  assert.strictEqual(v.length, 4);
  assert.strictEqual(v[1], "-");
  assert.strictEqual(v[3], "Not specified");
  assert.strictEqual(v[2].length, 140);

  // A failed send does not throw
  global.fetch = async () => ({ ok: true, text: async () => "Invalid wid" });
  assert.strictEqual(await sendLeadAlert(enquiry), 0);

  // Verified enquiry: team alerted once, on the verify that flips it to verified
  const OtpCode = require("../models/OtpCode");
  const Enquiry = require("../models/Enquiry");
  const { issueEnquiryToken, hashCode } = require("../utils/whatsappOtp");
  const { verifyOtp } = require("./otpController");
  global.fetch = async (url) => {
    sent.push(new URL(url).searchParams);
    return { ok: true, text: async () => "Submitted Successfully" };
  };
  const Settings = require("../models/Settings");
  Settings.findOne = () => ({ select: () => ({ lean: async () => ({ company: { email: "team@buzingbee.com" } }) }) });
  // CRM: no DB, leads kept in memory
  const Lead = require("../models/Lead");
  const Counter = require("../models/Counter");
  const leads = [];
  Counter.findOneAndUpdate = async () => ({ seq: 42 });
  Lead.findOne = async (q) => leads.find((l) => String(l.enquiry) === String(q.enquiry)) || null;
  Lead.countDocuments = async (q) => leads.filter((l) => String(l.owner) === String(q.owner)).length;
  Lead.prototype.save = async function () { leads.push(this); return this; };
  Admin.find = (q) => (q && q.services
    ? { select: async () => admins.filter((a) => a.services.includes(q.services)) }
    : { select: async () => admins });
  let verified = false;
  Enquiry.findByIdAndUpdate = async () => {
    const was = verified;
    verified = true;
    return { ...enquiry, _id: "64b000000000000000000001", phoneVerified: was };
  };
  const tryVerify = async () => {
    OtpCode.findOne = () => ({ sort: async () => ({ codeHash: hashCode("9999988888", "123456"), attempts: 0, expiresAt: new Date(Date.now() + 60000) }) });
    OtpCode.deleteMany = async () => {};
    const res = { status: (c) => ((res.code = c), res), json: (b) => ((res.body = b), res) };
    await verifyOtp({ body: { enquiryToken: issueEnquiryToken("64b000000000000000000001", "9999988888"), code: "123456" } }, res);
    await new Promise((r) => setTimeout(r, 20));
    return res;
  };
  sent = [];
  assert.strictEqual((await tryVerify()).code, 200);
  assert.strictEqual(sent.length, 1, "WhatsApp alert on verify");
  assert.ok(mails.some((m) => m.to === "team@buzingbee.com"), "team email on verify");
  // Verified enquiry became one CRM lead, owned by a web admin
  assert.strictEqual(leads.length, 1);
  assert.strictEqual(leads[0].leadId, "BB042");
  assert.strictEqual(leads[0].source, "website");
  assert.deepStrictEqual([...leads[0].services], ["web-development"]);
  assert.strictEqual(leads[0].budget.amount, 25000);
  assert.ok(["web1", "web2"].includes(admins.find((a) => String(a._id) === String(leads[0].owner))?.username));
  const before = mails.length;
  assert.strictEqual((await tryVerify()).code, 200);
  assert.strictEqual(sent.length, 1, "no second WhatsApp alert");
  assert.strictEqual(mails.length, before, "no second email");
  assert.strictEqual(leads.length, 1, "no second lead");

  // Owner is whoever serving the service has the fewest open leads; nobody serving: unassigned
  const { createLeadFromEnquiry } = require("../services/enquiryToLead");
  const second = await createLeadFromEnquiry({ ...enquiry, _id: "64b000000000000000000002" });
  assert.notStrictEqual(String(second.owner), String(leads[0].owner));
  const unserved = await createLeadFromEnquiry({ ...enquiry, service: "branding", _id: "64b000000000000000000003" });
  assert.strictEqual(unserved.owner, null);
  const other = await createLeadFromEnquiry({ ...enquiry, service: "other", budget: "", _id: "64b000000000000000000004" });
  assert.deepStrictEqual([...other.services], ["other"]);
  assert.strictEqual(other.budget.type, "unknown");

  console.log("lead alert: all checks passed");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
