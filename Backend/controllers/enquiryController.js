const { errorDetail } = require("../utils/errors");
const Enquiry = require("../models/Enquiry");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    const { name, email, phone, service, budget, message, source } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const enquiry = new Enquiry({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      service: service?.trim() || "",
      budget: budget?.trim() || "",
      message: message.trim(),
      source: source || "contact-form",
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
    const query = {};

    if (status && status !== "all") query.status = status;
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { email: rx }, { service: rx }, { message: rx }];
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
    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
      new: true,
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
    const [total, newCount, read, replied, archived] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ status: "read" }),
      Enquiry.countDocuments({ status: "replied" }),
      Enquiry.countDocuments({ status: "archived" }),
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
