const mongoose = require("mongoose");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const toId = (id) => new mongoose.Types.ObjectId(String(id));

// Personal clients belong to whoever manages them; nobody else sees them,
// not even the super admin.
const hiddenClientIds = (req) =>
  Client.distinct("_id", { personal: true, managedBy: { $ne: toId(req.admin.id) } });

// Invoices the signed-in user may see.
// Admin/team: bills they raised, plus every bill for a client they manage.
// Super admin: everyone's, or one person's via ?billedBy=<id>|me.
// Everyone: never bills for another person's personal client.
// Uses ObjectIds so it also works inside aggregate $match (no auto-casting there),
// and nests under $and so callers can still add their own $or.
const invoiceScope = async (req) => {
  const me = toId(req.admin.id);
  const conditions = [];

  const hidden = await hiddenClientIds(req);
  if (hidden.length) conditions.push({ client: { $nin: hidden } });

  if (req.admin?.role === "super") {
    const by = req.query?.billedBy;
    if (by === "me") conditions.push({ billedBy: me });
    else if (by && mongoose.isValidObjectId(by)) conditions.push({ billedBy: toId(by) });
  } else {
    const managed = await Client.distinct("_id", { managedBy: me });
    conditions.push({ $or: [{ billedBy: me }, { client: { $in: managed } }] });
  }

  return conditions.length ? { $and: conditions } : {};
};

const isScoped = (scope) => Object.keys(scope).length > 0;

// Wallet entries the signed-in user may see: everything except payments
// received on another person's personal clients.
const ledgerScope = async (req) => {
  const hidden = await hiddenClientIds(req);
  if (!hidden.length) return {};
  const invoices = await Invoice.distinct("_id", { client: { $in: hidden } });
  const payments = await Payment.distinct("_id", { invoice: { $in: invoices } });
  return payments.length ? { $nor: [{ refType: "payment", refId: { $in: payments } }] } : {};
};

// Clients the signed-in user may see: shared clients plus their own personal ones.
const clientScope = (req) => ({
  $or: [{ personal: { $ne: true } }, { managedBy: toId(req.admin.id) }],
});

// Clients the signed-in user may edit or delete.
// Super admin: any client they can see. Others: ones they manage, or unassigned.
const clientEditScope = (req) =>
  req.admin?.role === "super"
    ? clientScope(req)
    : { $and: [clientScope(req), { $or: [{ managedBy: toId(req.admin.id) }, { managedBy: null }] }] };

module.exports = { invoiceScope, isScoped, ledgerScope, clientScope, clientEditScope };
