const nodemailer = require("nodemailer");

// Outgoing mail is configured only from the database (Settings > Email in the
// admin panel). There are no SMTP_* environment variables.
const DEFAULT_PORT = 465;
// Some providers greet slowly (Titan took 10-20s); a generous timeout avoids
// false "Greeting never received" errors.
const TIMEOUT_MS = 45000;

const log = (level, message, meta) => {
  const line = `[SMTP] ${message}`;
  if (meta === undefined) console[level](line);
  else console[level](line, meta);
};

let settings = {};
let transporter = null;

// Called with the saved Settings document on boot and whenever it changes.
const applySmtpOverrides = (values = {}) => {
  settings = {
    host: String(values.host || "").trim(),
    port: Number(values.port) || undefined,
    secure: typeof values.secure === "boolean" ? values.secure : undefined,
    user: String(values.user || "").trim(),
    pass: values.pass || "",
    from: String(values.from || "").trim(),
  };
  transporter = null; // rebuild with the new credentials on next use
};

const getConfig = () => {
  const port = settings.port || DEFAULT_PORT;
  const secure =
    typeof settings.secure === "boolean" ? settings.secure : port === 465;
  const { host, user, pass } = settings;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: settings.from || user,
    timeoutMs: TIMEOUT_MS,
    missing: [
      !host && "host",
      !user && "username",
      !pass && "password",
    ].filter(Boolean),
  };
};

const getTransporter = () => {
  const config = getConfig();
  if (config.missing.length) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      // Port 587 must upgrade via STARTTLS; never fall back to plain text
      requireTLS: !config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: config.timeoutMs,
      greetingTimeout: config.timeoutMs,
      socketTimeout: config.timeoutMs * 2,
    });
  }
  return transporter;
};

// Explains the usual reasons for a rejected login without revealing the password.
const authHints = () => {
  const { pass, user } = getConfig();
  const hints = [`Password length as saved: ${pass.length} characters`];
  if (pass !== pass.trim()) {
    hints.push("The saved password has leading or trailing whitespace");
  }
  hints.push(
    `Confirm that ${user || "this address"} and the same password sign in to the provider's webmail`,
  );
  hints.push(
    "The mailbox must be a real mailbox (not an alias or forward) with SMTP sign-in allowed",
  );
  return hints;
};

// Opens a connection and authenticates; never throws, never logs the password.
const checkSmtpConnection = async () => {
  const config = getConfig();
  const base = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
  };

  if (config.missing.length) {
    return { connected: false, ...base, missing: config.missing };
  }

  const startedAt = Date.now();
  try {
    await getTransporter().verify();
    return { connected: true, ...base, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      connected: false,
      ...base,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
      ...(error.code === "EAUTH" ? { hints: authHints() } : {}),
    };
  }
};

const logSmtpStatus = (status) => {
  if (status.connected) {
    log("log", "Connected", {
      host: status.host,
      port: status.port,
      secure: status.secure,
      user: status.user,
      latencyMs: status.latencyMs,
    });
    return;
  }
  if (status.missing?.length) {
    log(
      "warn",
      `Not configured (missing ${status.missing.join(", ")}). Add it in the admin panel under Settings > Email.`,
    );
    return;
  }
  log("warn", "Not ready", {
    host: status.host,
    port: status.port,
    secure: status.secure,
    user: status.user || undefined,
    code: status.code,
    responseCode: status.responseCode,
    message: status.message,
    hints: status.hints,
  });
};

// Sends mail and logs the outcome. Throws on failure so callers can react.
const sendMail = async ({ to, subject, text, html, replyTo, attachments }) => {
  const config = getConfig();
  const mailer = getTransporter();
  if (!mailer) {
    const err = new Error(
      `Email is not configured (missing ${config.missing.join(", ")}). Set it in Settings > Email.`,
    );
    log("error", `Send skipped: ${err.message}`);
    throw err;
  }

  try {
    const info = await mailer.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments,
    });
    log("log", "Sent", {
      to,
      subject,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    return info;
  } catch (error) {
    log("error", "Send failed", {
      to,
      subject,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    });
    throw error;
  }
};

module.exports = {
  checkSmtpConnection,
  logSmtpStatus,
  sendMail,
  getConfig,
  applySmtpOverrides,
};
