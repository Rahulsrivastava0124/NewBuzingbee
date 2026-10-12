const LedgerEntry = require("../models/LedgerEntry");
const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");
const Payment = require("../models/Payment");

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: error?.message });

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const sumByType = async (match = {}) => {
  const rows = await LedgerEntry.aggregate([
    { $match: match },
    { $group: { _id: "$type", amount: { $sum: "$amount" } } },
  ]);
  const credit = rows.find((r) => r._id === "credit")?.amount || 0;
  const debit = rows.find((r) => r._id === "debit")?.amount || 0;
  return { credit: round2(credit), debit: round2(debit) };
};

// GET /wallet — balance + ledger with running balance (newest first)
const getLedger = async (req, res) => {
  try {
    const { type, refType, from, to } = req.query;
    const filter = {};
    if (type === "credit" || type === "debit") filter.type = type;
    if (refType && refType !== "all") filter.refType = refType;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    // Running balance is always computed over the full ledger so filtered
    // views still show the true wallet balance after each entry.
    const all = await LedgerEntry.find({})
      .sort({ date: 1, _id: 1 })
      .lean();
    let running = 0;
    const withBalance = new Map();
    all.forEach((e) => {
      running += e.type === "credit" ? e.amount : -e.amount;
      withBalance.set(String(e._id), round2(running));
    });

    const matchIds = filter && Object.keys(filter).length
      ? new Set(
          (await LedgerEntry.find(filter, "_id").lean()).map((e) =>
            String(e._id),
          ),
        )
      : null;

    const entries = all
      .filter((e) => !matchIds || matchIds.has(String(e._id)))
      .map((e) => ({ ...e, balanceAfter: withBalance.get(String(e._id)) }))
      .reverse()
      .slice(0, 500);

    const totals = await sumByType();
    return res.json({
      success: true,
      balance: round2(totals.credit - totals.debit),
      totalCredit: totals.credit,
      totalDebit: totals.debit,
      entries,
    });
  } catch (error) {
    return fail(res, "Failed to fetch ledger", error);
  }
};

// POST /wallet — manual credit/debit (top-up, owner draw, adjustment)
const addManualEntry = async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;
    if (!["credit", "debit"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Type must be credit or debit" });
    }
    if (!(Number(amount) > 0) || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description and a positive amount are required",
      });
    }
    const entry = await LedgerEntry.create({
      type,
      amount: Number(amount),
      description,
      category: category || "manual",
      refType: "manual",
      date,
    });
    return res.status(201).json({ success: true, entry });
  } catch (error) {
    return fail(res, "Failed to add ledger entry", error);
  }
};

// DELETE /wallet/:id — only manual entries; payments/expenses are managed at source
const deleteManualEntry = async (req, res) => {
  try {
    const entry = await LedgerEntry.findById(req.params.id);
    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }
    if (entry.refType !== "manual") {
      return res.status(400).json({
        success: false,
        message: `Remove this from ${entry.refType}s instead`,
      });
    }
    await entry.deleteOne();
    return res.json({ success: true, message: "Entry deleted" });
  } catch (error) {
    return fail(res, "Failed to delete entry", error);
  }
};

// GET /finance/summary — dashboard numbers + 6-month income/expense series
const getFinanceSummary = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [wallet, invoiceAgg, expenseAgg, paymentSeries, expenseSeries] =
      await Promise.all([
        sumByType(),
        Invoice.aggregate([
          { $match: { status: { $nin: ["draft", "cancelled"] } } },
          {
            $group: {
              _id: null,
              invoiced: { $sum: "$total" },
              paid: { $sum: "$amountPaid" },
              count: { $sum: 1 },
            },
          },
        ]),
        Expense.aggregate([
          { $group: { _id: null, amount: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          { $match: { paidAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } },
              amount: { $sum: "$amount" },
            },
          },
        ]),
        Expense.aggregate([
          { $match: { spentAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { y: { $year: "$spentAt" }, m: { $month: "$spentAt" } },
              amount: { $sum: "$amount" },
            },
          },
        ]),
      ]);

    const overdue = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["sent", "partial", "overdue"] },
          dueDate: { $lt: now },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: { $subtract: ["$total", "$amountPaid"] } },
        },
      },
    ]);

    const nextDueDoc = await Invoice.findOne({
      status: { $nin: ["draft", "cancelled"] },
      $expr: { $gt: ["$total", "$amountPaid"] },
    })
      .sort({ dueDate: 1 })
      .populate("client", "name");

    const invoiced = invoiceAgg[0]?.invoiced || 0;
    const paid = invoiceAgg[0]?.paid || 0;

    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const find = (series) =>
        series.find(
          (s) => s._id.y === d.getFullYear() && s._id.m === d.getMonth() + 1,
        )?.amount || 0;
      months.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        income: round2(find(paymentSeries)),
        expense: round2(find(expenseSeries)),
      });
    }

    return res.json({
      success: true,
      balance: round2(wallet.credit - wallet.debit),
      invoiced: round2(invoiced),
      paid: round2(paid),
      outstanding: round2(Math.max(invoiced - paid, 0)),
      invoiceCount: invoiceAgg[0]?.count || 0,
      nextDue: nextDueDoc
        ? {
            invoiceId: nextDueDoc._id,
            number: nextDueDoc.number,
            client: nextDueDoc.client?.name || "",
            dueDate: nextDueDoc.dueDate,
            amount: round2(nextDueDoc.total - nextDueDoc.amountPaid),
            overdue: nextDueDoc.dueDate < now,
          }
        : null,
      overdueCount: overdue[0]?.count || 0,
      overdueAmount: round2(overdue[0]?.amount || 0),
      totalExpenses: round2(expenseAgg[0]?.amount || 0),
      months,
    });
  } catch (error) {
    return fail(res, "Failed to fetch finance summary", error);
  }
};

module.exports = {
  getLedger,
  addManualEntry,
  deleteManualEntry,
  getFinanceSummary,
};
