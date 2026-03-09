import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, Eye, Edit2, Trash2, MoreVertical } from "lucide-react";
import { blogAPI } from "../services/api";
import "./BlogList.css";

export default function BlogList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const status = searchParams.get("status") || "all";
    setFilterStatus(status);
  }, [searchParams]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const filters = filterStatus !== "all" ? { status: filterStatus } : {};
        const response = await blogAPI.getAll(filters);
        setBlogs(response || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [filterStatus]);

  const updateStatusFilter = (status) => {
    setFilterStatus(status);
    if (status === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ status });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      await blogAPI.delete(id);
      setBlogs(blogs.filter((blog) => blog._id !== id));
    } catch (err) {
      alert("Error deleting blog: " + err.message);
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = (blog.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || blog.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusClass = (status) => {
    const classes = {
      published: "status-published",
      draft: "status-draft",
      review: "status-review",
    };
    return classes[status] || "";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="blog-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list-container">
      <div className="blog-list-header">
        <div className="header-left">
          <h1>All Blogs</h1>
          <p className="subtitle">{filteredBlogs.length} total posts</p>
        </div>
        <button
          className="btn-create"
          onClick={() => navigate("/dashboard/create-blog")}
        >
          <Plus size={18} />
          Create New Post
        </button>
      </div>

      <div className="blog-list-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => updateStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === "published" ? "active" : ""}`}
            onClick={() => updateStatusFilter("published")}
          >
            Published
          </button>
          <button
            className={`filter-btn ${filterStatus === "draft" ? "active" : ""}`}
            onClick={() => updateStatusFilter("draft")}
          >
            Drafts
          </button>
          <button
            className={`filter-btn ${filterStatus === "review" ? "active" : ""}`}
            onClick={() => updateStatusFilter("review")}
          >
            In Review
          </button>
          <button
            className={`filter-btn ${filterStatus === "scheduled" ? "active" : ""}`}
            onClick={() => updateStatusFilter("scheduled")}
          >
            Scheduled
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="blog-grid">
        {filteredBlogs.map((blog, index) => (
          <div key={blog._id || blog.id} className="blog-card">
            <div className="blog-card-header">
              <div className="blog-thumbnail">
                {blog.image ? (
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '📝';
                    }}
                  />
                ) : (
                  <span className="blog-thumbnail-placeholder">📝</span>
                )}
              </div>
              <button className="blog-menu-btn">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="blog-card-content">
              <h3>{blog.title}</h3>
              <div className="blog-meta">
                <span className="blog-author">{blog.author || "Admin"}</span>
                <span className="blog-date">
                  {formatDate(blog.createdAt || blog.date)}
                </span>
              </div>
              <div className={`blog-status ${getStatusClass(blog.status)}`}>
                {blog.status
                  ? blog.status.charAt(0).toUpperCase() + blog.status.slice(1)
                  : "Draft"}
              </div>
            </div>

            <div className="blog-card-footer">
              <div className="blog-views">
                <Eye size={16} />
                <span>{(blog.views || 0).toLocaleString()} views</span>
              </div>
              <div className="blog-actions">
                <button
                  className="action-btn"
                  onClick={() =>
                    navigate(`/dashboard/edit-blog/${blog._id || blog.id}`)
                  }
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => handleDelete(blog._id || blog.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No blogs found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
