import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Eye, X, MessageSquare, RefreshCw } from "lucide-react";
import { enquiryAPI } from "../services/api";
import "./BlogList.css";
import "./Enquiries.css";

const STATUS_COLORS = {
  new: "status-published",
  read: "status-draft",
  replied: "status-review",
  archived: "status-scheduled",
};

const STATUS_LABELS = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const SERVICE_LABELS = {
  "web-development": "Web Development",
  "mobile-app": "Mobile App",
  "ai-ml": "AI & ML",
  seo: "SEO",
  "social-media": "Social Media",
  ppc: "Google & Meta Ads",
  "email-marketing": "Email Marketing",
  branding: "Branding",
  ecommerce: "E-Commerce",
  other: "Other",
};

const BUDGET_LABELS = {
  "below-5k": "Below ₹5,000",
  "5k-10k": "₹5,000 – ₹10,000",
  "10k-25k": "₹10,000 – ₹25,000",
  "25k-50k": "₹25,000 – ₹50,000",
  "50k-1l": "₹50,000 – ₹1,00,000",
  "above-1l": "Above ₹1,00,000",
};

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEnquiries = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) setLoading(true);
        const filters = {};
        if (filterStatus !== "all") filters.status = filterStatus;
        if (searchTerm.trim()) filters.search = searchTerm.trim();
        const data = await enquiryAPI.getAll(filters);
        setEnquiries(data.enquiries || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [filterStatus, searchTerm],
  );

  useEffect(() => {
    fetchEnquiries({ showLoader: true });
  }, [fetchEnquiries]);

  const handleOpen = async (enquiry) => {
    setSelected(enquiry);
    setNoteText(enquiry.adminNotes || "");
    if (enquiry.status === "new") {
      try {
        setDetailLoading(true);
        const updated = await enquiryAPI.getById(enquiry._id);
        setSelected(updated);
        setEnquiries((prev) =>
          prev.map((e) => (e._id === updated._id ? updated : e)),
        );
      } catch {
        /* ignore */
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSelected(null);
    setNoteText("");
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await enquiryAPI.update(id, { status });
      setEnquiries((prev) => prev.map((e) => (e._id === id ? updated : e)));
      if (selected?._id === id) setSelected(updated);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await enquiryAPI.update(selected._id, {
        adminNotes: noteText,
      });
      setSelected(updated);
      setEnquiries((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e)),
      );
    } catch (err) {
      alert("Failed to save note: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enquiry permanently?")) return;
    try {
      await enquiryAPI.delete(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id));
      if (selected?._id === id) handleClose();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="blog-list-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-list-container">
      {/* Header */}
      <div className="blog-list-header">
        <div className="header-left">
          <h1>Enquiries</h1>
          <p className="subtitle">
            {total} total &nbsp;·&nbsp;
            <span className="enq-new-badge">
              {enquiries.filter((e) => e.status === "new").length} new
            </span>
          </p>
        </div>
        <button
          className="btn-create"
          onClick={() => fetchEnquiries({ showLoader: true })}
          title="Refresh"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <p style={{ color: "#f87171", marginBottom: 12 }}>{error}</p>}

      {/* Controls */}
      <div className="blog-list-controls">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {["all", "new", "read", "replied", "archived"].map((s) => (
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

      {/* Table */}
      {enquiries.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={40} style={{ color: "#4b5563", marginBottom: 12 }} />
          <p>No enquiries found.</p>
        </div>
      ) : (
        <div className="blog-table-wrapper">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Service</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr
                  key={enq._id}
                  className={enq.status === "new" ? "enq-row-new" : ""}
                >
                  <td>
                    <div className="enq-name-cell">
                      {enq.status === "new" && (
                        <span className="enq-dot" title="New enquiry" />
                      )}
                      <span className="enq-name-text">{enq.name}</span>
                    </div>
                  </td>
                  <td>{enq.email}</td>
                  <td>{SERVICE_LABELS[enq.service] || enq.service || "—"}</td>
                  <td>{BUDGET_LABELS[enq.budget] || enq.budget || "—"}</td>
                  <td>
                    <span className={`enq-status-badge enq-status-${enq.status}`}>
                      {STATUS_LABELS[enq.status] || enq.status}
                    </span>
                  </td>
                  <td>{formatDate(enq.createdAt)}</td>
                  <td>
                    <div className="blog-actions">
                      <button
                        className="action-btn view"
                        title="View"
                        onClick={() => handleOpen(enq)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="action-btn danger"
                        title="Delete"
                        onClick={() => handleDelete(enq._id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="enq-overlay" onClick={handleClose}>
          <div
            className="enq-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="enq-drawer-header">
              <h2>Enquiry Detail</h2>
              <button className="enq-close-btn" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : (
              <div className="enq-drawer-body">
                {/* Status control */}
                <div className="enq-field-row">
                  <label>Status</label>
                  <div className="enq-status-pills">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        className={`enq-status-pill ${selected.status === val ? "active" : ""}`}
                        onClick={() => handleStatusChange(selected._id, val)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caller info */}
                <div className="enq-info-grid">
                  <div className="enq-info-item">
                    <span className="enq-label">Name</span>
                    <span className="enq-value">{selected.name}</span>
                  </div>
                  <div className="enq-info-item">
                    <span className="enq-label">Email</span>
                    <a href={`mailto:${selected.email}`} className="enq-link">
                      {selected.email}
                    </a>
                  </div>
                  {selected.phone && (
                    <div className="enq-info-item">
                      <span className="enq-label">Phone</span>
                      <a href={`tel:${selected.phone}`} className="enq-link">
                        {selected.phone}
                      </a>
                    </div>
                  )}
                  {selected.service && (
                    <div className="enq-info-item">
                      <span className="enq-label">Service</span>
                      <span className="enq-value">
                        {SERVICE_LABELS[selected.service] || selected.service}
                      </span>
                    </div>
                  )}
                  {selected.budget && (
                    <div className="enq-info-item">
                      <span className="enq-label">Budget</span>
                      <span className="enq-value">
                        {BUDGET_LABELS[selected.budget] || selected.budget}
                      </span>
                    </div>
                  )}
                  <div className="enq-info-item">
                    <span className="enq-label">Received</span>
                    <span className="enq-value">{formatDate(selected.createdAt)}</span>
                  </div>
                  <div className="enq-info-item">
                    <span className="enq-label">Source</span>
                    <span className="enq-value">{selected.source || "contact-form"}</span>
                  </div>
                </div>

                {/* Message */}
                <div className="enq-message-block">
                  <span className="enq-label">Message</span>
                  <p className="enq-message-text">{selected.message}</p>
                </div>

                {/* Quick reply button */}
                <a
                  href={`mailto:${selected.email}?subject=Re: Your Enquiry at BuzingBee`}
                  className="enq-reply-btn"
                  onClick={() => handleStatusChange(selected._id, "replied")}
                >
                  Reply via Email
                </a>

                {/* Admin notes */}
                <div className="enq-notes-block">
                  <span className="enq-label">Admin Notes</span>
                  <textarea
                    className="enq-notes-input"
                    rows={3}
                    placeholder="Add internal notes about this enquiry..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button
                    className="enq-save-note-btn"
                    onClick={handleSaveNote}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
