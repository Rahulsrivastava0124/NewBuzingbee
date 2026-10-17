const express = require("express");
const { protectAdmin, requireBills } = require("../middleware/authMiddleware");
const client = require("../controllers/clientController");
const invoice = require("../controllers/invoiceController");
const expense = require("../controllers/expenseController");
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

// Loans (taken or given) + repayments; each one is mirrored in the wallet
router.get("/loans", loan.getLoans);
router.post("/loans", loan.createLoan);
router.put("/loans/:id", loan.updateLoan);
router.delete("/loans/:id", loan.deleteLoan);
router.post("/loans/:id/repayments", loan.addRepayment);
router.delete("/loans/:id/repayments/:repaymentId", loan.deleteRepayment);

// Wallet ledger
router.get("/wallet", wallet.getLedger);
router.post("/wallet", wallet.addManualEntry);
router.delete("/wallet/:id", wallet.deleteManualEntry);

module.exports = router;
