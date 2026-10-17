const mongoose = require("mongoose");

// One row per blog post per day: how many times it was viewed that day.
// Powers the views graphs in the admin panel (Blog.views keeps the all-time total).
const blogViewDaySchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  day: { type: String, required: true }, // YYYY-MM-DD (UTC)
  views: { type: Number, default: 0 },
  // Rows clean themselves up after ~13 months
  createdAt: { type: Date, default: Date.now },
});

blogViewDaySchema.index({ blog: 1, day: 1 }, { unique: true });
blogViewDaySchema.index({ day: 1 });
blogViewDaySchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 60 * 60 });

module.exports = mongoose.model("BlogViewDay", blogViewDaySchema);
