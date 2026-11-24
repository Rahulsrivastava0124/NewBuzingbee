const express = require("express");
const { protectAdmin, requireBills, requireSuper, requireRole } = require("../middleware/authMiddleware");
const client = require("../controllers/clientController");
const invoice = require("../controllers/invoiceController");
const expense = require("../controllers/expenseController");
const expenseWallet = require("../controllers/expenseWalletController");
const wallet = require("../controllers/walletController");
const loan = require("../controllers/loanController");

const router = express.Router();

// Every finance route needs a signed-in user the super admin allowed to see bills
router.use(protectAdmin, requireBills);

// Overview + due-date notifications
router.get("/summary", wallet.getFinanceSummary);
router.get("/notifications", invoice.getNotifications);

// Clients
router.get("/clients", client.getClients);
router.post("/clients", client.createClient);
router.get("/clients/:id/ledger", client.getClientLedger);
router.put("/clients/:id", client.updateClient);
router.delete("/clients/:id", client.deleteClient);

// Invoices + payments
router.get("/invoices", invoice.getInvoices);
router.post("/invoices", invoice.createInvoice);
router.get("/invoices/:id", invoice.getInvoiceById);
router.put("/invoices/:id", invoice.updateInvoice);
router.delete("/invoices/:id", invoice.deleteInvoice);
router.post("/invoices/:id/payments", invoice.addPayment);
router.get("/payments", invoice.getPayments);
router.delete("/payments/:id", invoice.deletePayment);

// Expenses
router.get("/expenses", expense.getExpenses);
router.post("/expenses", expense.createExpense);
router.put("/expenses/:id", expense.updateExpense);
router.delete("/expenses/:id", expense.deleteExpense);
router.post("/expenses/:id/approve", requireSuper, expense.approveExpense);
router.post("/expenses/:id/reject", requireSuper, expense.rejectExpense);
router.post("/expenses/:id/cancel", expense.cancelExpense);

// Per-person expense wallets: super admin pays people, everyone sees their own
router.get("/expense-wallets", requireSuper, expenseWallet.getExpenseWallets);
router.get("/expense-wallets/me", expenseWallet.getMyExpenseWallet);
router.post("/expense-wallets/:id/pay", requireSuper, expenseWallet.payExpenseWallet);

// Loans and manual wallet entries move company money directly, so only the
// super admin and admins may change them; anyone with bill access can view
const canMoveMoney = requireRole("super", "admin");

// Loans (taken or given) + repayments; each one is mirrored in the wallet
router.get("/loans", loan.getLoans);
router.post("/loans", canMoveMoney, loan.createLoan);
router.put("/loans/:id", canMoveMoney, loan.updateLoan);
router.delete("/loans/:id", canMoveMoney, loan.deleteLoan);
router.post("/loans/:id/repayments", canMoveMoney, loan.addRepayment);
router.delete("/loans/:id/repayments/:repaymentId", canMoveMoney, loan.deleteRepayment);

// Wallet ledger
router.get("/wallet", wallet.getLedger);
router.post("/wallet", canMoveMoney, wallet.addManualEntry);
router.delete("/wallet/:id", canMoveMoney, wallet.deleteManualEntry);

module.exports = router;
