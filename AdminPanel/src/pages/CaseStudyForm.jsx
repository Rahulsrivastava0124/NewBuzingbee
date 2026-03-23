import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Image, Plus, Trash2 } from "lucide-react";
import ReactQuill from "react-quill-new";
import { caseStudyAPI } from "../services/api";
import "react-quill-new/dist/quill.snow.css";
import "./BlogForm.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
  "image",
];

export default function CaseStudyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    client: "",
    industry: "",
    summary: "",
    challenge: "",
    solution: "",
    results: "",
    category: "",
    tags: "",
    status: "draft",
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  const [metrics, setMetrics] = useState([{ label: "", value: "" }]);
  const [imageFile, setImageFile] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        setLoading(true);
        const cs = await caseStudyAPI.getById(id);
        if (cs) {
          setFormData({
            title: cs.title || "",
            slug: cs.slug || "",
            client: cs.client || "",
            industry: cs.industry || "",
            summary: cs.summary || "",
            challenge: cs.challenge || "",
            solution: cs.solution || "",
            results: cs.results || "",
            category: cs.category || "",
            tags: Array.isArray(cs.tags) ? cs.tags.join(", ") : cs.tags || "",
            status: cs.status || "draft",
            featuredImage: cs.image || "",
            seoTitle: cs.seo?.title || "",
            seoDescription: cs.seo?.description || "",
            seoKeywords: Array.isArray(cs.seo?.keywords)
              ? cs.seo.keywords.join(", ")
              : cs.seo?.keywords || "",
          });
          setMetrics(
            cs.metrics?.length ? cs.metrics : [{ label: "", value: "" }],
          );
        }
      } catch (err) {
        setError(err.message || "Failed to load case study");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "featuredImage") {
      setPreviewError(false);
      setImageFile(null);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageUploadClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.featuredImage?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.featuredImage);
    }
    const localPreviewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setFormData((prev) => ({ ...prev, featuredImage: localPreviewUrl }));
    setPreviewError(false);
    setMessage("Image selected. It will be uploaded when you save.");
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (imageFile && formData.featuredImage?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.featuredImage);
      }
    };
  }, [imageFile, formData.featuredImage]);

  const handleMetricChange = (index, field, value) => {
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const addMetric = () =>
    setMetrics((prev) => [...prev, { label: "", value: "" }]);

  const removeMetric = (index) =>
    setMetrics((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!formData.title.trim()) {
        setError("Title is required");
        return;
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        client: formData.client,
        industry: formData.industry,
        summary: formData.summary,
        challenge: formData.challenge,
        solution: formData.solution,
        results: formData.results,
        metrics: JSON.stringify(
          metrics.filter((m) => m.label.trim() || m.value.trim()),
        ),
        category: formData.category,
        tags: formData.tags,
        status: formData.status,
        image: imageFile
          ? ""
          : formData.featuredImage?.startsWith("blob:")
            ? ""
            : formData.featuredImage || "",
        imageFile,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      };

      if (isEditing) {
        await caseStudyAPI.update(id, payload);
        setMessage("Case study updated successfully");
      } else {
        await caseStudyAPI.create(payload);
        setMessage("Case study created successfully");
      }

      setTimeout(() => navigate("/dashboard/case-studies"), 500);
    } catch (err) {
      setError(err.message || "Failed to save case study");
    } finally {
      setLoading(false);
    }
  };

  const INDUSTRIES = [
    "Technology",
    "Healthcare",
    "E-Commerce",
    "Finance",
    "Education",
    "Real Estate",
    "Marketing",
    "Retail",
    "SaaS",
    "Startup",
    "Other",
  ];

  return (
    <div className="blog-form-container">
      <div className="blog-form-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>{isEditing ? "Edit Case Study" : "New Case Study"}</h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={18} />
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Case Study"
                : "Save Case Study"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-main">
          {/* Basic Info */}
          <div className="form-card">
            <div className="form-group">
              <label htmlFor="title">Case Study Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. How We Helped Acme Grow 300% in 6 Months"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">URL Slug</label>
              <div className="slug-input">
                <span className="slug-prefix">buzingbee.com/case-studies/</span>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-from-title"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="client">Client Name</label>
              <input
                type="text"
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="summary">Summary / Excerpt</label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief overview of the case study (shown on listing page)"
                rows="3"
                disabled={loading}
              />
              <span className="char-count">
                {formData.summary.length} / 200
              </span>
            </div>
          </div>

          {/* Challenge / Solution / Results */}
          <div className="form-card">
            <h3 style={{ color: "#f5c518", marginBottom: 16 }}>
              Case Study Content
            </h3>

            <div className="form-group">
              <label>The Challenge</label>
              <ReactQuill
                className="content-editor"
                value={formData.challenge}
                onChange={(v) => setFormData((p) => ({ ...p, challenge: v }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe the problem the client faced..."
                readOnly={loading}
                theme="snow"
              />
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label>Our Solution</label>
              <ReactQuill
                className="content-editor"
                value={formData.solution}
                onChange={(v) => setFormData((p) => ({ ...p, solution: v }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe the approach and solution provided..."
                readOnly={loading}
                theme="snow"
              />
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <label>Results & Outcomes</label>
              <ReactQuill
                className="content-editor"
                value={formData.results}
                onChange={(v) => setFormData((p) => ({ ...p, results: v }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe the measurable outcomes and results..."
                readOnly={loading}
                theme="snow"
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="form-card">
            <h3 style={{ color: "#f5c518", marginBottom: 16 }}>Key Metrics</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>
              Add key performance indicators (e.g. "Revenue Growth" → "300%")
            </p>
            {metrics.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Label (e.g. Revenue Growth)"
                  value={m.label}
                  onChange={(e) =>
                    handleMetricChange(i, "label", e.target.value)
                  }
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Value (e.g. +300%)"
                  value={m.value}
                  onChange={(e) =>
                    handleMetricChange(i, "value", e.target.value)
                  }
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeMetric(i)}
                  disabled={loading || metrics.length === 1}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMetric}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "1px dashed #4b5563",
                color: "#9ca3af",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <Plus size={14} /> Add Metric
            </button>
          </div>

          {/* SEO */}
          <div className="form-card">
            <h3 style={{ color: "#f5c518", marginBottom: 16 }}>SEO Settings</h3>
            <div className="form-group">
              <label htmlFor="seoTitle">SEO Title</label>
              <input
                type="text"
                id="seoTitle"
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                placeholder="SEO title for search engines"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="seoDescription">Meta Description</label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                placeholder="150-160 characters for Google preview"
                rows="3"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="seoKeywords">SEO Keywords</label>
              <input
                type="text"
                id="seoKeywords"
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="form-sidebar">
          <div className="sidebar-card">
            <h3>Featured Image</h3>
            <div className="image-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                hidden
              />
              <input
                type="text"
                name="featuredImage"
                value={formData.featuredImage}
                onChange={handleChange}
                placeholder="Image URL"
                disabled={loading}
              />
              <button
                type="button"
                className="upload-btn"
                onClick={handleImageUploadClick}
                disabled={loading}
              >
                <Image size={18} />
                Upload Image
              </button>
              {formData.featuredImage && (
                <div className="image-preview">
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                  />
                  {previewError && (
                    <div className="image-preview-error">
                      Could not preview image. Check URL or upload again.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Industry</h3>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-card">
            <h3>Category</h3>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. SEO, Web Design, Branding"
              disabled={loading}
            />
          </div>

          <div className="sidebar-card">
            <h3>Tags</h3>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="seo, growth, startup"
              disabled={loading}
            />
            <p className="helper-text">Separate tags with commas</p>
          </div>

          <div className="sidebar-card">
            <h3>Status</h3>
            <div className="status-options">
              {["draft", "published"].map((s) => (
                <label className="radio-label" key={s}>
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={formData.status === s}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
