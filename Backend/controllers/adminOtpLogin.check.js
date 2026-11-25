// Run: node controllers/adminOtpLogin.check.js  (no database or network needed)
// Admin sign-in with a WhatsApp code: the code goes to the number saved on the
// account using the login_otp template, a right code signs in (super admin too),
// wrong codes are counted, and unknown numbers get the same reply as known ones.
process.env.AUTHKEY_API_KEY = "test-key";
const assert = require("assert");
const Admin = require("../models/Admin");
const OtpCode = require("../models/OtpCode");
const mailService = require("../services/mailService");
let mails = [];
mailService.sendMail = async (msg) => mails.push(msg);
const {
  sendLoginOtp,
  verifyLoginOtp,
  sendEmailLoginOtp,
  verifyEmailLoginOtp,
} = require("./adminOtpLoginController");
const { hashCode } = require("../utils/whatsappOtp");

const fakeRes = () => {
  const res = { statusCode: 200 };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};
const fakeReq = (body) => ({ body, method: "POST", originalUrl: "/api/admin/login/otp", headers: {}, ip: "127.0.0.1" });

const superAdmin = new Admin({
  username: "team",
  email: "team@buzingbee.com",
  role: "super",
  phone: "+91 95079 81942",
});
const other = new Admin({ username: "a", email: "a@x.com", role: "admin", phone: "" });
Admin.find = async () => [superAdmin, other];
Admin.prototype.save = async function () {};

let codes = [];
OtpCode.findOne = () => ({ sort: async () => codes[codes.length - 1] || null });
OtpCode.deleteMany = async () => (codes = []);
OtpCode.create = async (doc) => {
  const row = { ...doc, attempts: 0, createdAt: new Date(Date.now() - 120000), save: async () => {} };
  codes.push(row);
  return row;
};

let sent = [];
global.fetch = async (url) => {
  sent.push(new URL(url).searchParams);
  return { ok: true, text: async () => "Submitted Successfully" };
};

(async () => {
  // Unknown number: same success reply, nothing sent
  let res = fakeRes();
  await sendLoginOtp(fakeReq({ phone: "9876543210" }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(sent.length, 0);

  // Super admin's number (typed differently): code sent with login_otp template
  res = fakeRes();
  await sendLoginOtp(fakeReq({ phone: "09507981942" }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].get("wid"), "55579");
  assert.strictEqual(sent[0].get("mobile"), "9507981942");
  const code = sent[0].get("1");
  assert.strictEqual(codes[0].codeHash, hashCode("admin-login:9507981942", code));

  // Wrong code is counted and rejected
  res = fakeRes();
  const wrong = code === "000000" ? "111111" : "000000";
  await verifyLoginOtp(fakeReq({ phone: "9507981942", code: wrong }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(codes[0].attempts, 1);

  // Right code on the wrong portal is refused
  res = fakeRes();
  await verifyLoginOtp(fakeReq({ phone: "9507981942", code, portal: "team" }), res);
  assert.strictEqual(res.statusCode, 403);

  // Right code on the super portal signs in
  codes = [];
  await OtpCode.create({ phone: "admin-login:9507981942", codeHash: hashCode("admin-login:9507981942", code), expiresAt: new Date(Date.now() + 60000) });
  res = fakeRes();
  await verifyLoginOtp(fakeReq({ phone: "+919507981942", code, portal: "super" }), res);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.ok(res.body.token);
  assert.strictEqual(res.body.data.role, "super");
  assert.strictEqual(codes.length, 0, "code is single-use");

  // Bad input
  res = fakeRes();
  await sendLoginOtp(fakeReq({ phone: "12345" }), res);
  assert.strictEqual(res.statusCode, 400);

  // Email code: unknown address gets the same reply and no mail
  codes = [];
  Admin.findOne = async ({ email }) => [superAdmin, other].find((a) => a.email === email) || null;
  res = fakeRes();
  await sendEmailLoginOtp(fakeReq({ email: "nobody@x.com" }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(mails.length, 0);

  // Super admin's address (any case): code emailed, then signs in on the super portal
  res = fakeRes();
  await sendEmailLoginOtp(fakeReq({ email: " Team@BuzingBee.com " }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(mails.length, 1);
  assert.strictEqual(mails[0].to, "team@buzingbee.com");
  const mailCode = mails[0].subject.match(/[0-9]{6}/)[0];
  assert.strictEqual(codes[0].codeHash, hashCode("admin-email-login:team@buzingbee.com", mailCode));

  res = fakeRes();
  await verifyEmailLoginOtp(fakeReq({ email: "team@buzingbee.com", code: mailCode === "000000" ? "111111" : "000000" }), res);
  assert.strictEqual(res.statusCode, 400);

  res = fakeRes();
  await verifyEmailLoginOtp(fakeReq({ email: "team@buzingbee.com", code: mailCode, portal: "super" }), res);
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.data.role, "super");
  assert.strictEqual(codes.length, 0, "email code is single-use");

  res = fakeRes();
  await sendEmailLoginOtp(fakeReq({ email: "not-an-email" }), res);
  assert.strictEqual(res.statusCode, 400);

  console.log("admin OTP login: all checks passed");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
