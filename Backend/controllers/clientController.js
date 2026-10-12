const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Admin = require("../models/Admin");
const mongoose = require("mongoose");
const { invoiceScope, clientScope, clientEditScope } = require("../utils/billingScope");

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: error?.message });

const FIELDS = ["name", "company", "email", "phone", "address", "gstin", "notes"];

const pick = (body) => {
  const out = {};
  FIELDS.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });
  if (body.managedBy !== undefined) out.managedBy = body.managedBy || null;
  if (body.personal !== undefined) out.personal = body.personal === true;
  return out;
};

// A personal client needs an owner; default it to whoever is saving it
const ownPersonal = (data, req) => {
  if (data.personal && !data.managedBy) data.managedBy = req.admin.id;
  return data;
};

const MANAGER_FIELDS = "username email";

// Returns an error message when the chosen manager is not a real admin account
const validateManager = async (managedBy) => {
  if (!managedBy) return null;
  if (!mongoose.isValidObjectId(managedBy)) return "Choose a valid team member";
  const exists = await Admin.exists({ _id: managedBy });
  return exists ? null : "That team member no longer exists";
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getClients = async (req, res) => {
  try {
    const { search, managedBy } = req.query;
    const query = { $and: [clientScope(req)] };
    // managedBy: a team member id, "me", or "none" for unassigned clients
    if (managedBy === "none") query.managedBy = null;
    else if (managedBy === "me") query.managedBy = req.admin?.id;
    else if (managedBy && mongoose.isValidObjectId(managedBy)) {
      query.managedBy = managedBy;
    }
    if (search) {
      const rx = new RegExp(escapeRegex(String(search)), "i");
      query.$and.push({ $or: [{ name: rx }, { company: rx }, { email: rx }] });
    }
    const clients = await Client.find(query)
      .populate("managedBy", MANAGER_FIELDS)
      .sort({ createdAt: -1 });

    // Attach billing totals per client (only bills the viewer can see)
    const scope = await invoiceScope(req);
    const totals = await Invoice.aggregate([
      { $match: { ...scope, status: { $nin: ["cancelled", "draft"] } } },
      {
        $group: {
          _id: "$client",
          invoiced: { $sum: "$total" },
          paid: { $sum: "$amountPaid" },
          invoices: { $sum: 1 },
        },
      },
    ]);
    const byClient = new Map(totals.map((t) => [String(t._id), t]));

    // Earliest unpaid due date per client (drives the "Next due" column)
    const dues = await Invoice.aggregate([
      {
        $match: {
          ...scope,
          status: { $nin: ["cancelled", "draft"] },
          $expr: { $gt: ["$total", "$amountPaid"] },
        },
      },
      { $sort: { dueDate: 1 } },
      {
        $group: {
          _id: "$client",
          dueDate: { $first: "$dueDate" },
          invoiceId: { $first: "$_id" },
          number: { $first: "$number" },
          amount: { $first: { $subtract: ["$total", "$amountPaid"] } },
          overdueCount: {
            $sum: { $cond: [{ $lt: ["$dueDate", new Date()] }, 1, 0] },
          },
        },
      },
    ]);
    const dueByClient = new Map(dues.map((d) => [String(d._id), d]));
    const data = clients.map((c) => {
      const t = byClient.get(String(c._id));
      const invoiced = t?.invoiced || 0;
      const paid = t?.paid || 0;
      return {
        ...c.toObject(),
        invoiced,
        paid,
        outstanding: Math.max(invoiced - paid, 0),
        invoiceCount: t?.invoices || 0,
        nextDue: dueByClient.has(String(c._id))
          ? {
              invoiceId: dueByClient.get(String(c._id)).invoiceId,
              number: dueByClient.get(String(c._id)).number,
              dueDate: dueByClient.get(String(c._id)).dueDate,
              amount: dueByClient.get(String(c._id)).amount,
              overdueCount: dueByClient.get(String(c._id)).overdueCount,
            }
          : null,
      };
    });

    return res.json({ success: true, total: data.length, clients: data });
  } catch (error) {
    return fail(res, "Failed to fetch clients", error);
  }
};

const createClient = async (req, res) => {
  try {
    const data = ownPersonal(pick(req.body), req);
    if (!data.name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Client name is required" });
    }
    const managerError = await validateManager(data.managedBy);
    if (managerError) {
      return res.status(400).json({ success: false, message: managerError });
    }
    const created = await Client.create(data);
    const client = await created.populate("managedBy", MANAGER_FIELDS);
    return res.status(201).json({ success: true, client });
  } catch (error) {
    return fail(res, "Failed to create client", error);
  }
};

const updateClient = async (req, res) => {
  try {
    const data = ownPersonal(pick(req.body), req);
    const managerError = await validateManager(data.managedBy);
    if (managerError) {
      return res.status(400).json({ success: false, message: managerError });
    }
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, ...clientEditScope(req) },
      data,
      { new: true, runValidators: true },
    ).populate("managedBy", MANAGER_FIELDS);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    return res.json({ success: true, client });
  } catch (error) {
    return fail(res, "Failed to update client", error);
  }
};

