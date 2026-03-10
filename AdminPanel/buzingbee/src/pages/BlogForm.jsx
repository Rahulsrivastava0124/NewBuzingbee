import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, Image } from "lucide-react";
import ReactQuill from "react-quill-new";
import { blogAPI } from "../services/api";
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

const isContentEmpty = (html = "") => {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return text.length === 0;
};

export default function BlogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    status: "draft",
    scheduledAt: "",
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadBlog = async () => {
      if (!isEditing) return;

      try {
        setLoading(true);
        const blog = await blogAPI.getById(id);
        if (blog) {
          const toDatetimeLocal = (value) => {
            if (!value) return "";
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return "";
            const pad = (n) => String(n).padStart(2, "0");
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          };

          setFormData({
            title: blog.title || "",
            slug: blog.slug || "",
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            category: blog.category || "",
            tags: Array.isArray(blog.tags)
              ? blog.tags.join(", ")
              : blog.tags || "",
            status: blog.status || "draft",
            scheduledAt: toDatetimeLocal(blog.scheduledAt),
            featuredImage: blog.image || "",
            seoTitle: blog.seo?.title || "",
            seoDescription: blog.seo?.description || "",
            seoKeywords: Array.isArray(blog.seo?.keywords)
              ? blog.seo.keywords.join(", ")
              : "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "featuredImage") {
      setPreviewError(false);
      setImageFile(null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === "title") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({
        ...prev,
        slug,
      }));
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
    setMessage("Image selected. It will be uploaded when you save/publish.");
    e.target.value = "";
  };

  useEffect(() => {
    return () => {
      if (imageFile && formData.featuredImage?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.featuredImage);
      }
    };
  }, [imageFile, formData.featuredImage]);

  const submitWithStatus = async (statusOverride) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const effectiveStatus = statusOverride || formData.status;
      if (effectiveStatus === "scheduled" && !formData.scheduledAt) {
        setError(
          "Please select schedule date & time for scheduled publishing.",
        );
        setLoading(false);
        return;
      }

      if (isContentEmpty(formData.content)) {
        setError("Please add blog content before saving.");
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        // Only include image if there's a new file or existing URL (not blob)
        image: imageFile ? "" : (formData.featuredImage?.startsWith("blob:") ? "" : formData.featuredImage || ""),
        imageFile,
        status: effectiveStatus,
        scheduledAt:
          effectiveStatus === "scheduled" ? formData.scheduledAt : "",
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      };

      if (isEditing) {
        await blogAPI.update(id, payload);
        setMessage("Blog updated successfully");
      } else {
        await blogAPI.create(payload);
        setMessage("Blog created successfully");
      }

      setTimeout(() => navigate("/dashboard/blogs"), 500);
    } catch (err) {
      setError(err.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitWithStatus();
  };

  const handleSaveAsDraft = async () => {
    await submitWithStatus("draft");
  };

  const handlePublish = async () => {
    await submitWithStatus("published");
  };

  return (
    <div className="blog-form-container">
      <div className="blog-form-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>{isEditing ? "Edit Blog Post" : "Create New Blog Post"}</h1>
        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveAsDraft}
            disabled={loading}
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handlePublish}
            disabled={loading}
          >
            <Eye size={18} />
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSubmit} className="blog-form">
        <div className="form-main">
          <div className="form-card">
            <div className="form-group">
              <label htmlFor="title">Blog Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter an engaging title for your blog post"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">URL Slug</label>
              <div className="slug-input">
                <span className="slug-prefix">buzingbee.com/blog/</span>
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
              <label htmlFor="excerpt">Excerpt</label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Write a brief summary of your blog post (150-160 characters recommended)"
                rows="3"
                disabled={loading}
              ></textarea>
              <span className="char-count">
                {formData.excerpt.length} / 160
              </span>
            </div>

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
                placeholder="Short SEO description (150-160 chars)"
                rows="3"
                disabled={loading}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="seoKeywords">SEO Keywords</label>
              <input
                type="text"
                id="seoKeywords"
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Content *</label>
              <ReactQuill
                className="content-editor"
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, content: value }))
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Start writing your blog content here..."
                readOnly={loading}
                theme="snow"
              />
            </div>
          </div>
        </div>

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
                    alt="Featured"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                  />
                  {previewError && (
                    <div className="image-preview-error">
                      Could not preview this image. Check URL or upload again.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Category</h3>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select Category</option>
              <option value="technology">Technology</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="sidebar-card">
            <h3>Tags</h3>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="react, javascript, web-dev"
              disabled={loading}
            />
            <p className="helper-text">Separate tags with commas</p>
          </div>

          <div className="sidebar-card">
            <h3>Status</h3>
            <div className="status-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === "draft"}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Draft</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="review"
                  checked={formData.status === "review"}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>In Review</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === "published"}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Published</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="scheduled"
                  checked={formData.status === "scheduled"}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Scheduled</span>
              </label>
            </div>
            {formData.status === "scheduled" && (
              <div
                className="form-group"
                style={{ marginTop: "12px", marginBottom: 0 }}
              >
                <label htmlFor="scheduledAt">Publish At</label>
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
