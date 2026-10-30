const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Expense = require("../models/Expense");
const ExpensePayout = require("../models/ExpensePayout");
const LedgerEntry = require("../models/LedgerEntry");
const { errorDetail } = require("../utils/errors");

// Each admin/team member has an expense wallet:
//   paid    = what the super admin has paid them (advances + reimbursements)
//   spent   = their own expenses the super admin approved
//   balance = paid - spent  (positive: advance in hand, negative: the company owes them)

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: errorDetail(error) });

const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const walletSummary = (spent = 0, paid = 0) => ({
  spent: round2(spent),
  paid: round2(paid),
  balance: round2(paid - spent),
});

const ledgerForPayout = (payout, name) => ({
  type: "debit",
  amount: payout.amount,
  description: `Expense wallet payout to ${name}`,
  category: "payout",
  refType: "payout",
  refId: payout._id,
  date: payout.paidAt,
});

const sumBy = (Model, field, match = {}) =>
  Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, amount: { $sum: "$amount" } } }]);

// GET /finance/expense-wallets (super) — every non-super user's wallet
const getExpenseWallets = async (_req, res) => {
  try {
    const [admins, spent, paid] = await Promise.all([
      Admin.find({ role: { $ne: "super" } }, "username email role").lean(),
      sumBy(Expense, "spentBy", { spentBy: { $ne: null }, ...Expense.APPROVED }),
      sumBy(ExpensePayout, "to"),
    ]);
    const amountFor = (rows, id) => rows.find((r) => String(r._id) === String(id))?.amount || 0;
    const wallets = admins.map((a) => ({
      adminId: a._id,
      username: a.username,
      ...walletSummary(amountFor(spent, a._id), amountFor(paid, a._id)),
    }));
    return res.json({ success: true, wallets });
  } catch (error) {
    return fail(res, "Failed to load expense wallets", error);
  }
};

// GET /finance/expense-wallets/me — the signed-in user's wallet and payouts
const getMyExpenseWallet = async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(String(req.admin.id));
    const [spent, paid, payouts] = await Promise.all([
      sumBy(Expense, "spentBy", { spentBy: me, ...Expense.APPROVED }),
      sumBy(ExpensePayout, "to", { to: me }),
      ExpensePayout.find({ to: me }).sort({ paidAt: -1 }).limit(50),
    ]);
    return res.json({
      success: true,
      ...walletSummary(spent[0]?.amount, paid[0]?.amount),
      payouts,
    });
  } catch (error) {
    return fail(res, "Failed to load your expense wallet", error);
  }
};

// POST /finance/expense-wallets/:id/pay (super) — pay into someone's wallet
const payExpenseWallet = async (req, res) => {
  try {
    const { amount, method, paidAt, note } = req.body || {};
    if (!(Number(amount) > 0)) {
      return bad(res, "Amount must be positive");
    }
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, "User not found", 404);
    const target = await Admin.findById(req.params.id, "username role");
    if (!target) return bad(res, "User not found", 404);
    if (target.role === "super") return bad(res, "The super admin has no expense wallet");

    const payout = await ExpensePayout.create({
      to: target._id,
      amount: round2(amount),
      method,
      paidAt: paidAt || Date.now(),
      note,
      paidBy: req.admin.id,
    });
    await LedgerEntry.create(ledgerForPayout(payout, target.username));
    return res.status(201).json({ success: true, payout });
  } catch (error) {
    return fail(res, "Failed to record payment", error);
  }
};

module.exports = { getExpenseWallets, getMyExpenseWallet, payExpenseWallet, walletSummary, ledgerForPayout };
