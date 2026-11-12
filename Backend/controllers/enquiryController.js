const { errorDetail } = require("../utils/errors");
const Enquiry = require("../models/Enquiry");
const { escapeRegex, readText, EMAIL_RE } = require("../utils/validate");
const { verifyTurnstile } = require("../utils/turnstile");
const { resolveSite, siteFilter } = require("../utils/site");

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

// PUBLIC: Submit a new enquiry from the contact form
const submitEnquiry = async (req, res) => {
  try {
    const body = req.body || {};

    // Each field must be plain text within its limit (no objects, arrays, HTML)
    const fields = {
      name: readText(body, "name", { max: 100, required: true, label: "Name" }),
      email: readText(body, "email", { max: 254, required: true, label: "Email" }),
      phone: readText(body, "phone", { max: 30, label: "Phone" }),
      service: readText(body, "service", { max: 60, label: "Service" }),
      budget: readText(body, "budget", { max: 60, label: "Budget" }),
      message: readText(body, "message", { max: 5000, required: true, label: "Message" }),
      source: readText(body, "source", { max: 60, label: "Source" }),
    };

    const problem = Object.values(fields).find((f) => f.error);
    if (problem) {
      return res.status(400).json({ success: false, message: problem.error });
    }
    if (!EMAIL_RE.test(fields.email.value)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // Cloudflare Turnstile (only enforced when TURNSTILE_SECRET_KEY is set)
    const captcha = await verifyTurnstile(body.captchaToken, getClientIP(req));
    if (!captcha.ok) {
      return res
        .status(captcha.status)
        .json({ success: false, message: captcha.message });
    }

    // Hidden field a human never fills in; bots usually do
    if (typeof body.website === "string" && body.website.trim()) {
      return res.status(201).json({
        success: true,
        message: "Thank you! We'll get back to you within 24 hours.",
      });
    }

    const enquiry = new Enquiry({
      site: resolveSite(body.site),
      name: fields.name.value,
      email: fields.email.value.toLowerCase(),
      phone: fields.phone.value,
      service: fields.service.value,
      budget: fields.budget.value,
      message: fields.message.value,
      source: fields.source.value || "contact-form",
      ip: getClientIP(req),
    });

    await enquiry.save();

    return res.status(201).json({
      success: true,
      message: "Thank you! We'll get back to you within 24 hours.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry. Please try again.",
      error: errorDetail(error),
    });
  }
};

// ADMIN: Get all enquiries with filters
const getAllEnquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = { $and: [siteFilter(req.query.site)] };

    if (typeof status === "string" && status !== "all") query.status = status;
    if (typeof search === "string" && search) {
      const rx = escapeRegex(search.slice(0, 100));
      query.$or = [
        { name: { $regex: rx, $options: "i" } },
        { email: { $regex: rx, $options: "i" } },
        { service: { $regex: rx, $options: "i" } },
        { message: { $regex: rx, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [enquiries, total] = await Promise.all([
      Enquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Enquiry.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
      error: errorDetail(error),
    });
  }
};

// ADMIN: Get single enquiry + mark as read
const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }

    // Auto-mark as read
    if (enquiry.status === "new") {
      enquiry.status = "read";
      await enquiry.save();
    }

    return res.status(200).json({ success: true, enquiry });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry",
      error: errorDetail(error),
    });
  }
};

// ADMIN: Update status or admin notes
const updateEnquiry = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (status && !Enquiry.schema.path("status").enumValues.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    // runValidators: reject statuses outside the model's enum
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Enquiry updated", enquiry });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry",
      error: errorDetail(error),
    });
  }
};

// ADMIN: Delete enquiry
const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Enquiry not found" });
    }
    return res.status(200).json({ success: true, message: "Enquiry deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete enquiry",
      error: errorDetail(error),
    });
  }
};

// ADMIN: Stats (counts per status)
const getEnquiryStats = async (req, res) => {
  try {
    const scope = siteFilter(req.query.site);
    const [total, newCount, read, replied, archived] = await Promise.all([
      Enquiry.countDocuments(scope),
      Enquiry.countDocuments({ ...scope, status: "new" }),
      Enquiry.countDocuments({ ...scope, status: "read" }),
      Enquiry.countDocuments({ ...scope, status: "replied" }),
      Enquiry.countDocuments({ ...scope, status: "archived" }),
    ]);

    return res
      .status(200)
      .json({ success: true, total, new: newCount, read, replied, archived });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry stats",
      error: errorDetail(error),
    });
  }
};

module.exports = {
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
};
