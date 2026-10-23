const Invoice = require("../models/Invoice");
const Client = require("../models/Client");
const Payment = require("../models/Payment");
const Admin = require("../models/Admin");
const LedgerEntry = require("../models/LedgerEntry");
const { nextSequence } = require("../models/Counter");
const { invoiceScope, isScoped, clientScope } = require("../utils/billingScope");
const { errorDetail } = require("../utils/errors");

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: errorDetail(error) });

const notFound = (res, what = "Invoice") =>
  res.status(404).json({ success: false, message: `${what} not found` });

const bad = (res, message) =>
  res.status(400).json({ success: false, message });

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatNumber = (seq, date = new Date()) =>
  `INV-${date.getFullYear()}-${String(seq).padStart(4, "0")}`;

const sanitizeItems = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((i) => i && String(i.description || "").trim())
    .map((i) => ({
      description: String(i.description).trim(),
      quantity: Math.max(Number(i.quantity) || 0, 0),
      rate: Math.max(Number(i.rate) || 0, 0),
    }));

// Re-sync stored paid amount + status from the payment history.
const recalculateInvoice = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return null;
  const agg = await Payment.aggregate([
    { $match: { invoice: invoice._id } },
    { $group: { _id: null, paid: { $sum: "$amount" } } },
  ]);
  invoice.amountPaid = round2(agg[0]?.paid || 0);
  // Money received on a draft means it was effectively sent.
  if (invoice.status === "draft" && invoice.amountPaid > 0) {
    invoice.status = "sent";
  }
  await invoice.save(); // pre-validate derives paid/partial/overdue
  return invoice;
};

// Overdue is time-based; show it correctly on read without a cron job.
const withLiveStatus = (invoice) => {
  const obj = invoice.toObject ? invoice.toObject() : invoice;
  if (
    ["sent", "partial"].includes(obj.status) &&
    new Date(obj.dueDate) < new Date()
  ) {
    obj.status = "overdue";
  }
  return obj;
};

const getInvoices = async (req, res) => {
  try {
    const { status, client, search, page = 1, limit = 50 } = req.query;
    const query = { ...(await invoiceScope(req)) };
    const now = new Date();
    if (client) query.client = client;
    if (status && status !== "all") {
      if (status === "overdue") {
        query.$or = [
          { status: "overdue" },
          { status: { $in: ["sent", "partial"] }, dueDate: { $lt: now } },
        ];
      } else if (status === "sent" || status === "partial") {
        query.status = status;
        query.dueDate = { $gte: now };
      } else {
        query.status = status;
      }
    }
    if (search) {
      query.number = { $regex: escapeRegex(String(search)), $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate("client", "name company email")
        .populate("billedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    return res.json({
      success: true,
      total,
      invoices: invoices.map(withLiveStatus),
    });
  } catch (error) {
    return fail(res, "Failed to fetch invoices", error);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...(await invoiceScope(req)) })
      .populate("client")
      .populate("billedBy", "username email");
    if (!invoice) return notFound(res);
    const payments = await Payment.find({ invoice: invoice._id }).sort({
      paidAt: -1,
    });
    // Personal clients pay the admin who manages them, not the company
    let payTo = null;
    if (invoice.client?.personal && invoice.client.managedBy) {
      const manager = await Admin.findById(invoice.client.managedBy).select("username payment").lean();
      if (manager) payTo = { name: manager.username, ...manager.payment };
    }
    return res.json({
      success: true,
      invoice: withLiveStatus(invoice),
      payments,
      payTo,
    });
  } catch (error) {
    return fail(res, "Failed to fetch invoice", error);
  }
};

