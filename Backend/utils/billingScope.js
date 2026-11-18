const mongoose = require("mongoose");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const toId = (id) => new mongoose.Types.ObjectId(String(id));

const isSuper = (req) => req.admin?.role === "super";

// Clients the signed-in user may see:
// - everyone: never another person's personal client (super admin included)
// - admin/team: only clients they added or manage
const clientScope = (req) => {
  const me = toId(req.admin.id);
  const notOthersPersonal = { $or: [{ personal: { $ne: true } }, { managedBy: me }] };
  if (isSuper(req)) return notOthersPersonal;
  return { $and: [notOthersPersonal, { $or: [{ createdBy: me }, { managedBy: me }] }] };
};

// Everything outside clientScope, so invoices and payments follow the same rule
const hiddenClientIds = (req) => Client.distinct("_id", { $nor: [clientScope(req)] });

// Invoices the signed-in user may see.
// Admin/team: bills they raised, plus every bill for a client they manage.
// Super admin: everyone's, or one person's via ?billedBy=<id>|me.
// Everyone: never bills for a client outside their clientScope.
// Uses ObjectIds so it also works inside aggregate $match (no auto-casting there),
// and nests under $and so callers can still add their own $or.
const invoiceScope = async (req) => {
  const me = toId(req.admin.id);
  const conditions = [];

  const hidden = await hiddenClientIds(req);
  if (hidden.length) conditions.push({ client: { $nin: hidden } });

  if (isSuper(req)) {
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
// received on clients outside their clientScope.
const ledgerScope = async (req) => {
  const hidden = await hiddenClientIds(req);
  if (!hidden.length) return {};
  const invoices = await Invoice.distinct("_id", { client: { $in: hidden } });
  const payments = await Payment.distinct("_id", { invoice: { $in: invoices } });
  return payments.length ? { $nor: [{ refType: "payment", refId: { $in: payments } }] } : {};
};

// Clients the signed-in user may edit or delete: any client they can see
const clientEditScope = clientScope;

module.exports = { invoiceScope, isScoped, ledgerScope, clientScope, clientEditScope };
