const normalizeApiBaseUrl = (value) => value?.replace(/\/$/, "");

// Each role has its own sign-in subdomain: super. / admin. / team.
// (buzingbee.com in production, *.localhost in development). On any other
// host (e.g. plain localhost) there is no portal and every role may sign in.
const PORTAL_ROLES = ["super", "admin", "team"];
const hostLabel = typeof window !== "undefined" ? window.location.hostname.split(".")[0] : "";
export const PORTAL = PORTAL_ROLES.includes(hostLabel) ? hostLabel : null;
export const PORTAL_LABELS = { super: "Super admin", admin: "Admin", team: "Team" };

// Where a role signs in, on the current domain: team -> team.buzingbee.com
export const portalHost = (role) => {
  if (typeof window === "undefined") return "";
  const { hostname, port } = window.location;
  const domain = PORTAL ? hostname.split(".").slice(1).join(".") : "buzingbee.com";
  return `${role}.${domain}${PORTAL && port ? `:${port}` : ""}`;
};

const resolveApiBaseUrl = () => {
  const envApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (envApiBaseUrl) {
    return envApiBaseUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;

    if (/^(super|admin|team)\.buzingbee\.com$/.test(hostname)) {
      return "https://api.buzingbee.com/api";
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/api";
    }
  }

  return "/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const AUTH_TOKEN_KEY = "authToken";
const AUTH_TOKEN_EXPIRY_KEY = "authTokenExpiry";
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_EXPIRY_KEY);
};

const decodeTokenExpiry = (token) => {
  try {
    const payloadPart = token?.split(".")?.[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized));

    if (payload?.exp && Number.isFinite(Number(payload.exp))) {
      return Number(payload.exp) * 1000;
    }
  } catch {
    return null;
  }

  return null;
};

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  const tokenExpiryFromJwt = decodeTokenExpiry(token);
  const tokenExpiryFromStorage = Number(
    localStorage.getItem(AUTH_TOKEN_EXPIRY_KEY) || 0,
  );
  const expiryTime = tokenExpiryFromJwt || tokenExpiryFromStorage;

  if (expiryTime && Date.now() >= expiryTime) {
    clearStoredAuth();
    return null;
  }

  return token;
};

const toFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    // Skip undefined and null, but allow empty strings for specific fields
    if (value === undefined || value === null) return;

    // Skip empty strings except for: image (preserve existing URLs), scheduledAt (to clear scheduled), status (for status updates)
    if (
      value === "" &&
      key !== "image" &&
      key !== "scheduledAt" &&
      key !== "status"
    )
      return;

    if (key === "imageFile" && value instanceof File) {
      formData.append("image", value);
      return;
    }
    formData.append(key, value);
  });

  return formData;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  // An expired/invalid session sends the admin back to the login screen
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/login" &&
    localStorage.getItem(AUTH_TOKEN_KEY)
  ) {
    clearStoredAuth();
    window.location.assign("/login");
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
};

// Admin API
export const adminAPI = {
  // Login
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...credentials, ...(PORTAL && { portal: PORTAL }) }),
    });
    return handleResponse(response);
  },

  // Team members (for "managed by")
  listUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await handleResponse(response);
    return data.admins || [];
  },

  // Forgot / reset password (public)
  forgotPassword: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/admin/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  resetPassword: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // Get admin profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Update admin profile
  updateProfile: async (data) => {
    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Emails a 6-digit code that must accompany a password change
  sendPasswordOtp: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/profile/password-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  // User management (super admin only on the server)
  createUser: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/admin/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // changes: { role?, showBills? }
  updateUser: async (id, changes) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(changes),
    });
    return handleResponse(response);
  },

  deleteUser: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },
};

