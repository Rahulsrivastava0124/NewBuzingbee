// Run: node utils/billingScope.check.js
const assert = require("assert");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const me = "6accce58a1c5368f1a629acd";
const other = "6accce58a1c5368f1a629ace";
const managedClient = "6accce58a1c5368f1a629acf";
const someoneElsesPersonal = "6accce58a1c5368f1a629ad0";
const hiddenInvoice = "6accce58a1c5368f1a629ad1";
const hiddenPayment = "6accce58a1c5368f1a629ad2";
const superId = "6accce58a1c5368f1a629ad3";

// No database needed: I manage one client; another person has one personal client.
// The hidden-clients query ($or) returns that personal client, plus a fake id for the
// super admin's clients when they're hidden too.
const superClient = "6accce58a1c5368f1a629ad4";
let lastHiddenQuery;
Client.distinct = async (_field, q) => {
  if (!q.$or) return [managedClient];
  lastHiddenQuery = q;
  return q.$or.length > 1 ? [someoneElsesPersonal, superClient] : [someoneElsesPersonal];
};
Admin.distinct = async () => [superId];
Invoice.distinct = async () => [hiddenInvoice];
Payment.distinct = async () => [hiddenPayment];

const { invoiceScope, ledgerScope, clientScope, clientEditScope } = require("./billingScope");
const req = (role, billedBy) => ({ admin: { id: me, role }, query: billedBy ? { billedBy } : {} });
const ids = (arr) => arr.map(String);

(async () => {
  // Admin/team: never another person's personal client; own bills + managed clients;
  // ?billedBy can't widen it
  for (const role of ["admin", "team", undefined]) {
    for (const asked of [undefined, other]) {
      const [notHidden, mine] = (await invoiceScope(req(role, asked))).$and;
      // ...and never a client the super admin manages
      assert.deepStrictEqual(ids(notHidden.client.$nin), [someoneElsesPersonal, superClient]);
      assert.deepStrictEqual(ids(lastHiddenQuery.$or[1].managedBy.$in), [superId]);
      assert.strictEqual(String(mine.$or[0].billedBy), me);
      assert.deepStrictEqual(ids(mine.$or[1].client.$in), [managedClient]);
    }
  }

  // Super: everyone's bills except other people's personal clients
  const superAll = (await invoiceScope(req("super"))).$and;
  assert.strictEqual(superAll.length, 1);
  assert.deepStrictEqual(ids(superAll[0].client.$nin), [someoneElsesPersonal]);
  const superOne = (await invoiceScope(req("super", other))).$and;
  assert.strictEqual(String(superOne[1].billedBy), other);
  assert.strictEqual(String((await invoiceScope(req("super", "me"))).$and[1].billedBy), me);
  assert.strictEqual((await invoiceScope(req("super", "not-an-id"))).$and.length, 1);

  // Wallet: payments on another person's personal client are left out, for super too
  for (const role of ["super", "admin"]) {
    const ls = await ledgerScope(req(role));
    assert.strictEqual(ls.$nor[0].refType, "payment");
    assert.deepStrictEqual(ids(ls.$nor[0].refId.$in), [hiddenPayment]);
  }

  // Clients: everyone (super included) sees shared clients + their own personal ones;
  // admin/team additionally never see the super admin's clients
  const superScope = await clientScope(req("super"));
  assert.deepStrictEqual(superScope.$or[0], { personal: { $ne: true } });
  assert.strictEqual(String(superScope.$or[1].managedBy), me);
  for (const role of ["admin", "team"]) {
    const [shared, notSuper] = (await clientScope(req(role))).$and;
    assert.deepStrictEqual(shared, superScope);
    assert.deepStrictEqual(ids(notSuper.managedBy.$nin), [superId]);
  }
  // Editing: super edits anything visible; others only their own or unassigned
  assert.deepStrictEqual(await clientEditScope(req("super")), superScope);
  const [visible, editable] = (await clientEditScope(req("admin"))).$and;
  assert.deepStrictEqual(visible, await clientScope(req("admin")));
  assert.strictEqual(String(editable.$or[0].managedBy), me);
  assert.deepStrictEqual(editable.$or[1], { managedBy: null });

  console.log("billingScope: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