const deleteClient = async (req, res) => {
  try {
    const invoices = await Invoice.countDocuments({ client: req.params.id });
    if (invoices > 0) {
      return res.status(409).json({
        success: false,
        message: "Client has invoices. Delete them first.",
      });
    }
    const client = await Client.findOneAndDelete({ _id: req.params.id, ...clientEditScope(req) });
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    return res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    return fail(res, "Failed to delete client", error);
  }
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Statement of account: every invoice is a debit, every payment a credit.
const getClientLedger = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, ...clientScope(req) }).populate(
      "managedBy",
      MANAGER_FIELDS,
    );
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    const invoices = await Invoice.find({
      ...(await invoiceScope(req)),
      client: client._id,
      status: { $nin: ["draft", "cancelled"] },
    }).sort({ issueDate: 1, createdAt: 1 });
    const invoiceIds = invoices.map((i) => i._id);
    const numberById = new Map(invoices.map((i) => [String(i._id), i.number]));
    const payments = await Payment.find({ invoice: { $in: invoiceIds } }).sort({
      paidAt: 1,
      createdAt: 1,
    });

    const rows = [
      ...invoices.map((inv) => ({
        date: inv.issueDate,
        type: "invoice",
        ref: inv.number,
        invoiceId: inv._id,
        description: `Invoice ${inv.number}`,
        dueDate: inv.dueDate,
        debit: inv.total,
        credit: 0,
        order: 0,
      })),
      ...payments.map((p) => ({
        date: p.paidAt,
        type: "payment",
        ref: numberById.get(String(p.invoice)) || "",
        invoiceId: p.invoice,
        paymentId: p._id,
        description: `Payment against ${numberById.get(String(p.invoice)) || "invoice"}`,
        method: p.method,
        reference: p.reference,
        debit: 0,
        credit: p.amount,
        order: 1,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date) || a.order - b.order);

    let balance = 0;
    const entries = rows.map(({ order, ...row }) => {
      balance = round2(balance + row.debit - row.credit);
      return { ...row, balance };
    });

    const invoiced = round2(invoices.reduce((s, i) => s + i.total, 0));
    const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
    const open = invoices
      .filter((i) => i.total > i.amountPaid)
      .sort((a, b) => a.dueDate - b.dueDate);
    const next = open[0];
    const now = new Date();

    return res.json({
      success: true,
      client,
      totals: {
        invoiced,
        paid,
        balance: round2(invoiced - paid),
        overdueAmount: round2(
          open
            .filter((i) => i.dueDate < now)
            .reduce((s, i) => s + (i.total - i.amountPaid), 0),
        ),
        invoiceCount: invoices.length,
      },
      nextDue: next
        ? {
            invoiceId: next._id,
            number: next.number,
            dueDate: next.dueDate,
            amount: round2(next.total - next.amountPaid),
            overdue: next.dueDate < now,
          }
        : null,
      // Unpaid invoices, soonest due first
      openInvoices: open.map((i) => ({
        _id: i._id,
        number: i.number,
        dueDate: i.dueDate,
        total: i.total,
        balance: round2(i.total - i.amountPaid),
        overdue: i.dueDate < now,
      })),
      entries,
    });
  } catch (error) {
    return fail(res, "Failed to load the client ledger", error);
  }
};

module.exports = {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientLedger,
};
