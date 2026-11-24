// Run: node controllers/leadController.check.js  (no database needed)
const assert = require("assert");
const Lead = require("../models/Lead");
const Admin = require("../models/Admin");
const Counter = require("../models/Counter");
const ctrl = require("./leadController");

const DAY = 86400000;
const ownerId = "64b000000000000000000001";
const otherId = "64b000000000000000000002";
const team = { admin: { id: ownerId, role: "team", username: "anshu" } };
const boss = { admin: { id: otherId, role: "super", username: "rahul" } };

const fakeRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const call = async (fn, req) => {
  const res = fakeRes();
  await fn({ params: {}, query: {}, body: {}, ...req }, res);
  return res;
};

// Stub the database: saves are no-ops, queries return what each test sets up
const saved = [];
Lead.prototype.save = async function () {
  await this.validate();
  saved.push(this);
  return this;
};
Lead.prototype.populate = async function () {
  return this;
};
Counter.findOneAndUpdate = async () => ({ seq: 7 });
Admin.exists = async ({ _id }) => [ownerId, otherId].includes(String(_id));
let lastQuery;
let found = null;
Lead.findOne = (q) => {
  lastQuery = q;
  const p = Promise.resolve(found);
  p.populate = () => p;
  p.select = () => p;
  return p;
};

(async () => {
  // Cadence: Day 0 due now, then Day 1, 3, 6, 12, then nurture
  const t0 = new Date("2026-11-02T10:00:00Z");
  const lead = new Lead({ businessName: "Acme", owner: ownerId });
  await lead.validate();
  assert.ok(lead.nextFollowUpAt, "new lead has a follow-up due");
  for (const days of [1, 3, 6, 12]) {
    lead.logActivity({ type: "call", at: new Date(t0.getTime() + (lead.contactAttempts ? days * DAY : 0)) });
    if (lead.contactAttempts === 1) assert.strictEqual(lead.stage, "contacted");
    assert.strictEqual(lead.nextFollowUpAt.getTime(), t0.getTime() + days * DAY);
  }
  lead.logActivity({ type: "message", at: new Date(t0.getTime() + 12 * DAY) });
  assert.strictEqual(lead.nextFollowUpAt.getTime(), t0.getTime() + 42 * DAY, "nurture after the cadence");
  lead.logActivity({ type: "note", note: "x" });
  assert.strictEqual(lead.contactAttempts, 5, "notes are not contacts");

  // Closed leads stop follow-ups
  lead.doNotContact = true;
  await lead.validate();
  assert.strictEqual(lead.nextFollowUpAt, null);
  lead.doNotContact = false;
  await lead.validate();
  assert.ok(lead.nextFollowUpAt, "reopened lead gets a follow-up again");

  // Not qualified needs a reason; lost needs a reason; deal status follows stage
  const nq = new Lead({ businessName: "B", temperature: "not-qualified" });
  await assert.rejects(nq.validate(), /reason/);
  const won = new Lead({ businessName: "C", stage: "won" });
  await won.validate();
  assert.strictEqual(won.dealStatus, "won");
  assert.ok(won.qualifiedAt && won.meetingBookedAt && won.proposalSentAt);
  await assert.rejects(new Lead({ businessName: "D", stage: "lost" }).validate(), /lost/);

  // Create: validation, ID format, team member always owns their lead
  let res = await call(ctrl.createLead, { ...team, body: { businessName: " " } });
  assert.strictEqual(res.statusCode, 400);
  res = await call(ctrl.createLead, { ...team, body: { businessName: "Acme", owner: otherId, temperature: "hot" } });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.lead.leadId, "BB007");
  assert.strictEqual(String(res.body.lead.owner), ownerId);
  res = await call(ctrl.createLead, { ...boss, body: { businessName: "Acme", owner: ownerId } });
  assert.strictEqual(String(res.body.lead.owner), ownerId, "managers can assign");
  res = await call(ctrl.createLead, { ...boss, body: { businessName: "Acme", owner: "64b0000000000000000000ff" } });
  assert.strictEqual(res.statusCode, 400, "unknown owner rejected");
  res = await call(ctrl.createLead, { ...team, body: { businessName: "Acme", temperature: "nope" } });
  assert.strictEqual(res.statusCode, 400, "bad enum is a 400");

  // Team members are scoped to their own leads and cannot reassign
  found = null;
  res = await call(ctrl.updateLead, { ...team, params: { id: otherId }, body: { stage: "won" } });
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(lastQuery.owner, ownerId);
  found = new Lead({ businessName: "Mine", owner: ownerId });
  res = await call(ctrl.updateLead, { ...team, params: { id: otherId }, body: { owner: otherId } });
  assert.strictEqual(res.statusCode, 403);
  res = await call(ctrl.updateLead, { ...boss, params: { id: otherId }, body: { owner: otherId } });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(lastQuery.owner, undefined, "managers see all leads");

  // Activities
  found = new Lead({ businessName: "Mine", owner: ownerId });
  res = await call(ctrl.addActivity, { ...team, params: { id: otherId }, body: { type: "dance" } });
  assert.strictEqual(res.statusCode, 400);
  res = await call(ctrl.addActivity, { ...team, params: { id: otherId }, body: { type: "conversation", note: "Spoke" } });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.lead.activities[0].byName, "anshu");

  // Weekly numbers
  const now = new Date("2026-11-25T12:00:00");
  assert.strictEqual(ctrl.startOfWeek(now).getDay(), 1, "weeks start Monday");
  const wk = ctrl.weeklyNumbers(
    [
      { createdAt: now, firstContactAt: now, qualifiedAt: now, activities: [{ type: "conversation", at: now }, { type: "call", at: now }] },
      { createdAt: new Date("2026-11-01"), nextFollowUpAt: new Date("2026-11-20"), stage: "contacted", activities: [] },
    ],
    now,
  );
  assert.deepStrictEqual(
    [wk.prospects, wk.outreach, wk.conversations, wk.qualified, wk.followUpsDone, wk.followUpsOverdue, wk.followUps],
    [1, 1, 1, 1, 2, 1, 67],
  );

  console.log("leads: all checks passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
