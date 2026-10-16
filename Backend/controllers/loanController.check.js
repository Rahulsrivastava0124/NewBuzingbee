// Run: node controllers/loanController.check.js  (no database needed)
const assert = require("assert");
const Loan = require("../models/Loan");
const { ledgerForLoan, ledgerForRepayment } = require("./loanController");

// Balance and status follow repayments
const taken = new Loan({ direction: "taken", party: "HDFC Bank", principal: 10000 });
assert.strictEqual(taken.balance, 10000);
assert.strictEqual(taken.status, "open");
taken.repayments.push({ amount: 2500.1 }, { amount: 7499.9 });
assert.strictEqual(taken.repaid, 10000);
assert.strictEqual(taken.balance, 0);
assert.strictEqual(taken.status, "closed");

// Borrowing: money in, repayment out
assert.strictEqual(ledgerForLoan(taken).type, "credit");
assert.strictEqual(ledgerForRepayment(taken, taken.repayments[0]).type, "debit");

// Lending: money out, repayment in
const given = new Loan({ direction: "given", party: "Ravi", principal: 5000 });
assert.strictEqual(ledgerForLoan(given).type, "debit");
given.repayments.push({ amount: 1000 });
assert.strictEqual(ledgerForRepayment(given, given.repayments[0]).type, "credit");
assert.strictEqual(given.balance, 4000);

// Wallet entries point back at their source so edits/deletes stay in sync
assert.strictEqual(ledgerForLoan(given).refType, "loan");
assert.strictEqual(String(ledgerForLoan(given).refId), String(given._id));
assert.strictEqual(ledgerForRepayment(given, given.repayments[0]).refType, "loan-repayment");

console.log("loans: all checks passed");
