import { useEffect, useMemo, useState } from "react";
import { analyticsAPI } from "../services/api";
import {
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import "./TrafficPage.css";

function TrafficPage() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    website: "buzingbee",
    page: "",
    device: "",
    days: 7,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "eventDate",
    direction: "desc",
  });

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const skip = (pagination.page - 1) * pagination.limit;
      const response = await analyticsAPI.getDetailed({
        ...filters,
        limit: pagination.limit,
        skip,
      });

      setTraffic(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.total || 0,
      }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch traffic data:", error);
      setTraffic([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchTrafficData();
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      page: "",
      device: "",
      days: 7,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Time", "Page", "Device", "IP Address", "Location"],
      ...traffic.map((item) => [
        new Date(item.eventDate).toLocaleDateString(),
        new Date(item.eventDate).toLocaleTimeString(),
        item.page,
        item.device,
        item.ipAddress,
        item.location || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffic-${Date.now()}.csv`;
    a.click();
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case "mobile":
        return <Smartphone size={16} />;
      case "tablet":
        return <Tablet size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedTraffic = useMemo(() => {
    const rows = [...traffic];
    rows.sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      if (key === "eventDate") {
        return (new Date(a.eventDate) - new Date(b.eventDate)) * multiplier;
      }

      const aValue = String(a[key] || "").toLowerCase();
      const bValue = String(b[key] || "").toLowerCase();

      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });
    return rows;
  }, [traffic, sortConfig]);

  const uniqueVisitorsOnPage = useMemo(() => {
    return new Set(traffic.map((item) => item.ipAddress).filter(Boolean)).size;
  }, [traffic]);

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  return (
    <div className="traffic-page">
      <div className="traffic-header">
        <div className="traffic-title">
          <TrendingUp size={24} />
          <h1>Traffic & Leads</h1>
        </div>
        <div className="traffic-actions">
          <button className="btn-icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="btn-export" onClick={handleExport}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="traffic-filters">
        <div className="filter-group">
          <label>
            <Filter size={16} />
            Filters
          </label>
          <div className="filters-row">
            <input
              type="text"
              placeholder="Page (e.g. /home)"
              value={filters.page}
              onChange={(e) => handleFilterChange("page", e.target.value)}
              className="filter-input"
            />
            <select
              value={filters.device}
              onChange={(e) => handleFilterChange("device", e.target.value)}
              className="filter-select"
            >
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
            <select
              value={filters.days}
              onChange={(e) =>
                handleFilterChange("days", Number(e.target.value))
              }
              className="filter-select"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
            </select>
            <button className="btn-clear" onClick={clearFilters} type="button">
              <X size={14} />
              Clear
            </button>
          </div>
          <div className="filters-subrow">
            <label className="rows-control" htmlFor="rowsPerPage">
              Rows per page
            </label>
            <select
              id="rowsPerPage"
              value={pagination.limit}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  page: 1,
                  limit: Number(e.target.value),
                }))
              }
              className="filter-select rows-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="traffic-stats">
        <div className="stat-box">
          <span className="stat-label">Total Visits</span>
          <span className="stat-value">
            {pagination.total.toLocaleString()}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Unique Visitors (Page)</span>
          <span className="stat-value">{uniqueVisitorsOnPage}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Showing</span>
          <span className="stat-value">
            {Math.min(
              (pagination.page - 1) * pagination.limit + 1,
              pagination.total,
            )}{" "}
            - {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Time Range</span>
          <span className="stat-value">{filters.days} days</span>
        </div>
      </div>

      {loading ? (
        <div className="traffic-loading">
          <RefreshCw size={32} className="spinner" />
          <p>Loading traffic data...</p>
        </div>
      ) : traffic.length === 0 ? (
        <div className="traffic-empty">
          <TrendingUp size={48} />
          <h3>No Traffic Data</h3>
          <p>No visits recorded for the selected filters</p>
        </div>
      ) : (
        <>
          <div className="traffic-table-container">
            <table className="traffic-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => toggleSort("eventDate")}
                      type="button"
                    >
                      Date & Time
                      {getSortIcon("eventDate")}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => toggleSort("page")}
                      type="button"
                    >
                      Page
                      {getSortIcon("page")}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => toggleSort("device")}
                      type="button"
                    >
                      Device
                      {getSortIcon("device")}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => toggleSort("ipAddress")}
                      type="button"
                    >
                      IP Address
                      {getSortIcon("ipAddress")}
                    </button>
                  </th>
                  <th>
                    <button
                      className="sort-btn"
                      onClick={() => toggleSort("location")}
                      type="button"
                    >
                      Location
                      {getSortIcon("location")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTraffic.map((item, index) => (
                  <tr key={item._id || index}>
                    <td className="td-date">
                      <div className="date-cell">
                        <span className="date">
                          {new Date(item.eventDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="time">
                          {new Date(item.eventDate).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="td-page">
                      <code>{item.page}</code>
                    </td>
                    <td className="td-device">
                      <div className={`device-badge ${item.device}`}>
                        {getDeviceIcon(item.device)}
                        <span>{item.device}</span>
                      </div>
                    </td>
                    <td className="td-ip">
                      <span className="ip-address">{item.ipAddress}</span>
                    </td>
                    <td className="td-location">
                      {item.location || <span className="text-muted">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="traffic-pagination">
            <button
              className="btn-page"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <div className="page-info">
              Page {pagination.page} of {totalPages || 1}
            </div>
            <button
              className="btn-page"
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              disabled={pagination.page >= (totalPages || 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TrafficPage;
