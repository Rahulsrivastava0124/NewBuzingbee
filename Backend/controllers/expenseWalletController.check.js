// Run: node controllers/expenseWalletController.check.js  (no database needed)
const assert = require("assert");
const ExpensePayout = require("../models/ExpensePayout");
const { walletSummary, ledgerForPayout } = require("./expenseWalletController");

// Balance = paid - spent: negative means the company owes the person
assert.deepStrictEqual(walletSummary(1500.1, 0), { spent: 1500.1, paid: 0, balance: -1500.1 });
assert.deepStrictEqual(walletSummary(300, 1000), { spent: 300, paid: 1000, balance: 700 });
assert.deepStrictEqual(walletSummary(), { spent: 0, paid: 0, balance: 0 });

// Paying someone is money out of the company wallet, linked back to the payout
const payout = new ExpensePayout({ to: "6accce58a1c5368f1a629acd", amount: 2000 });
const entry = ledgerForPayout(payout, "Rahul Kumar");
assert.strictEqual(entry.type, "debit");
assert.strictEqual(entry.amount, 2000);
assert.strictEqual(entry.refType, "payout");
assert.strictEqual(String(entry.refId), String(payout._id));
assert.match(entry.description, /Rahul Kumar/);

console.log("expenseWalletController checks passed");
