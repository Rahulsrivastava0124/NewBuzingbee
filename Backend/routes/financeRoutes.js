const express = require("express");
const { protectAdmin } = require("../middleware/authMiddleware");
const client = require("../controllers/clientController");
const invoice = require("../controllers/invoiceController");
const expense = require("../controllers/expenseController");
const wallet = require("../controllers/walletController");

const router = express.Router();

// Every finance route is admin-only
router.use(protectAdmin);

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

// Wallet ledger
router.get("/wallet", wallet.getLedger);
router.post("/wallet", wallet.addManualEntry);
router.delete("/wallet/:id", wallet.deleteManualEntry);

module.exports = router;
