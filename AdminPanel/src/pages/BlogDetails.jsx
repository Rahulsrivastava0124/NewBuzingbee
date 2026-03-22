import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { blogAPI } from "../services/api";
import "./SimplePage.css";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BlogDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await blogAPI.getById(id, { trackView: true });
        if (!data) {
          setBlog(null);
          return;
        }

        setBlog(data);
      } catch (err) {
        setError(err.message || "Failed to load blog details");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="simple-page">
        <h1>Blog Details</h1>
        <p>Loading blog details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <h1>Blog Details</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="simple-page">
        <h1>Blog Details</h1>
        <p>Blog not found.</p>
      </div>
    );
  }

  return (
    <div className="simple-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Back
      </button>

      <h1>{blog.title}</h1>

      <div className="traffic-stats" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-header">
            <User size={16} />
            <span>Author</span>
          </div>
          <div className="stat-value" style={{ fontSize: "18px" }}>
            {blog.author || "Admin"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <Calendar size={16} />
            <span>Status</span>
          </div>
          <div className="stat-value" style={{ fontSize: "18px" }}>
            {blog.status || "draft"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <Tag size={16} />
            <span>Category</span>
          </div>
          <div className="stat-value" style={{ fontSize: "18px" }}>
            {blog.category || "General"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <Tag size={16} />
            <span>Views</span>
          </div>
          <div className="stat-value" style={{ fontSize: "18px" }}>
            {(blog.views || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {blog.image && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={blog.image}
            alt={blog.title}
            style={{
              width: "100%",
              maxHeight: "420px",
              objectFit: "cover",
              borderRadius: "12px",
            }}
          />
        </div>
      )}

      <div className="traffic-card" style={{ marginBottom: "16px" }}>
        <h3>Metadata</h3>
        <p>
          <strong>Published:</strong> {formatDate(blog.publishedAt)}
        </p>
        <p>
          <strong>Scheduled:</strong> {formatDate(blog.scheduledAt)}
        </p>
        <p>
          <strong>Created:</strong> {formatDate(blog.createdAt)}
        </p>
        <p>
          <strong>Updated:</strong> {formatDate(blog.updatedAt)}
        </p>
      </div>

      <div className="traffic-card">
        <h3>Content</h3>
        <div dangerouslySetInnerHTML={{ __html: blog.content || "" }} />
      </div>
    </div>
  );
}
