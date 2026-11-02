import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { analyticsAPI, getBlogSite } from "../services/api";
import { EmptyState, LoadingState, PageHeader } from "../components/common";
import { Download, Monitor, RefreshCw, Smartphone, Tablet, TrendingUp, X } from "lucide-react";

const DEVICE_ICON = {
  mobile: <Smartphone size={18} />,
  tablet: <Tablet size={18} />,
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function TrafficPage() {
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    website: getBlogSite(),
    page: "",
    device: "",
    days: 7,
  });
  const [pagination, setPagination] = useState({ page: 0, limit: 50, total: 0 });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "eventDate", direction: "desc" });

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getDetailed({
        ...filters,
        limit: pagination.limit,
        skip: pagination.page * pagination.limit,
      });
      setTraffic(response.data || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message || "Could not load traffic data");
      setTraffic([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page, pagination.limit]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, page: "", device: "", days: 7 }));
    setPagination((prev) => ({ ...prev, page: 0 }));
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
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffic-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSort = (key) =>
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

  const sortedTraffic = useMemo(() => {
    const rows = [...traffic];
    const multiplier = sortConfig.direction === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortConfig.key === "eventDate") {
        return (new Date(a.eventDate) - new Date(b.eventDate)) * multiplier;
      }
      const aValue = String(a[sortConfig.key] || "").toLowerCase();
      const bValue = String(b[sortConfig.key] || "").toLowerCase();
      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });
    return rows;
  }, [traffic, sortConfig]);

  const uniqueVisitorsOnPage = useMemo(
    () => new Set(traffic.map((item) => item.ipAddress).filter(Boolean)).size,
    [traffic],
  );

  const columns = [
    ["eventDate", "Date & Time"],
    ["page", "Page"],
    ["device", "Device"],
    ["ipAddress", "IP Address"],
    ["location", "Location"],
  ];

  const stats = [
    ["Total Visits", pagination.total.toLocaleString()],
    ["Unique Visitors (Page)", uniqueVisitorsOnPage],
    ["Time Range", `${filters.days} day${filters.days === 1 ? "" : "s"}`],
    ["Last Updated", lastUpdated ? lastUpdated.toLocaleTimeString() : "—"],
  ];

  return (
    <Box>
      <PageHeader
        title="Traffic & Leads"
        actions={
          <>
            <Tooltip title="Refresh">
              <IconButton aria-label="Refresh" onClick={fetchTrafficData}>
                <RefreshCw />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={traffic.length === 0}
            >
              Export CSV
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <TextField
            label="Page"
            placeholder="e.g. /home"
            value={filters.page}
            onChange={(e) => handleFilterChange("page", e.target.value)}
          />
          <TextField
            select
            label="Device"
            value={filters.device}
            onChange={(e) => handleFilterChange("device", e.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">All Devices</MenuItem>
            <MenuItem value="desktop">Desktop</MenuItem>
            <MenuItem value="mobile">Mobile</MenuItem>
            <MenuItem value="tablet">Tablet</MenuItem>
          </TextField>
          <TextField
            select
            label="Range"
            value={filters.days}
            onChange={(e) => handleFilterChange("days", Number(e.target.value))}
          >
            <MenuItem value={1}>Last 24 Hours</MenuItem>
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={60}>Last 60 Days</MenuItem>
          </TextField>
          <Button
            color="inherit"
            startIcon={<X />}
            onClick={clearFilters}
            sx={{ flexShrink: 0 }}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map(([label, value]) => (
          <Grid key={label} size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                {label}
              </Typography>
              <Typography variant="h6">{value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <LoadingState text="Loading traffic data..." />
      ) : traffic.length === 0 ? (
        <EmptyState icon={<TrendingUp size={48} />} title="No Traffic Data">
          No visits recorded for the selected filters
        </EmptyState>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map(([key, label]) => (
                    <TableCell key={key} sortDirection={sortConfig.key === key ? sortConfig.direction : false}>
                      <TableSortLabel
                        active={sortConfig.key === key}
                        direction={sortConfig.key === key ? sortConfig.direction : "asc"}
                        onClick={() => toggleSort(key)}
                      >
                        {label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTraffic.map((item, index) => {
                  const date = new Date(item.eventDate);
                  return (
                    <TableRow key={item._id || index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box component="code" sx={{ fontSize: 12.5 }}>
                          {item.page}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={DEVICE_ICON[item.device] || <Monitor size={18} />}
                          label={item.device}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{item.ipAddress}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            rowsPerPage={pagination.limit}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, page) => setPagination((prev) => ({ ...prev, page }))}
            onRowsPerPageChange={(e) =>
              setPagination((prev) => ({ ...prev, page: 0, limit: Number(e.target.value) }))
            }
          />
        </Paper>
      )}
    </Box>
  );
}

export default TrafficPage;
