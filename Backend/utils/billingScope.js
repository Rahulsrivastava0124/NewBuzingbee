const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

const toId = (id) => new mongoose.Types.ObjectId(String(id));

const isSuper = (req) => req.admin?.role === "super";
const superAdminIds = () => Admin.distinct("_id", { role: "super" });

// Clients hidden from the signed-in user:
// - another person's personal clients (hidden from everyone, super admin included)
// - for admin/team: every client the super admin manages
const hiddenClientIds = async (req) => {
  const hide = [{ personal: true, managedBy: { $ne: toId(req.admin.id) } }];
  if (!isSuper(req)) hide.push({ managedBy: { $in: await superAdminIds() } });
  return Client.distinct("_id", { $or: hide });
};

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
// received on another person's personal clients.
const ledgerScope = async (req) => {
  const hidden = await hiddenClientIds(req);
  if (!hidden.length) return {};
  const invoices = await Invoice.distinct("_id", { client: { $in: hidden } });
  const payments = await Payment.distinct("_id", { invoice: { $in: invoices } });
  return payments.length ? { $nor: [{ refType: "payment", refId: { $in: payments } }] } : {};
};

// Clients the signed-in user may see: shared clients plus their own personal ones,
// minus (for admin/team) the super admin's clients.
const clientScope = async (req) => {
  const visible = { $or: [{ personal: { $ne: true } }, { managedBy: toId(req.admin.id) }] };
  if (isSuper(req)) return visible;
  return { $and: [visible, { managedBy: { $nin: await superAdminIds() } }] };
};

// Clients the signed-in user may edit or delete.
// Super admin: any client they can see. Others: ones they manage, or unassigned.
const clientEditScope = async (req) =>
  isSuper(req)
    ? clientScope(req)
    : {
        $and: [
          await clientScope(req),
          { $or: [{ managedBy: toId(req.admin.id) }, { managedBy: null }] },
        ],
      };

module.exports = { invoiceScope, isScoped, ledgerScope, clientScope, clientEditScope };
