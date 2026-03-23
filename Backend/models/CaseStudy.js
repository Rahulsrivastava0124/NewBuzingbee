const mongoose = require("mongoose");

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      default: "",
    },
    client: {
      type: String,
      trim: true,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      default: "",
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    challenge: {
      type: String,
      default: "",
    },
    solution: {
      type: String,
      default: "",
    },
    results: {
      type: String,
      default: "",
    },
    metrics: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    seo: {
      title: { type: String, trim: true, default: "" },
      description: { type: String, trim: true, default: "" },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, trim: true, default: "" },
      ogImage: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaseStudy", caseStudySchema);
