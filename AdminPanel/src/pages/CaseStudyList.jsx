import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { caseStudyAPI } from "../services/api";
import "./BlogList.css"; /* reuse existing list styles */

export default function CaseStudyList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchItems = async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) setLoading(true);
        const filters = filterStatus !== "all" ? { status: filterStatus } : {};
        const data = await caseStudyAPI.getAll(filters);
        if (isMounted) setItems(data || []);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (showLoader && isMounted) setLoading(false);
      }
    };

    fetchItems({ showLoader: true });
    const id = window.setInterval(() => fetchItems(), 15000);
    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, [filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this case study?")) return;
    try {
      await caseStudyAPI.delete(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.client || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="blog-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading case studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list-container">
      <div className="blog-list-header">
        <div className="header-left">
          <h1>Case Studies</h1>
          <p className="subtitle">{filtered.length} total case studies</p>
        </div>
        <button
          className="btn-create"
          onClick={() => navigate("/dashboard/create-case-study")}
        >
          <Plus size={18} />
          Add Case Study
        </button>
      </div>

      {error && <p style={{ color: "#f87171", marginBottom: 12 }}>{error}</p>}

      <div className="blog-list-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search case studies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {["all", "published", "draft"].map((s) => (
            <button
              key={s}
              className={`filter-btn ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No case studies found. Use the &quot;Add Case Study&quot; button above to get started.</p>
        </div>
      ) : (
        <div className="blog-table-wrapper">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Industry</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="blog-title-cell">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="blog-thumb"
                        />
                      )}
                      <div>
                        <div className="blog-title-text">{item.title}</div>
                        <div className="blog-excerpt-text">{item.summary || item.client}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.client || "—"}</td>
                  <td>{item.industry || "—"}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        item.status === "published"
                          ? "status-published"
                          : "status-draft"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="blog-actions">
                      <button
                        className="action-btn view"
                        title="View"
                        onClick={() =>
                          navigate(`/dashboard/case-study/${item._id}`)
                        }
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn edit"
                        title="Edit"
                        onClick={() =>
                          navigate(`/dashboard/edit-case-study/${item._id}`)
                        }
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete"
                        title="Delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
