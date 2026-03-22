const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} = require("@aws-sdk/client-s3");

let r2Client = null;

const normalizeUrl = (value = "") => String(value).replace(/\/$/, "");

const pickFirst = (...values) => values.find((v) => String(v || "").trim());

const isR2DevPublicEndpoint = (value = "") => {
  const endpoint = normalizeUrl(value).toLowerCase();
  return endpoint.includes(".r2.dev");
};

const getR2Bucket = () =>
  String(
    pickFirst(
      process.env.R2_BUCKET_NAME,
      process.env.R2_BUCKET,
      process.env.AWS_S3_BUCKET,
      process.env.AWS_BUCKET_NAME,
    ) || "",
  ).trim();

const getR2AccessKeyId = () =>
  String(
    pickFirst(process.env.R2_ACCESS_KEY_ID, process.env.AWS_ACCESS_KEY_ID) ||
      "",
  ).trim();

const getR2SecretAccessKey = () =>
  String(
    pickFirst(
      process.env.R2_SECRET_ACCESS_KEY,
      process.env.AWS_SECRET_ACCESS_KEY,
    ) || "",
  ).trim();

const getR2ApiEndpoint = () => {
  const explicitApiEndpoint = normalizeUrl(
    pickFirst(process.env.R2_S3_ENDPOINT, process.env.AWS_ENDPOINT_URL_S3),
  );
  if (explicitApiEndpoint) return explicitApiEndpoint;

  const endpoint = normalizeUrl(process.env.R2_ENDPOINT);
  if (endpoint && !isR2DevPublicEndpoint(endpoint)) return endpoint;

  const accountId = String(process.env.R2_ACCOUNT_ID || "").trim();
  if (!accountId) return "";

  return `https://${accountId}.r2.cloudflarestorage.com`;
};

const getR2PublicBaseUrl = () => {
  const explicitPublicBase = normalizeUrl(process.env.R2_PUBLIC_BASE_URL);
  if (explicitPublicBase) return explicitPublicBase;

  const endpoint = normalizeUrl(process.env.R2_ENDPOINT);
  if (endpoint) return endpoint;

  const apiEndpoint = getR2ApiEndpoint();
  const bucket = getR2Bucket();
  if (!apiEndpoint || !bucket) return "";

  return `${apiEndpoint}/${bucket}`;
};

const isR2Configured = () => {
  return Boolean(
    getR2Bucket() &&
    getR2ApiEndpoint() &&
    getR2AccessKeyId() &&
    getR2SecretAccessKey(),
  );
};

const getMissingR2ConfigFields = () => {
  const missing = [];
  if (!getR2ApiEndpoint()) missing.push("R2_S3_ENDPOINT or R2_ACCOUNT_ID");
  if (!getR2Bucket()) missing.push("R2_BUCKET_NAME");
  if (!getR2AccessKeyId()) missing.push("R2_ACCESS_KEY_ID");
  if (!getR2SecretAccessKey()) missing.push("R2_SECRET_ACCESS_KEY");
  return missing;
};

const getR2Client = () => {
  if (r2Client) return r2Client;

  r2Client = new S3Client({
    region: "auto",
    endpoint: getR2ApiEndpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: getR2AccessKeyId(),
      secretAccessKey: getR2SecretAccessKey(),
    },
  });

  return r2Client;
};

const createObjectKey = (file, folder = "blogs") => {
  const ext = path.extname(file?.originalname || "").toLowerCase() || ".jpg";
  const safeFolder = String(folder || "blogs").replace(/^\/+|\/+$/g, "");
  return `${safeFolder}/blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

const readFileBody = async (file) => {
  if (file?.buffer) return file.buffer;
  return null;
};

const getPublicUrl = (key) => {
  const baseUrl = getR2PublicBaseUrl();
  return `${baseUrl}/${key}`;
};

const getR2StatusSummary = () => ({
  configured: isR2Configured(),
  bucket: getR2Bucket() || "",
  apiEndpoint: getR2ApiEndpoint() || "",
  publicBaseUrl: getR2PublicBaseUrl() || "",
  missing: getMissingR2ConfigFields(),
});

const checkR2Connection = async () => {
  const summary = getR2StatusSummary();

  if (!summary.configured) {
    return {
      ...summary,
      connected: false,
      message: `Missing config: ${summary.missing.join(", ")}`,
    };
  }

  try {
    await getR2Client().send(
      new HeadBucketCommand({
        Bucket: getR2Bucket(),
      }),
    );

    return {
      ...summary,
      connected: true,
      message: "R2 bucket reachable",
    };
  } catch (error) {
    return {
      ...summary,
      connected: false,
      message: error?.message || "Unknown R2 error",
      code: error?.code || error?.name || "R2_ERROR",
    };
  }
};

const uploadBlogImageAndGetUrl = async (_req, file) => {
  if (!file) return "";

  if (!isR2Configured()) {
    const missing = getMissingR2ConfigFields();
    throw new Error(
      `R2 is not configured. Missing: ${missing.join(", ")}. Set R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and either R2_S3_ENDPOINT or R2_ACCOUNT_ID.`,
    );
  }

  const body = await readFileBody(file);
  if (!body) return "";

  const key = createObjectKey(file, "blogs");

  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    Body: body,
    ContentType: file.mimetype || "application/octet-stream",
  });

  try {
    await getR2Client().send(command);
  } catch (error) {
    const msg = String(error?.message || "");
    if (msg.includes("handshake failure") || error?.code === "EPROTO") {
      throw new Error(
        "R2 TLS handshake failed. Use a valid S3 API endpoint (R2_S3_ENDPOINT or R2_ACCOUNT_ID) and keep R2_ENDPOINT/R2_PUBLIC_BASE_URL for public URL only.",
      );
    }
    throw error;
  }

  return getPublicUrl(key);
};

module.exports = {
  checkR2Connection,
  getR2StatusSummary,
  isR2Configured,
  uploadBlogImageAndGetUrl,
};
