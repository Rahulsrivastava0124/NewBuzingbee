import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Sun,
  LogOut,
  LayoutDashboard,
  FileText,
  Edit3,
  Clock,
  Users,
  Settings,
  TrendingUp,
} from "lucide-react";
import { authHelper, blogAPI } from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ total: 0, drafts: 0, scheduled: 0 });

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const statusFromQuery = new URLSearchParams(location.search).get("status");

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const stats = await blogAPI.getStats();
        setCounts({
          total: stats.total || 0,
          drafts: stats.drafts || 0,
          scheduled: stats.scheduled || 0,
        });
      } catch {
        // ignore sidebar count failure
      }
    };

    loadCounts();
  }, [location.pathname]);

  const handleLogout = () => {
    authHelper.removeToken();
    navigate("/login");
  };

  const getBreadcrumb = () => {
    const path = location.pathname;

    if (path === "/dashboard" || path === "/dashboard/") {
      return { main: "Dashboard", sub: "Overview" };
    } else if (path.startsWith("/dashboard/blogs")) {
      if (statusFromQuery === "draft") {
        return { main: "Content", sub: "Drafts" };
      } else if (statusFromQuery === "scheduled") {
        return { main: "Content", sub: "Scheduled" };
      }
      return { main: "Content", sub: "All Blogs" };
    } else if (path.startsWith("/dashboard/create-blog")) {
      return { main: "Content", sub: "Create Blog" };
    } else if (path.startsWith("/dashboard/edit-blog")) {
      return { main: "Content", sub: "Edit Blog" };
    } else if (path.startsWith("/dashboard/traffic")) {
      return { main: "Analytics", sub: "Traffic & Leads" };
    } else if (path.startsWith("/dashboard/audience")) {
      return { main: "Manage", sub: "Audience" };
    } else if (path.startsWith("/dashboard/settings")) {
      return { main: "Manage", sub: "Settings" };
    }

    return { main: "Dashboard", sub: "Overview" };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="dark-dashboard">
      {/* Sidebar */}
      <aside className="dark-sidebar">
        <div className="dark-logo-area">
          <div className="dark-logo-icon">🐝</div>
          <div>
            <div className="dark-logo-text">BuzingBee</div>
            <div className="dark-logo-subtitle">ADMIN PANEL</div>
          </div>
        </div>

        <nav className="dark-nav-section">
          <div className="dark-nav-label">OVERVIEW</div>
          <div
            className={`dark-nav-item ${isActive("/dashboard") && location.pathname === "/dashboard" ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
        </nav>

        <nav className="dark-nav-section">
          <div className="dark-nav-label">CONTENT</div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/blogs") ? "active" : ""}`}
            onClick={() => navigate("/dashboard/blogs")}
          >
            <FileText size={20} />
            <span>All Blogs</span>
            <span className="dark-nav-badge">{counts.total}</span>
          </div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/blogs") && statusFromQuery === "draft" ? "active" : ""}`}
            onClick={() => navigate("/dashboard/blogs?status=draft")}
          >
            <Edit3 size={20} />
            <span>Drafts</span>
            <span className="dark-nav-badge">{counts.drafts}</span>
          </div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/blogs") && statusFromQuery === "scheduled" ? "active" : ""}`}
            onClick={() => navigate("/dashboard/blogs?status=scheduled")}
          >
            <Clock size={20} />
            <span>Scheduled</span>
            <span className="dark-nav-badge">{counts.scheduled}</span>
          </div>
        </nav>

        <nav className="dark-nav-section">
          <div className="dark-nav-label">MANAGE</div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/traffic") ? "active" : ""}`}
            onClick={() => navigate("/dashboard/traffic")}
          >
            <TrendingUp size={20} />
            <span>Traffic & Leads</span>
          </div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/audience") ? "active" : ""}`}
            onClick={() => navigate("/dashboard/audience")}
          >
            <Users size={20} />
            <span>Audience</span>
          </div>
          <div
            className={`dark-nav-item ${isActive("/dashboard/settings") ? "active" : ""}`}
            onClick={() => navigate("/dashboard/settings")}
          >
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>

        <div className="dark-user-card">
          <div className="dark-user-avatar">A</div>
          <div className="dark-user-details">
            <div className="dark-user-name">Admin</div>
            <div className="dark-user-email">rahul24srivastava20...</div>
          </div>
          <button
            className="dark-logout-btn"
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="dark-main-area">
        {/* Topbar */}
        <header className="dark-topbar">
          <div className="dark-breadcrumb">
            {breadcrumb.main} <span>/ {breadcrumb.sub}</span>
          </div>

          <div className="dark-search-bar">
            <svg
              className="dark-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="dark-search-input"
              placeholder="Search posts..."
            />
          </div>

          <div className="dark-topbar-actions">
            <button className="dark-icon-btn">
              <Bell size={20} />
              <span className="dark-notification-dot"></span>
            </button>
            <button className="dark-icon-btn">
              <Sun size={20} />
            </button>
            <button
              className="dark-cta-btn"
              onClick={() => navigate("/dashboard/create-blog")}
            >
              + New Post
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="dark-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
