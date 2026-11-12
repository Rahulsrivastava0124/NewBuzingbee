const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const LedgerEntry = require("../models/LedgerEntry");
const { errorDetail } = require("../utils/errors");

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: errorDetail(error) });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toId = (id) => new mongoose.Types.ObjectId(String(id));
const isSuper = (req) => req.admin?.role === "super";

// Admin/team touch expenses from their own wallet or ones they entered; the super admin, all
const ownScope = (req) =>
  isSuper(req) ? {} : { $or: [{ spentBy: toId(req.admin.id) }, { createdBy: toId(req.admin.id) }] };

// Listing: the super admin can narrow to one wallet with ?spentBy=<id>|company
const listScope = (req) => {
  if (!isSuper(req)) return ownScope(req);
  const by = req.query?.spentBy;
  if (by === "company") return { spentBy: null };
  if (by && mongoose.isValidObjectId(by)) return { spentBy: toId(by) };
  return {};
};

const ledgerFor = (expense) => ({
  type: "debit",
  amount: expense.amount,
  description: expense.vendor
    ? `${expense.title} (${expense.vendor})`
    : expense.title,
  category: expense.category,
  refType: "expense",
  refId: expense._id,
  date: expense.spentAt,
});

// Only approved company expenses hit the company wallet; a person's own expense comes
// out of their expense wallet, and the company wallet pays when the super admin pays them
const hitsCompanyWallet = (expense) => !expense.spentBy && expense.status === "approved";

const syncLedger = (expense) =>
  !hitsCompanyWallet(expense)
    ? LedgerEntry.deleteMany({ refType: "expense", refId: expense._id })
    : LedgerEntry.findOneAndUpdate({ refType: "expense", refId: expense._id }, ledgerFor(expense), {
        upsert: true,
      });

const getExpenses = async (req, res) => {
  try {
    const { category, search, from, to, page = 1, limit = 100 } = req.query;
    // $and keeps the scope's $or and the search's $or apart
    const query = { $and: [listScope(req)] };
    if (category && category !== "all") query.category = category;
    if (["pending", "approved", "rejected", "cancelled"].includes(req.query.status)) {
      query.$and.push(req.query.status === "approved" ? Expense.APPROVED : { status: req.query.status });
    }
    if (search) {
      const rx = new RegExp(escapeRegex(String(search)), "i");
      query.$and.push({ $or: [{ title: rx }, { vendor: rx }] });
    }
    if (from || to) {
      query.spentAt = {};
      if (from) query.spentAt.$gte = new Date(from);
      if (to) query.spentAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total, byCategory] = await Promise.all([
      Expense.find(query)
        .sort({ spentAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("spentBy", "username")
        .populate("createdBy", "username"),
      Expense.countDocuments(query),
      // Totals only include approved spending
      Expense.aggregate([
        { $match: { $and: [query, Expense.APPROVED] } },
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
        { $sort: { amount: -1 } },
      ]),
    ]);

    return res.json({
      success: true,
      total,
      totalAmount: byCategory.reduce((s, c) => s + c.amount, 0),
      byCategory: byCategory.map((c) => ({
        category: c._id,
        amount: c.amount,
      })),
      expenses,
    });
  } catch (error) {
    return fail(res, "Failed to fetch expenses", error);
  }
};

const createExpense = async (req, res) => {
  try {
    const { title, category, amount, vendor, method, spentAt, note, paidFrom } = req.body;
    if (!title?.trim() || !(Number(amount) > 0)) {
      return res.status(400).json({
        success: false,
        message: "Title and a positive amount are required",
      });
    }
    const expense = await Expense.create({
      title,
      category,
      amount: Number(amount),
      vendor,
      method,
      spentAt,
      note,
      // Admin/team default to their own wallet but may log a company expense
      spentBy: isSuper(req) || paidFrom === "company" ? null : req.admin.id,
      createdBy: req.admin.id,
      status: isSuper(req) ? "approved" : "pending",
    });
    await syncLedger(expense);
    return res.status(201).json({ success: true, expense });
  } catch (error) {
    return fail(res, "Failed to create expense", error);
  }
};

// Once reviewed or cancelled, only the super admin may edit or delete an expense
const canChange = (isSuperAdmin, expense) => isSuperAdmin || expense.status === "pending";
const LOCKED = "Only pending expenses can be changed";

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, ...ownScope(req) });
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    if (!canChange(isSuper(req), expense)) {
      return res.status(400).json({ success: false, message: LOCKED });
    }
    ["title", "category", "vendor", "method", "spentAt", "note"].forEach((k) => {
      if (req.body[k] !== undefined) expense[k] = req.body[k];
    });
    if (req.body.amount !== undefined) {
      if (!(Number(req.body.amount) > 0)) {
        return res
          .status(400)
          .json({ success: false, message: "Amount must be positive" });
      }
      expense.amount = Number(req.body.amount);
    }
    // Any change by admin/team needs approving again
    if (!isSuper(req)) {
      expense.status = "pending";
      expense.reviewedBy = null;
      expense.reviewedAt = null;
    }
    await expense.save();

    await syncLedger(expense);
    return res.json({ success: true, expense });
  } catch (error) {
    return fail(res, "Failed to update expense", error);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, ...ownScope(req) });
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    if (!canChange(isSuper(req), expense)) {
      return res.status(400).json({ success: false, message: LOCKED });
    }
    await expense.deleteOne();
    await LedgerEntry.deleteMany({ refType: "expense", refId: expense._id });
    return res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    return fail(res, "Failed to delete expense", error);
  }
};

// POST /expenses/:id/approve | /reject (super) — approving takes it out of its wallet
const reviewExpense = (status) => async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    if (expense.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: `This expense is already ${expense.status}` });
    }
    expense.status = status;
    expense.reviewedBy = req.admin.id;
    expense.reviewedAt = new Date();
    await expense.save();
    await syncLedger(expense);
    return res.json({ success: true, expense });
  } catch (error) {
    return fail(res, `Failed to ${status === "approved" ? "approve" : "reject"} expense`, error);
  }
};

// POST /expenses/:id/cancel — whoever owns it can withdraw it before it's reviewed
const cancelExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, ...ownScope(req) });
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    if (expense.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Only pending expenses can be cancelled" });
    }
    expense.status = "cancelled";
    await expense.save();
    await syncLedger(expense);
    return res.json({ success: true, expense });
  } catch (error) {
    return fail(res, "Failed to cancel expense", error);
  }
};

module.exports = {
  getExpenses,
  cancelExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense: reviewExpense("approved"),
  rejectExpense: reviewExpense("rejected"),
  ledgerFor,
  hitsCompanyWallet,
  canChange,
};
