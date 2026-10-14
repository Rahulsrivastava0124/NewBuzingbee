const Settings = require("../models/Settings");
const { encrypt, decrypt } = require("../utils/secretBox");
const { errorDetail } = require("../utils/errors");
const { uploadLogoAndGetUrl } = require("../services/storageService");
const { sniffImageType } = require("../utils/imageSniff");
const {
  applySmtpOverrides,
  checkSmtpConnection,
  logSmtpStatus,
  sendMail,
  getConfig,
} = require("../services/mailService");

const COMPANY_FIELDS = [
  "name",
  "legalName",
  "email",
  "phone",
  "website",
  "address",
  "city",
  "state",
  "postalCode",
  "country",
  "gstin",
  "pan",
  "logoUrl",
  "invoiceFooter",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// "Name <user@host>" or a bare address
const FROM_RE = /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

const fail = (res, status, message, error) =>
  res
    .status(status)
    .json({ success: false, message, ...(error ? { error: errorDetail(error) } : {}) });

const getDoc = async () => {
  let doc = await Settings.findOne({ key: "main" }).select("+smtp.passEncrypted");
  if (!doc) doc = await Settings.create({ key: "main" });
  return doc;
};

// Push the stored SMTP values into the mail service (called on boot and on save)
const loadSmtpIntoMailer = async () => {
  const doc = await getDoc();
  applySmtpOverrides({
    host: doc.smtp.host,
    port: doc.smtp.port,
    secure: doc.smtp.secure,
    user: doc.smtp.user,
    pass: decrypt(doc.smtp.passEncrypted),
    from: doc.smtp.from,
  });
  return doc;
};

const publicSmtp = (doc) => {
  const effective = getConfig();
  return {
    host: effective.host,
    port: effective.port,
    secure: effective.secure,
    user: effective.user,
    from: effective.from,
    // The password is never sent back, only whether one is configured
    passSet: Boolean(effective.pass),
    configured: effective.missing.length === 0,
    missing: effective.missing,
  };
};

const publicCompany = (doc) => {
  const out = {};
  COMPANY_FIELDS.forEach((field) => {
    out[field] = doc.company?.[field] ?? "";
  });
  return out;
};

const getSettings = async (_req, res) => {
  try {
    const doc = await getDoc();
    return res.json({
      success: true,
      company: publicCompany(doc),
      smtp: publicSmtp(doc),
    });
  } catch (error) {
    return fail(res, 500, "Failed to load settings", error);
  }
};

const updateCompany = async (req, res) => {
  try {
    const body = req.body || {};
    const doc = await getDoc();

    if (body.email && !EMAIL_RE.test(String(body.email).trim())) {
      return fail(res, 400, "Company email is not valid");
    }
    if (!String(body.name ?? doc.company.name ?? "").trim()) {
      return fail(res, 400, "Company name is required");
    }

    COMPANY_FIELDS.forEach((field) => {
      if (body[field] !== undefined) {
        doc.company[field] = String(body[field]);
      }
    });
    await doc.save();

    return res.json({ success: true, company: publicCompany(doc) });
  } catch (error) {
    return fail(res, 500, "Failed to save company details", error);
  }
};

const updateSmtp = async (req, res) => {
  try {
    const { host, port, secure, user, pass, from, clearPassword } = req.body || {};
    const doc = await getDoc();

    if (host !== undefined) {
      const value = String(host).trim();
      if (value && !/^[A-Za-z0-9.-]+$/.test(value)) {
        return fail(res, 400, "SMTP host is not valid");
      }
      doc.smtp.host = value;
    }
    if (port !== undefined && port !== "") {
      const value = Number(port);
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        return fail(res, 400, "SMTP port must be between 1 and 65535");
      }
      doc.smtp.port = value;
    }
    if (secure !== undefined) doc.smtp.secure = Boolean(secure);
    if (user !== undefined) {
      const value = String(user).trim();
      if (value && !EMAIL_RE.test(value)) {
        return fail(res, 400, "SMTP username must be the full email address");
      }
      doc.smtp.user = value;
    }
    if (from !== undefined) {
      const value = String(from).trim();
      if (value && !FROM_RE.test(value)) {
        return fail(res, 400, 'Sender must look like "Name <email@domain.com>"');
      }
      doc.smtp.from = value;
    }
    // Blank password = keep the current one
    if (typeof pass === "string" && pass !== "") {
      doc.smtp.passEncrypted = encrypt(pass);
    } else if (clearPassword) {
      doc.smtp.passEncrypted = "";
    }
    await doc.save();

    const fresh = await loadSmtpIntoMailer();
    const status = await checkSmtpConnection();
    logSmtpStatus(status);

    return res.json({
      success: true,
      smtp: publicSmtp(fresh),
      connection: {
        connected: status.connected,
        code: status.code,
        responseCode: status.responseCode,
        message: status.message,
        hints: status.hints,
        latencyMs: status.latencyMs,
        missing: status.missing,
      },
    });
  } catch (error) {
    return fail(res, 500, "Failed to save email settings", error);
  }
};

const testSmtp = async (req, res) => {
  const to = String(req.body?.to || "").trim();
  if (!EMAIL_RE.test(to)) {
    return fail(res, 400, "A valid recipient email is required");
  }
  try {
    await sendMail({
      to,
      subject: "BuzingBee SMTP test",
      text: `This is a test email from the BuzingBee admin panel, sent ${new Date().toISOString()}.`,
    });
    return res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    return fail(res, 502, "Failed to send the test email", error);
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, "Choose an image to upload");
    const detected = sniffImageType(req.file.buffer);
    if (!detected) return fail(res, 400, "The uploaded file is not a valid image");
    req.file.mimetype = detected;
    const url = await uploadLogoAndGetUrl(req.file);
    if (!url) return fail(res, 400, "The uploaded file was empty");

    const doc = await getDoc();
    doc.company.logoUrl = url;
    await doc.save();
    return res.json({ success: true, logoUrl: url });
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.message || "Failed to upload the logo",
    );
  }
};

const removeLogo = async (_req, res) => {
  try {
    const doc = await getDoc();
    doc.company.logoUrl = "";
    await doc.save();
    return res.json({ success: true, logoUrl: "" });
  } catch (error) {
    return fail(res, 500, "Failed to remove the logo", error);
  }
};

module.exports = {
  uploadLogo,
  removeLogo,
  getSettings,
  updateCompany,
  updateSmtp,
  testSmtp,
  loadSmtpIntoMailer,
};