// Blog API
export const blogAPI = {
  // Get all blogs
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();

    // Public endpoint first
    let response = await fetch(
      `${API_BASE_URL}/blog${query ? `?${query}` : ""}`,
    );

    // Backward-compatible fallback (older backend route)
    if (response.status === 401 || response.status === 403) {
      response = await fetch(
        `${API_BASE_URL}/blog/all${query ? `?${query}` : ""}`,
      );
    }

    const data = await handleResponse(response);
    return data.blogs || [];
  },

  // Get single blog by ID
  getById: async (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.trackView) params.set("trackView", "true");

    const suffix = params.toString() ? `?${params.toString()}` : "";

    let response = await fetch(`${API_BASE_URL}/blog/${id}${suffix}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      response = await fetch(`${API_BASE_URL}/blog/${id}${suffix}`);
    }

    const data = await handleResponse(response);
    return data.blog;
  },

  // Create new blog
  create: async (blogData) => {
    const hasImageFile = blogData?.imageFile instanceof File;
    const response = await fetch(`${API_BASE_URL}/blog`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...(hasImageFile ? {} : { "Content-Type": "application/json" }),
      },
      body: hasImageFile ? toFormData(blogData) : JSON.stringify(blogData),
    });
    const data = await handleResponse(response);
    return data.blog;
  },

  // Update blog
  update: async (id, blogData) => {
    const hasImageFile = blogData?.imageFile instanceof File;
    const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...(hasImageFile ? {} : { "Content-Type": "application/json" }),
      },
      body: hasImageFile ? toFormData(blogData) : JSON.stringify(blogData),
    });
    const data = await handleResponse(response);
    return data.blog;
  },

  // Delete blog
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Get blog statistics
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/blog/stats`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Upload blog image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/blog/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    const data = await handleResponse(response);
    return data.imageUrl;
  },
};

// Analytics API
export const analyticsAPI = {
  track: async ({ page, device, location, website }) => {
    const response = await fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page, device, location, website }),
    });
    return handleResponse(response);
  },

  getOverview: async ({ website, page, device, days = 7 } = {}) => {
    const params = new URLSearchParams();
    if (website) params.append("website", website);
    if (page) params.append("page", page);
    if (device) params.append("device", device);
    params.append("days", String(days));

    const response = await fetch(
      `${API_BASE_URL}/analytics/overview?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    );
    return handleResponse(response);
  },

  getHourly: async ({ website, hours = 24, startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (website) params.append("website", website);
    if (startDate) params.append("startDate", String(startDate));
    if (endDate) params.append("endDate", String(endDate));
    if (!startDate || !endDate) {
      params.append("hours", String(hours));
    }

    const response = await fetch(
      `${API_BASE_URL}/analytics/hourly?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    );
    return handleResponse(response);
  },

  getDetailed: async ({
    website,
    page,
    device,
    days = 7,
    limit = 100,
    skip = 0,
  } = {}) => {
    const params = new URLSearchParams();
    if (website) params.append("website", website);
    if (page) params.append("page", page);
    if (device) params.append("device", device);
    params.append("days", String(days));
    params.append("limit", String(limit));
    params.append("skip", String(skip));

    const response = await fetch(
      `${API_BASE_URL}/analytics/detailed?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    );
    return handleResponse(response);
  },
};

// Enquiry API
export const enquiryAPI = {
  // Get all enquiries
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    const response = await fetch(
      `${API_BASE_URL}/enquiries${query ? `?${query}` : ""}`,
      { headers: { Authorization: `Bearer ${getAuthToken()}` } },
    );
    const data = await handleResponse(response);
    return { enquiries: data.enquiries || [], total: data.total || 0 };
  },

  // Get single enquiry by ID (auto-marks as read)
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/enquiries/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await handleResponse(response);
    return data.enquiry;
  },

  // Update status / admin notes
  update: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/enquiries/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(response);
    return data.enquiry;
  },

  // Delete
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/enquiries/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  // Stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/enquiries/stats`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },
};

// Case Study API
export const caseStudyAPI = {
  // Get all case studies
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    const response = await fetch(
      `${API_BASE_URL}/case-studies${query ? `?${query}` : ""}`,
    );
    const data = await handleResponse(response);
    return data.caseStudies || [];
  },

  // Get single case study by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/case-studies/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await handleResponse(response);
    return data.caseStudy;
  },

  // Create new case study
  create: async (data) => {
    const hasImageFile = data?.imageFile instanceof File;
    const response = await fetch(`${API_BASE_URL}/case-studies`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...(hasImageFile ? {} : { "Content-Type": "application/json" }),
      },
      body: hasImageFile ? toFormData(data) : JSON.stringify(data),
    });
    const res = await handleResponse(response);
    return res.caseStudy;
  },

  // Update case study
  update: async (id, data) => {
    const hasImageFile = data?.imageFile instanceof File;
    const response = await fetch(`${API_BASE_URL}/case-studies/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...(hasImageFile ? {} : { "Content-Type": "application/json" }),
      },
      body: hasImageFile ? toFormData(data) : JSON.stringify(data),
    });
    const res = await handleResponse(response);
    return res.caseStudy;
  },

  // Delete case study
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/case-studies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },

  // Get stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/case-studies/stats`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return handleResponse(response);
  },
};

