const normalizeApiBaseUrl = (value) => value?.replace(/\/$/, "");

const resolveApiBaseUrl = () => {
  const envApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (envApiBaseUrl) {
    return envApiBaseUrl;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;

    if (hostname === "admin.buzingbee.com") {
      return "https://api.buzingbee.com/api";
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/api";
    }
  }

  return "/api";
};

const API_BASE_URL = resolveApiBaseUrl();

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("authToken");
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
      body: JSON.stringify(credentials),
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

  getHourly: async ({ website, hours = 24 } = {}) => {
    const params = new URLSearchParams();
    if (website) params.append("website", website);
    params.append("hours", String(hours));

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

// Auth helpers
export const authHelper = {
  saveToken: (token) => {
    localStorage.setItem("authToken", token);
  },

  removeToken: () => {
    localStorage.removeItem("authToken");
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};
