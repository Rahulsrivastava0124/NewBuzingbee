const mongoose = require("mongoose");

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    rate: { type: Number, required: true, min: 0, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    // Who raised the bill; admin/team users only see their own
    billedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    items: {
      type: [itemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "partial", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
  },
  { timestamps: true },
);

// Status that follows from money state. draft/cancelled are manual and sticky.
invoiceSchema.methods.deriveStatus = function () {
  if (this.status === "draft" || this.status === "cancelled") return this.status;
  if (this.total > 0 && this.amountPaid >= this.total) return "paid";
  if (this.amountPaid > 0) {
    return this.dueDate < new Date() ? "overdue" : "partial";
  }
  return this.dueDate < new Date() ? "overdue" : "sent";
};

invoiceSchema.pre("validate", function () {
  this.items.forEach((item) => {
    item.amount = round2(item.quantity * item.rate);
  });
  this.subtotal = round2(this.items.reduce((s, i) => s + i.amount, 0));
  const taxable = Math.max(this.subtotal - this.discount, 0);
  this.taxAmount = round2((taxable * this.taxRate) / 100);
  this.total = round2(taxable + this.taxAmount);
  this.status = this.deriveStatus();
});

invoiceSchema.virtual("balance").get(function () {
  return round2(Math.max(this.total - this.amountPaid, 0));
});

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