const createInvoice = async (req, res) => {
  try {
    const { client, issueDate, dueDate, taxRate, discount, notes, terms } =
      req.body;
    const items = sanitizeItems(req.body.items);

    if (!client || !(await Client.exists({ _id: client, ...clientScope(req) }))) {
      return bad(res, "Valid client is required");
    }
    if (!dueDate) return bad(res, "Due date is required");
    if (items.length === 0) return bad(res, "Add at least one line item");

    const subtotal = items.reduce((t, i) => t + i.quantity * i.rate, 0);
    if ((Number(discount) || 0) > subtotal) {
      return bad(res, "Discount cannot exceed the subtotal");
    }

    const issued = issueDate ? new Date(issueDate) : new Date();
    // Numbers restart each calendar year: INV-2027-0001. Seed from any numbers
    // already issued for that year so existing invoices never collide.
    const year = issued.getFullYear();
    const prefix = `INV-${year}-`;
    const last = await Invoice.findOne({ number: new RegExp(`^${prefix}\\d+$`) })
      .sort({ number: -1 })
      .select("number")
      .lean();
    const floor = last ? Number(last.number.slice(prefix.length)) || 0 : 0;
    const seq = await nextSequence(`invoice-${year}`, floor);
    const invoice = await Invoice.create({
      number: formatNumber(seq, issued),
      client,
      billedBy: req.admin.id,
      issueDate: issued,
      dueDate,
      items,
      taxRate: Number(taxRate) || 0,
      discount: Number(discount) || 0,
      notes,
      terms,
      status: req.body.status === "sent" ? "sent" : "draft",
    });

    return res.status(201).json({ success: true, invoice });
  } catch (error) {
    return fail(res, "Failed to create invoice", error);
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...(await invoiceScope(req)) });
    if (!invoice) return notFound(res);

    const { client, issueDate, dueDate, taxRate, discount, notes, terms } =
      req.body;

    let clientChanged = false;
    if (client !== undefined && String(client) !== String(invoice.client)) {
      if (!(await Client.exists({ _id: client, ...clientScope(req) }))) {
        return bad(res, "Valid client is required");
      }
      invoice.client = client;
      clientChanged = true;
    }
    if (issueDate !== undefined) invoice.issueDate = issueDate;
    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (taxRate !== undefined) invoice.taxRate = Number(taxRate) || 0;
    if (discount !== undefined) invoice.discount = Number(discount) || 0;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;
    if (req.body.items !== undefined) {
      const items = sanitizeItems(req.body.items);
      if (items.length === 0) return bad(res, "Add at least one line item");
      invoice.items = items;
    }
    if (req.body.status !== undefined) {
      if (!["draft", "sent", "cancelled"].includes(req.body.status)) {
        return bad(res, "Status can only be set to draft, sent or cancelled");
      }
      invoice.status = req.body.status;
    } else if (invoice.status === "paid" || invoice.status === "overdue") {
      // Totals may have changed; re-derive from "sent" baseline.
      invoice.status = "sent";
    }

    await invoice.validate(); // recomputes totals + status
    if (invoice.discount > invoice.subtotal) {
      return bad(res, "Discount cannot exceed the subtotal");
    }
    if (invoice.total < invoice.amountPaid) {
      return bad(
        res,
        `Total cannot be lower than the amount already paid (${invoice.amountPaid})`,
      );
    }

    await invoice.save();
    if (clientChanged) {
      // Keep payment history attached to the invoice's current client
      await Payment.updateMany(
        { invoice: invoice._id },
        { client: invoice.client },
      );
    }
    return res.json({ success: true, invoice });
  } catch (error) {
    return fail(res, "Failed to update invoice", error);
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, ...(await invoiceScope(req)) });
    if (!invoice) return notFound(res);

    const payments = await Payment.find({ invoice: invoice._id }, "_id");
    const ids = payments.map((p) => p._id);
    await LedgerEntry.deleteMany({ refType: "payment", refId: { $in: ids } });
    await Payment.deleteMany({ invoice: invoice._id });
    await invoice.deleteOne();

    return res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    return fail(res, "Failed to delete invoice", error);
  }
};

// ── Payments ──────────────────────────────────────────────────────

const addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ...(await invoiceScope(req)),
    }).populate("client", "name");
    if (!invoice) return notFound(res);
    if (invoice.status === "cancelled") return bad(res, "Invoice is cancelled");

    const amount = round2(req.body.amount);
    if (!(amount > 0)) return bad(res, "Enter a valid amount");
    const due = round2(invoice.total - invoice.amountPaid);
    if (amount > due) return bad(res, `Amount exceeds balance due (${due})`);

    const payment = await Payment.create({
      invoice: invoice._id,
      client: invoice.client._id,
      amount,
      method: req.body.method || "upi",
      reference: req.body.reference,
      paidAt: req.body.paidAt || new Date(),
      note: req.body.note,
    });

    await LedgerEntry.create({
      type: "credit",
      amount,
      description: `Payment for ${invoice.number} from ${invoice.client.name}`,
      category: "invoice-payment",
      refType: "payment",
      refId: payment._id,
      date: payment.paidAt,
    });

    const updated = await recalculateInvoice(invoice._id);
    return res.status(201).json({ success: true, payment, invoice: updated });
  } catch (error) {
    return fail(res, "Failed to record payment", error);
  }
};

const getPayments = async (req, res) => {
  try {
    const { client, invoice, method, from, to, page = 1, limit = 100 } =
      req.query;
    const query = {};
    if (client) query.client = client;
    if (invoice) query.invoice = invoice;
    if (method && method !== "all") query.method = method;
    if (from || to) {
      query.paidAt = {};
      if (from) query.paidAt.$gte = new Date(from);
      if (to) query.paidAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    const scope = await invoiceScope(req);
    if (isScoped(scope)) {
      query.$and = [{ invoice: { $in: await Invoice.distinct("_id", scope) } }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total, sum] = await Promise.all([
      Payment.find(query)
        .populate("invoice", "number total")
        .populate("client", "name company")
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
      Payment.aggregate([
        { $match: query },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
    ]);

    return res.json({
      success: true,
      total,
      totalAmount: sum[0]?.amount || 0,
      payments,
    });
  } catch (error) {
    return fail(res, "Failed to fetch payments", error);
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return notFound(res, "Payment");
    if (!(await Invoice.exists({ _id: payment.invoice, ...(await invoiceScope(req)) }))) {
      return notFound(res, "Payment");
    }
    await payment.deleteOne();
    await LedgerEntry.deleteMany({ refType: "payment", refId: payment._id });
    const invoice = await recalculateInvoice(payment.invoice);
    return res.json({ success: true, message: "Payment removed", invoice });
  } catch (error) {
    return fail(res, "Failed to delete payment", error);
  }
};

// Unpaid invoices that are overdue or fall due within `days` (default 7).
const getNotifications = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 60);
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;
    const horizon = new Date(now.getTime() + days * DAY);

    const invoices = await Invoice.find({
      ...(await invoiceScope(req)),
      status: { $nin: ["draft", "cancelled"] },
      $expr: { $gt: ["$total", "$amountPaid"] },
      dueDate: { $lte: horizon },
    })
      .populate("client", "name company")
      .sort({ dueDate: 1 })
      .limit(100);

    const items = invoices.map((inv) => ({
      invoiceId: inv._id,
      number: inv.number,
      client: inv.client?.name || "Client",
      dueDate: inv.dueDate,
      balance: round2(inv.total - inv.amountPaid),
      overdue: inv.dueDate < now,
      // negative = days late, 0 = today, positive = days left
      daysFromNow: Math.ceil((inv.dueDate - now) / DAY),
    }));

    const overdue = items.filter((i) => i.overdue);
    const dueSoon = items.filter((i) => !i.overdue);

    return res.json({
      success: true,
      days,
      counts: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        total: items.length,
        overdueAmount: round2(overdue.reduce((s, i) => s + i.balance, 0)),
        dueSoonAmount: round2(dueSoon.reduce((s, i) => s + i.balance, 0)),
      },
      overdue,
      dueSoon,
    });
  } catch (error) {
    return fail(res, "Failed to load notifications", error);
  }
};

module.exports = {
  getNotifications,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  addPayment,
  getPayments,
  deletePayment,
};