// Settings API (company details, SMTP)
const settingsRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${API_BASE_URL}/settings${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(response);
};

export const settingsAPI = {
  get: () => settingsRequest(""),
  getBrand: async () => handleResponse(await fetch(`${API_BASE_URL}/settings/brand`)),
  saveCompany: (body) => settingsRequest("/company", { method: "PUT", body }),
  saveSmtp: (body) => settingsRequest("/smtp", { method: "PUT", body }),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await fetch(`${API_BASE_URL}/settings/company/logo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });
    return handleResponse(response);
  },
  removeLogo: () => settingsRequest("/company/logo", { method: "DELETE" }),
  testSmtp: (body) => settingsRequest("/smtp/test", { method: "POST", body }),
};

// Finance API (clients, invoices, payments, expenses, wallet ledger)
const financeRequest = async (path, { method = "GET", body, params } = {}) => {
  const query = params
    ? new URLSearchParams(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "",
        ),
      ).toString()
    : "";
  const response = await fetch(
    `${API_BASE_URL}/finance${path}${query ? `?${query}` : ""}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  return handleResponse(response);
};

export const financeAPI = {
  summary: () => financeRequest("/summary"),
  notifications: (params) => financeRequest("/notifications", { params }),

  clients: {
    getAll: (params) => financeRequest("/clients", { params }),
    ledger: (id) => financeRequest(`/clients/${id}/ledger`),
    create: (body) => financeRequest("/clients", { method: "POST", body }),
    update: (id, body) =>
      financeRequest(`/clients/${id}`, { method: "PUT", body }),
    delete: (id) => financeRequest(`/clients/${id}`, { method: "DELETE" }),
  },

  invoices: {
    getAll: (params) => financeRequest("/invoices", { params }),
    getById: (id) => financeRequest(`/invoices/${id}`),
    create: (body) => financeRequest("/invoices", { method: "POST", body }),
    update: (id, body) =>
      financeRequest(`/invoices/${id}`, { method: "PUT", body }),
    delete: (id) => financeRequest(`/invoices/${id}`, { method: "DELETE" }),
    addPayment: (id, body) =>
      financeRequest(`/invoices/${id}/payments`, { method: "POST", body }),
  },

  payments: {
    delete: (id) => financeRequest(`/payments/${id}`, { method: "DELETE" }),
  },

  expenses: {
    getAll: (params) => financeRequest("/expenses", { params }),
    create: (body) => financeRequest("/expenses", { method: "POST", body }),
    update: (id, body) =>
      financeRequest(`/expenses/${id}`, { method: "PUT", body }),
    delete: (id) => financeRequest(`/expenses/${id}`, { method: "DELETE" }),
  },

  loans: {
    getAll: (params) => financeRequest("/loans", { params }),
    create: (body) => financeRequest("/loans", { method: "POST", body }),
    update: (id, body) => financeRequest(`/loans/${id}`, { method: "PUT", body }),
    delete: (id) => financeRequest(`/loans/${id}`, { method: "DELETE" }),
    addRepayment: (id, body) =>
      financeRequest(`/loans/${id}/repayments`, { method: "POST", body }),
    deleteRepayment: (id, repaymentId) =>
      financeRequest(`/loans/${id}/repayments/${repaymentId}`, { method: "DELETE" }),
  },

  wallet: {
    getLedger: (params) => financeRequest("/wallet", { params }),
    addEntry: (body) => financeRequest("/wallet", { method: "POST", body }),
    deleteEntry: (id) => financeRequest(`/wallet/${id}`, { method: "DELETE" }),
  },
};

// Auth helpers
export const authHelper = {
  saveToken: (token, expiresAt) => {
    const parsedExpiresAt = Number(expiresAt);
    const expiryTime =
      (Number.isFinite(parsedExpiresAt) && parsedExpiresAt > 0
        ? parsedExpiresAt
        : null) ||
      decodeTokenExpiry(token) ||
      Date.now() + TEN_DAYS_MS;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_TOKEN_EXPIRY_KEY, String(expiryTime));
  },

  removeToken: () => {
    clearStoredAuth();
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};
