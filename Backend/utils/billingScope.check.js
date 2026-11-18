// Run: node utils/billingScope.check.js
const assert = require("assert");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const me = "6accce58a1c5368f1a629acd";
const other = "6accce58a1c5368f1a629ace";
const managedClient = "6accce58a1c5368f1a629acf";
const hiddenClient = "6accce58a1c5368f1a629ad0";
const hiddenInvoice = "6accce58a1c5368f1a629ad1";
const hiddenPayment = "6accce58a1c5368f1a629ad2";

// No database needed: I manage one client; the "hidden clients" query ($nor) returns one other
let lastHiddenQuery;
Client.distinct = async (_field, q) => {
  if (!q.$nor) return [managedClient];
  lastHiddenQuery = q;
  return [hiddenClient];
};
Invoice.distinct = async () => [hiddenInvoice];
Payment.distinct = async () => [hiddenPayment];

const { invoiceScope, ledgerScope, clientScope, clientEditScope } = require("./billingScope");
const req = (role, billedBy) => ({ admin: { id: me, role }, query: billedBy ? { billedBy } : {} });
const ids = (arr) => arr.map(String);

// Evaluates a clientScope filter against a plain client (enough for the operators it uses)
const matches = (q, doc) =>
  Object.entries(q).every(([k, v]) => {
    if (k === "$and") return v.every((x) => matches(x, doc));
    if (k === "$or") return v.some((x) => matches(x, doc));
    if (k === "$nor") return !v.some((x) => matches(x, doc));
    const val = doc[k] == null ? null : String(doc[k]);
    if (v && typeof v === "object" && "$ne" in v) return val !== (v.$ne == null ? null : String(v.$ne));
    return val === (v == null ? null : String(v));
  });

(async () => {
  // Clients: admin/team see only what they added or manage, never someone else's personal client
  const client = (c) => ({ personal: false, createdBy: null, managedBy: null, ...c });
  const cases = [
    // [client, admin/team sees, super sees]
    [client({ createdBy: me }), true, true],
    [client({ managedBy: me }), true, true],
    [client({ createdBy: me, managedBy: other }), true, true],
    [client({ createdBy: other, managedBy: other }), false, true], // e.g. AmbitionPharma
    [client({}), false, true], // older client with no creator or manager
    [client({ personal: true, managedBy: me }), true, true],
    [client({ personal: true, createdBy: me, managedBy: other }), false, false],
    [client({ personal: true, managedBy: other }), false, false],
  ];
  for (const [doc, adminSees, superSees] of cases) {
    for (const role of ["admin", "team"]) {
      assert.strictEqual(matches(clientScope(req(role)), doc), adminSees, JSON.stringify(doc));
    }
    assert.strictEqual(matches(clientScope(req("super")), doc), superSees, JSON.stringify(doc));
  }
  // Editing follows seeing
  assert.strictEqual(clientEditScope, clientScope);

  // Invoices: admin/team never see bills for hidden clients; own bills + managed clients;
  // ?billedBy can't widen it
  for (const role of ["admin", "team", undefined]) {
    for (const asked of [undefined, other]) {
      const [notHidden, mine] = (await invoiceScope(req(role, asked))).$and;
      assert.deepStrictEqual(lastHiddenQuery, { $nor: [clientScope(req(role))] });
      assert.deepStrictEqual(ids(notHidden.client.$nin), [hiddenClient]);
      assert.strictEqual(String(mine.$or[0].billedBy), me);
      assert.deepStrictEqual(ids(mine.$or[1].client.$in), [managedClient]);
    }
  }

  // Super: everyone's bills except hidden (other people's personal) clients
  const superAll = (await invoiceScope(req("super"))).$and;
  assert.strictEqual(superAll.length, 1);
  assert.deepStrictEqual(ids(superAll[0].client.$nin), [hiddenClient]);
  const superOne = (await invoiceScope(req("super", other))).$and;
  assert.strictEqual(String(superOne[1].billedBy), other);
  assert.strictEqual(String((await invoiceScope(req("super", "me"))).$and[1].billedBy), me);
  assert.strictEqual((await invoiceScope(req("super", "not-an-id"))).$and.length, 1);

  // Wallet: payments on hidden clients are left out, for super too
  for (const role of ["super", "admin"]) {
    const ls = await ledgerScope(req(role));
    assert.strictEqual(ls.$nor[0].refType, "payment");
    assert.deepStrictEqual(ids(ls.$nor[0].refId.$in), [hiddenPayment]);
  }

  console.log("billingScope: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
