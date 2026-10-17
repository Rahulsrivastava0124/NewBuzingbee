const Loan = require("../models/Loan");
const LedgerEntry = require("../models/LedgerEntry");

const { round2 } = Loan;

const fail = (res, message, error, code = 500) =>
  res.status(code).json({ success: false, message, error: error?.message });
const bad = (res, message) => res.status(400).json({ success: false, message });
const notFound = (res, what = "Loan") =>
  res.status(404).json({ success: false, message: `${what} not found` });

// Wallet entry for the loan itself: borrowing brings money in, lending sends it out
const ledgerForLoan = (loan) => ({
  type: loan.direction === "taken" ? "credit" : "debit",
  amount: loan.principal,
  description:
    loan.direction === "taken" ? `Loan received from ${loan.party}` : `Loan given to ${loan.party}`,
  category: loan.direction === "taken" ? "loan-taken" : "loan-given",
  refType: "loan",
  refId: loan._id,
  date: loan.startDate,
});

// Wallet entry for a repayment: the opposite direction of the loan
const ledgerForRepayment = (loan, r) => ({
  type: loan.direction === "taken" ? "debit" : "credit",
  amount: r.amount,
  description:
    loan.direction === "taken"
      ? `Loan repayment to ${loan.party}`
      : `Loan repayment from ${loan.party}`,
  category: "loan-repayment",
  refType: "loan-repayment",
  refId: r._id,
  date: r.paidAt,
});

const syncLoanLedger = (loan) =>
  LedgerEntry.findOneAndUpdate({ refType: "loan", refId: loan._id }, ledgerForLoan(loan), {
    upsert: true,
  });

const getLoans = async (req, res) => {
  try {
    const { direction, status } = req.query;
    const query = {};
    if (direction === "taken" || direction === "given") query.direction = direction;
    let loans = await Loan.find(query).sort({ startDate: -1 });
    if (status === "open" || status === "closed") loans = loans.filter((l) => l.status === status);

    const outstanding = (dir) =>
      round2(loans.filter((l) => l.direction === dir).reduce((s, l) => s + l.balance, 0));

    return res.json({
      success: true,
      loans,
      totals: {
        borrowedOutstanding: outstanding("taken"),
        lentOutstanding: outstanding("given"),
      },
    });
  } catch (error) {
    return fail(res, "Failed to fetch loans", error);
  }
};

const createLoan = async (req, res) => {
  try {
    const { direction, party, principal, startDate, dueDate, method, note } = req.body;
    if (!["taken", "given"].includes(direction)) return bad(res, "Choose loan taken or given");
    if (!String(party || "").trim()) return bad(res, "Enter who the loan is with");
    if (!(Number(principal) > 0)) return bad(res, "Enter a positive amount");

    const loan = await Loan.create({
      direction,
      party,
      principal: round2(principal),
      startDate: startDate || new Date(),
      dueDate: dueDate || null,
      method,
      note,
    });
    await syncLoanLedger(loan);
    return res.status(201).json({ success: true, loan });
  } catch (error) {
    return fail(res, "Failed to create loan", error);
  }
};

const updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return notFound(res);

    ["party", "method", "note", "startDate"].forEach((k) => {
      if (req.body[k] !== undefined) loan[k] = req.body[k];
    });
    if (req.body.dueDate !== undefined) loan.dueDate = req.body.dueDate || null;
    if (req.body.principal !== undefined) {
      const principal = round2(req.body.principal);
      if (!(principal > 0)) return bad(res, "Enter a positive amount");
      if (principal < loan.repaid) {
        return bad(res, `Amount cannot be lower than what is already repaid (${loan.repaid})`);
      }
      loan.principal = principal;
    }
    // Direction is fixed once created; changing it would flip every wallet entry
    await loan.save();
    await syncLoanLedger(loan);
    // Party name appears in repayment descriptions too
    await Promise.all(
      loan.repayments.map((r) =>
        LedgerEntry.updateOne({ refType: "loan-repayment", refId: r._id }, ledgerForRepayment(loan, r)),
      ),
    );
    return res.json({ success: true, loan });
  } catch (error) {
    return fail(res, "Failed to update loan", error);
  }
};

const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);
    if (!loan) return notFound(res);
    await LedgerEntry.deleteMany({
      $or: [
        { refType: "loan", refId: loan._id },
        { refType: "loan-repayment", refId: { $in: loan.repayments.map((r) => r._id) } },
      ],
    });
    return res.json({ success: true, message: "Loan deleted" });
  } catch (error) {
    return fail(res, "Failed to delete loan", error);
  }
};

const addRepayment = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return notFound(res);

    const amount = round2(req.body.amount);
    if (!(amount > 0)) return bad(res, "Enter a valid amount");
    if (amount > loan.balance) return bad(res, `Amount exceeds the balance (${loan.balance})`);

    loan.repayments.push({
      amount,
      paidAt: req.body.paidAt || new Date(),
      method: req.body.method || "bank-transfer",
      note: req.body.note,
    });
    await loan.save();
    const repayment = loan.repayments[loan.repayments.length - 1];
    await LedgerEntry.create(ledgerForRepayment(loan, repayment));
    return res.status(201).json({ success: true, loan });
  } catch (error) {
    return fail(res, "Failed to record repayment", error);
  }
};

const deleteRepayment = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return notFound(res);
    const repayment = loan.repayments.id(req.params.repaymentId);
    if (!repayment) return notFound(res, "Repayment");

    repayment.deleteOne();
    await loan.save();
    await LedgerEntry.deleteMany({ refType: "loan-repayment", refId: repayment._id });
    return res.json({ success: true, loan });
  } catch (error) {
    return fail(res, "Failed to delete repayment", error);
  }
};

module.exports = {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  addRepayment,
  deleteRepayment,
  ledgerForLoan,
  ledgerForRepayment,
};
