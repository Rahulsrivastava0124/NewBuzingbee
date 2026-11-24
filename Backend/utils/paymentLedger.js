const Client = require("../models/Client");
const Payment = require("../models/Payment");
require("../models/Invoice"); // registered for the populate below (the script runs without index.js)
const LedgerEntry = require("../models/LedgerEntry");

// Company wallet credit for an invoice payment
const ledgerForPayment = (payment, invoiceNumber, clientName) => ({
  type: "credit",
  amount: payment.amount,
  description: `Payment for ${invoiceNumber} from ${clientName}`,
  category: "invoice-payment",
  refType: "payment",
  refId: payment._id,
  date: payment.paidAt,
});

// A personal client pays the admin who manages them, not the company, so their
// payments never sit in the company wallet. Brings one client's wallet entries
// in line with that rule; call after adding a payment, moving an invoice to
// another client, or changing a client's "personal" flag.
const syncClientPayments = async (clientId) => {
  const [client, payments] = await Promise.all([
    Client.findById(clientId).select("name personal").lean(),
    Payment.find({ client: clientId }).populate("invoice", "number").lean(),
  ]);
  const ids = payments.map((p) => p._id);
  if (!client || client.personal) {
    await LedgerEntry.deleteMany({ refType: "payment", refId: { $in: ids } });
    return;
  }
  await Promise.all(
    payments.map((p) =>
      LedgerEntry.findOneAndUpdate(
        { refType: "payment", refId: p._id },
        ledgerForPayment(p, p.invoice?.number || "invoice", client.name),
        { upsert: true },
      ),
    ),
  );
};

module.exports = { ledgerForPayment, syncClientPayments };

// One-off fix for payments recorded before this rule existed:
//   node utils/paymentLedger.js        (uses MONGO_URI from .env)
if (require.main === module) {
  const path = require("path");
  require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
  const mongoose = require("mongoose");
  (async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const personal = await Client.find({ personal: true }).select("_id name").lean();
    for (const c of personal) await syncClientPayments(c._id);
    console.log(`Removed company-wallet entries for ${personal.length} personal client(s)`);
    await mongoose.disconnect();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
