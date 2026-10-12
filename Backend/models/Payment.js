const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["upi", "bank-transfer", "cash", "card", "cheque", "other"],
      default: "upi",
    },
    reference: { type: String, trim: true, default: "" },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
