// Run: node controllers/adminSecurity.check.js  (no database needed)
// Fixes from the security audit: the super email can't move or be claimed via
// Settings; only super/admin change loans and manual wallet entries; a password
// change ends older sessions; no plain-text password fallback; personal-client
// payments stay out of the company wallet; new enquiries alert the team safely.
const assert = require("assert");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Payment = require("../models/Payment");
const LedgerEntry = require("../models/LedgerEntry");
const { getJwtSecret } = require("../config");
const { updateAdminProfile, adminLogin } = require("./adminController");
const { protectAdmin, forgetAdmin } = require("../middleware/authMiddleware");
const { syncClientPayments } = require("../utils/paymentLedger");
const { buildTeamAlert } = require("./enquiryController");
const financeRouter = require("../routes/financeRoutes");

const fakeRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

let current;
Admin.findById = () => ({ select: async () => current });
Admin.findOne = async () => null; // no clashes
let saved = false;
Admin.prototype.save = async function () {
  saved = true;
  return this;
};

const profile = async (doc, body) => {
  current = doc;
  saved = false;
  const res = fakeRes();
  await updateAdminProfile({ admin: { id: String(doc._id) }, body }, res);
  return res;
};

(async () => {
  const boss = new Admin({ username: "boss", email: Admin.SUPER_EMAIL, password: "x".repeat(8), role: "super" });
  const anshu = new Admin({ username: "anshu", email: "anshu@buzingbee.com", password: "x".repeat(8), role: "team" });

  let res = await profile(boss, { email: "elsewhere@buzingbee.com" });
  assert.strictEqual(res.statusCode, 400, "super can't move off the pinned email");
  res = await profile(anshu, { email: Admin.SUPER_EMAIL.toUpperCase() });
  assert.strictEqual(res.statusCode, 400, "nobody can claim the super email");
  assert.strictEqual(saved, false);
  res = await profile(anshu, { email: "not-an-email" });
  assert.strictEqual(res.statusCode, 400);
  res = await profile(anshu, { username: "bad name!" });
  assert.strictEqual(res.statusCode, 400);
  res = await profile(anshu, { email: "anshu.new@buzingbee.com" });
  assert.strictEqual(res.statusCode, 200, "ordinary email change still works");
  assert.strictEqual(anshu.role, "team");

  // Every loan/manual-wallet write route runs a role check that refuses team members
  const writes = financeRouter.stack.filter(
    (l) => l.route && /^\/(loans|wallet)/.test(l.route.path) && !l.route.methods.get,
  );
  assert.strictEqual(writes.length, 7);
  for (const layer of writes) {
    const guard = layer.route.stack[0].handle;
    for (const [role, allowed] of [["team", false], ["admin", true], ["super", true]]) {
      const res = fakeRes();
      let passed = false;
      guard({ admin: { role } }, res, () => (passed = true));
      assert.strictEqual(passed, allowed, `${role} on ${layer.route.path}`);
    }
  }

  // A password change ends sessions signed in before it; newer ones still work
  const sessionUser = new Admin({ username: "rk", email: "rk@buzingbee.com", password: "x".repeat(8), role: "admin" });
  const auth = async (token) => {
    const res = fakeRes();
    let passed = false;
    await protectAdmin({ headers: { authorization: `Bearer ${token}` } }, res, () => (passed = true));
    return passed;
  };
  const tokenAt = (secondsAgo) =>
    jwt.sign({ id: sessionUser._id, iat: Math.floor(Date.now() / 1000) - secondsAgo }, getJwtSecret());
  current = sessionUser;
  assert.strictEqual(await auth(tokenAt(3600)), true, "no password change yet");
  sessionUser.passwordChangedAt = new Date(Date.now() - 60 * 1000);
  forgetAdmin(sessionUser._id);
  assert.strictEqual(await auth(tokenAt(3600)), false, "older session is ended");
  assert.strictEqual(await auth(tokenAt(0)), true, "session after the change works");
  // The model stamps it whenever an existing user's password changes
  const existing = new Admin({ username: "a1", email: "a1@x.com", password: "x".repeat(8) });
  existing.isNew = false;
  existing.password = "y".repeat(8);
  await existing.validate();
  await Admin.schema.s.hooks.execPre("save", existing);
  assert.ok(existing.passwordChangedAt && existing.passwordChangedAt <= new Date());

  // Sending the stored value itself as the password no longer signs in
  const stored = new Admin({ username: "old", email: "old@x.com", password: "plain-legacy" });
  Admin.findOne = async () => stored;
  const loginRes = fakeRes();
  await adminLogin({ body: { username: "old", password: stored.password }, headers: {} }, loginRes);
  assert.strictEqual(loginRes.statusCode, 401);
  Admin.findOne = async () => null;

  // Personal-client payments leave the company wallet; company clients' payments are credited
  const company = new Client({ name: "Acme", personal: false });
  const personalClient = new Client({ name: "Friend", personal: true });
  const pay = { _id: new Payment()._id, amount: 500, paidAt: new Date(), invoice: { number: "INV-2026-0001" } };
  const lean = (v) => ({ select: () => ({ lean: async () => v }), populate: () => ({ lean: async () => v }) });
  let removed = null;
  const upserted = [];
  Payment.find = () => lean([pay]);
  LedgerEntry.deleteMany = async (q) => (removed = q);
  LedgerEntry.findOneAndUpdate = async (q, doc) => upserted.push(doc);
  Client.findById = () => lean(personalClient.toObject());
  await syncClientPayments(personalClient._id);
  assert.deepStrictEqual(removed.refId.$in, [pay._id]);
  assert.strictEqual(upserted.length, 0);
  Client.findById = () => lean(company.toObject());
  await syncClientPayments(company._id);
  assert.strictEqual(upserted[0].type, "credit");
  assert.strictEqual(upserted[0].description, "Payment for INV-2026-0001 from Acme");

  // Team alert escapes the visitor's text and keeps the subject on one line
  const alert = buildTeamAlert({
    site: "buzingbee",
    name: "Eve\r\nBcc: x@y.com",
    email: "eve@example.com",
    message: "<script>alert(1)</script>",
  });
  assert.ok(!/[\r\n]/.test(alert.subject));
  assert.ok(alert.html.includes("&lt;script&gt;") && !alert.html.includes("<script>"));
  assert.strictEqual(alert.replyTo, "eve@example.com");

  console.log("admin security: all checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
