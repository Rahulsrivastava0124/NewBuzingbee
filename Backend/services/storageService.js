const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const fsp = fs.promises;

let r2Client = null;

const normalizeUrl = (value = "") => String(value).replace(/\/$/, "");

const isR2Configured = () => {
  return Boolean(
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
  );
};

const getR2Client = () => {
  if (r2Client) return r2Client;

  r2Client = new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT ||
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  return r2Client;
};

const createObjectKey = (file, folder = "blogs") => {
  const ext = path.extname(file?.originalname || "").toLowerCase() || ".jpg";
  const safeFolder = String(folder || "blogs").replace(/^\/+|\/+$/g, "");
  return `${safeFolder}/blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

const removeLocalFileIfExists = async (filePath) => {
  if (!filePath) return;

  try {
    await fsp.unlink(filePath);
  } catch (_error) {
    // best-effort cleanup only
  }
};

const readFileBody = async (file) => {
  if (file?.buffer) return file.buffer;
  if (file?.path) return fsp.readFile(file.path);
  return null;
};

const getPublicUrl = (key) => {
  const normalizedPublicBase = normalizeUrl(process.env.R2_PUBLIC_BASE_URL);
  if (normalizedPublicBase) return `${normalizedPublicBase}/${key}`;

  const endpoint = normalizeUrl(
    process.env.R2_ENDPOINT ||
      `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  );
  const bucket = process.env.R2_BUCKET_NAME;
  return `${endpoint}/${bucket}/${key}`;
};

const buildLocalUploadUrl = (req, file) => {
  if (!req || !file?.filename) return "";
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/blogs/${file.filename}`;
};

const uploadBlogImageAndGetUrl = async (req, file) => {
  if (!file) return "";

  if (!isR2Configured()) {
    return buildLocalUploadUrl(req, file);
  }

  const body = await readFileBody(file);
  if (!body) return "";

  const key = createObjectKey(file, "blogs");

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: file.mimetype || "application/octet-stream",
  });

  await getR2Client().send(command);
  await removeLocalFileIfExists(file.path);

  return getPublicUrl(key);
};

module.exports = {
  isR2Configured,
  uploadBlogImageAndGetUrl,
};
