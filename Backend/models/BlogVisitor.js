const mongoose = require("mongoose");

// One row per (post, browser). The unique index makes counting a visitor
// idempotent: a repeat visit fails the insert and is not counted again.
const blogVisitorSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  visitor: { type: String, required: true }, // random id kept in the browser
  createdAt: { type: Date, default: Date.now },
});

blogVisitorSchema.index({ blog: 1, visitor: 1 }, { unique: true });

module.exports = mongoose.model("BlogVisitor", blogVisitorSchema);
