const Expense = require("../models/Expense");
const LedgerEntry = require("../models/LedgerEntry");

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: error?.message });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const getExpenses = async (req, res) => {
  try {
    const { category, search, from, to, page = 1, limit = 100 } = req.query;
    const query = {};
    if (category && category !== "all") query.category = category;
    if (search) {
      const rx = new RegExp(escapeRegex(String(search)), "i");
      query.$or = [{ title: rx }, { vendor: rx }];
    }
    if (from || to) {
      query.spentAt = {};
      if (from) query.spentAt.$gte = new Date(from);
      if (to) query.spentAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total, byCategory] = await Promise.all([
      Expense.find(query).sort({ spentAt: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: query },
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
    const { title, category, amount, vendor, method, spentAt, note } = req.body;
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
    });
    await LedgerEntry.create(ledgerFor(expense));
    return res.status(201).json({ success: true, expense });
  } catch (error) {
    return fail(res, "Failed to create expense", error);
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
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
    await expense.save();

    await LedgerEntry.findOneAndUpdate(
      { refType: "expense", refId: expense._id },
      ledgerFor(expense),
      { upsert: true },
    );
    return res.json({ success: true, expense });
  } catch (error) {
    return fail(res, "Failed to update expense", error);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    await LedgerEntry.deleteMany({ refType: "expense", refId: expense._id });
    return res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    return fail(res, "Failed to delete expense", error);
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
