import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, TrendingUp, Activity, Inbox } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { blogAPI, analyticsAPI, enquiryAPI } from "../services/api";
import "./DashboardHome.css";

const RANGE_OPTIONS = [
  {
    value: "24h",
    label: "Last 24 Hours",
    shortLabel: "24h",
    mode: "hourly",
    hours: 24,
  },
  {
    value: "7d",
    label: "Last 7 Days",
    shortLabel: "7d",
    mode: "daily",
    days: 7,
  },
  {
    value: "30d",
    label: "Last 1 Month",
    shortLabel: "1m",
    mode: "daily",
    days: 30,
  },
  {
    value: "60d",
    label: "Last 2 Months",
    shortLabel: "2m",
    mode: "daily",
    days: 60,
  },
];

const formatChartTick = (value, isHourly) => {
  if (!value) return "";
  const date = new Date(value);
  if (isHourly) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const CustomTooltip = ({ active, payload, isHourly }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ color: "#64748b", margin: 0, fontSize: "12px" }}>
          {formatChartTick(item.x, isHourly)}
        </p>
        <p
          style={{
            color: "#F5A623",
            margin: "4px 0 0 0",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {payload[0].value} views
        </p>
      </div>
    );
  }
  return null;
};

function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    drafts: 0,
    published: 0,
  });
  const [enqStats, setEnqStats] = useState({ total: 0, new: 0 });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [selectedRangeValue, setSelectedRangeValue] = useState("7d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    trendViews: [],
    topPages: [],
    devices: [],
  });
  const website = "buzingbee";

  const selectedRange =
    RANGE_OPTIONS.find((option) => option.value === selectedRangeValue) ||
    RANGE_OPTIONS[1];

  const isHourlyRange = selectedRange.mode === "hourly";

  const animateValue = (key, start, end, duration) => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      setStats((prev) => ({ ...prev, [key]: value }));

      if (progress === 1) clearInterval(timer);
    }, 16);
  };

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const [statsRes, blogs, enqStatsRes, enqList] = await Promise.all([
          blogAPI.getStats(),
          blogAPI.getAll(),
          enquiryAPI.getStats().catch(() => ({ total: 0, new: 0 })),
          enquiryAPI.getAll({ limit: 4 }).catch(() => ({ enquiries: [] })),
        ]);

        const total = statsRes.total || 0;
        const drafts = statsRes.drafts || 0;
        const published = statsRes.published || 0;

        const timeout = setTimeout(() => {
          animateValue("total", 0, total, 800);
          animateValue("drafts", 0, drafts, 800);
          animateValue("published", 0, published, 800);
        }, 300);

        setRecentBlogs((blogs || []).slice(0, 4));
        setEnqStats({
          total: enqStatsRes.total || 0,
          new: enqStatsRes.new || 0,
        });
        setRecentEnquiries((enqList.enquiries || []).slice(0, 4));

        return () => clearTimeout(timeout);
      } catch {
        setRecentBlogs([]);
      }
    };

    loadDashboardStats();
  }, []);

  useEffect(() => {
    const loadTrafficTrend = async () => {
      setAnalyticsLoading(true);
      try {
        const analyticsRes = isHourlyRange
          ? await analyticsAPI.getHourly({
              website,
              hours: selectedRange.hours,
            })
          : await analyticsAPI.getOverview({
              website,
              days: selectedRange.days,
            });

        setAnalytics({
          totalViews: analyticsRes.totalViews || 0,
          trendViews: isHourlyRange
            ? (analyticsRes.hourlyViews || []).map((item) => ({
                x: item.time,
                views: item.views,
              }))
            : (analyticsRes.dailyViews || []).map((item) => ({
                x: item.date,
                views: item.views,
              })),
          topPages: analyticsRes.topPages || [],
          devices: analyticsRes.devices || [],
        });
      } catch {
        setAnalytics({
          totalViews: 0,
          trendViews: [],
          topPages: [],
          devices: [],
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadTrafficTrend();
  }, [isHourlyRange, selectedRange.days, selectedRange.hours]);

  const chartData = useMemo(
    () =>
      (analytics.trendViews || []).map((item) => ({
        ...item,
        label: formatChartTick(item.x, isHourlyRange),
      })),
    [analytics.trendViews, isHourlyRange],
  );

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dark-home">
      <div className="dark-greeting">
        <h1>
          Welcome back, <span className="dark-highlight">Admin</span> 👋
        </h1>
        <p>Here's what's happening with your blog today.</p>
      </div>

      <div className="dark-stat-cards">
        <div className="dark-stat-card amber">
          <div className="dark-stat-header">
            <div className="dark-stat-icon amber">
              <FileText size={24} />
            </div>
            <div className="dark-stat-badge green">↑ 12%</div>
          </div>
          <div className="dark-stat-number">{stats.total}</div>
          <div className="dark-stat-label">Total Blogs</div>
          <div className="dark-stat-footer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>All time · Updated just now</span>
          </div>
        </div>

        <div className="dark-stat-card blue">
          <div className="dark-stat-header">
            <div className="dark-stat-icon blue">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <div className="dark-stat-badge amber">In progress</div>
          </div>
          <div className="dark-stat-number">{stats.drafts}</div>
          <div className="dark-stat-label">Draft Blogs</div>
          <div className="dark-stat-footer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>In progress</span>
          </div>
        </div>

        <div className="dark-stat-card green">
          <div className="dark-stat-header">
            <div className="dark-stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="dark-stat-badge green">Traffic</div>
          </div>
          <div className="dark-stat-number">{analytics.totalViews}</div>
          <div className="dark-stat-label">
            Traffic & Clicks ({selectedRange.shortLabel})
          </div>
          <div className="dark-stat-footer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>Tracked with analytics API</span>
          </div>
        </div>

        <div className="dark-stat-card red">
          <div className="dark-stat-header">
            <div className="dark-stat-icon red">
              <Inbox size={24} />
            </div>
            {enqStats.new > 0 && (
              <div
                className="dark-stat-badge"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                {enqStats.new} new
              </div>
            )}
          </div>
          <div className="dark-stat-number">{enqStats.total}</div>
          <div className="dark-stat-label">Total Enquiries</div>
          <div className="dark-stat-footer">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>
              {enqStats.new > 0 ? `${enqStats.new} unread` : "All caught up"}
            </span>
          </div>
        </div>
      </div>

      <div className="dark-analytics-card dark-card">
        <div className="dark-card-header">
          <div>
            <h2 className="dark-card-title">Traffic Trend</h2>
            <p className="dark-traffic-range-text">{selectedRange.label}</p>
          </div>
          <div className="dark-traffic-controls">
            <select
              className="dark-traffic-input"
              value={selectedRangeValue}
              onChange={(event) => setSelectedRangeValue(event.target.value)}
              disabled={analyticsLoading}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="dark-chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="transparent"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip isHourly={isHourlyRange} />} />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#F5A623"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                fill="url(#colorViews)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dark-activity-strip">
        <div className="dark-activity-item">
          <div className="dark-activity-dot green"></div>
          <div className="dark-activity-text">
            <span>{stats.published}</span> blogs are published
          </div>
          <div className="dark-activity-time">live</div>
        </div>
        <div className="dark-activity-item">
          <div className="dark-activity-dot blue"></div>
          <div className="dark-activity-text">
            <span>{analytics.topPages[0]?.page || "/dashboard"}</span> top page
          </div>
          <div className="dark-activity-time">
            {analytics.topPages[0]?.views || 0} views
          </div>
        </div>
        <div className="dark-activity-item">
          <div className="dark-activity-dot amber"></div>
          <div className="dark-activity-text">
            <span>
              {analytics.devices.find((d) => d.device === "mobile")?.views || 0}
            </span>{" "}
            mobile visits
          </div>
          <div className="dark-activity-time">{selectedRange.shortLabel}</div>
        </div>
      </div>

      <div className="dark-bottom-grid">
        <div className="dark-card">
          <div className="dark-card-header">
            <h2 className="dark-card-title">Recent Enquiries</h2>
            <a
              href="#"
              className="dark-card-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/enquiries");
              }}
            >
              View all →
            </a>
          </div>
          <table className="dark-posts-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>SERVICE</th>
                <th>STATUS</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="4">No enquiries yet.</td>
                </tr>
              ) : (
                recentEnquiries.map((enq) => (
                  <tr key={enq._id}>
                    <td>
                      <div className="dark-post-title">{enq.name}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {enq.email}
                      </div>
                    </td>
                    <td>{enq.service || "—"}</td>
                    <td>
                      <span
                        className={`dark-status-badge ${enq.status === "new" ? "draft" : "published"}`}
                        style={
                          enq.status === "new"
                            ? { background: "#fee2e2", color: "#dc2626" }
                            : {}
                        }
                      >
                        <span className="dark-status-dot"></span>
                        {enq.status}
                      </span>
                    </td>
                    <td>{formatDate(enq.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dark-card">
          <div className="dark-card-header">
            <h2 className="dark-card-title">Recent Posts</h2>
            <a
              href="#"
              className="dark-card-link"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard/blogs");
              }}
            >
              View all →
            </a>
          </div>
          <table className="dark-posts-table">
            <thead>
              <tr>
                <th>TITLE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>VIEWS</th>
              </tr>
            </thead>
            <tbody>
              {recentBlogs.length === 0 ? (
                <tr>
                  <td colSpan="4">No blog data yet. Create your first post.</td>
                </tr>
              ) : (
                recentBlogs.map((blog) => (
                  <tr key={blog._id}>
                    <td>
                      <div className="dark-post-title">{blog.title}</div>
                    </td>
                    <td>
                      <span
                        className={`dark-status-badge ${blog.status || "draft"}`}
                      >
                        <span className="dark-status-dot"></span>
                        {blog.status || "draft"}
                      </span>
                    </td>
                    <td>{formatDate(blog.createdAt)}</td>
                    <td>{blog.views || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dark-card">
          <div className="dark-card-header">
            <h2 className="dark-card-title">Quick Actions</h2>
          </div>
          <div className="dark-quick-actions-list">
            <div
              className="dark-quick-action"
              onClick={() => navigate("/dashboard/create-blog")}
            >
              <div className="dark-quick-action-icon amber">
                <Plus size={20} />
              </div>
              <div className="dark-quick-action-content">
                <div className="dark-quick-action-title">Create New Blog</div>
                <div className="dark-quick-action-desc">
                  Start writing a new post
                </div>
              </div>
              <div className="dark-quick-action-arrow">›</div>
            </div>
            <div
              className="dark-quick-action"
              onClick={() => navigate("/dashboard/blogs")}
            >
              <div className="dark-quick-action-icon blue">
                <FileText size={20} />
              </div>
              <div className="dark-quick-action-content">
                <div className="dark-quick-action-title">View All Blogs</div>
                <div className="dark-quick-action-desc">
                  Browse your content library
                </div>
              </div>
              <div className="dark-quick-action-arrow">›</div>
            </div>
            <div
              className="dark-quick-action"
              onClick={() => navigate("/dashboard/enquiries")}
            >
              <div className="dark-quick-action-icon red">
                <Inbox size={20} />
              </div>
              <div className="dark-quick-action-content">
                <div className="dark-quick-action-title">View Enquiries</div>
                <div className="dark-quick-action-desc">
                  {enqStats.new > 0
                    ? `${enqStats.new} unread messages`
                    : "Manage contact requests"}
                </div>
              </div>
              <div className="dark-quick-action-arrow">›</div>
            </div>
            <div className="dark-quick-action">
              <div className="dark-quick-action-icon green">
                <TrendingUp size={20} />
              </div>
              <div className="dark-quick-action-content">
                <div className="dark-quick-action-title">View Analytics</div>
                <div className="dark-quick-action-desc">
                  Track post performance
                </div>
              </div>
              <div className="dark-quick-action-arrow">›</div>
            </div>
            <div className="dark-quick-action">
              <div className="dark-quick-action-icon red">
                <Activity size={20} />
              </div>
              <div className="dark-quick-action-content">
                <div className="dark-quick-action-title">Manage Settings</div>
                <div className="dark-quick-action-desc">
                  Configure your panel
                </div>
              </div>
              <div className="dark-quick-action-arrow">›</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
