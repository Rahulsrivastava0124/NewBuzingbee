import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { blogAPI, analyticsAPI, enquiryAPI } from "../services/api";
import { StatCard } from "../components/common";
import FinanceOverview from "./finance/FinanceOverview";
import { ChevronRight, FileText, Inbox, PenLine, Plus, ReceiptText, Settings, TrendingUp, ArrowRight } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 Hours", shortLabel: "24h", mode: "hourly", hours: 24 },
  { value: "7d", label: "Last 7 Days", shortLabel: "7d", mode: "daily", days: 7 },
  { value: "30d", label: "Last 1 Month", shortLabel: "1m", mode: "daily", days: 30 },
  { value: "60d", label: "Last 2 Months", shortLabel: "2m", mode: "daily", days: 60 },
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ChartTooltip = ({ active, payload, isHourly }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <Paper sx={{ px: 1.5, py: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {formatChartTick(item.x, isHourly)}
      </Typography>
      <Typography sx={{ fontWeight: 600, color: "primary.main" }}>
        {payload[0].value} views
      </Typography>
    </Paper>
  );
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function DashboardHome() {
  const navigate = useNavigate();
  const { canSeeBills } = useOutletContext() || {};
  const theme = useTheme();
  const [stats, setStats] = useState({ total: 0, drafts: 0, published: 0 });
  const [enqStats, setEnqStats] = useState({ total: 0, new: 0 });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
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
    RANGE_OPTIONS.find((o) => o.value === selectedRangeValue) || RANGE_OPTIONS[1];
  const isHourlyRange = selectedRange.mode === "hourly";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statsRes, enqStatsRes, enqList] = await Promise.all([
          blogAPI.getStats(),
          enquiryAPI.getStats().catch(() => ({ total: 0, new: 0 })),
          enquiryAPI.getAll({ limit: 4 }).catch(() => ({ enquiries: [] })),
        ]);
        if (cancelled) return;
        setStats({
          total: statsRes.total || 0,
          drafts: statsRes.drafts || 0,
          published: statsRes.published || 0,
        });
        setEnqStats({ total: enqStatsRes.total || 0, new: enqStatsRes.new || 0 });
        setRecentEnquiries((enqList.enquiries || []).slice(0, 4));
      } catch {
        if (!cancelled) setRecentEnquiries([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadTrend = async () => {
      setAnalyticsLoading(true);
      try {
        const res = isHourlyRange
          ? await analyticsAPI.getHourly({ website, hours: selectedRange.hours })
          : await analyticsAPI.getOverview({ website, days: selectedRange.days });
        if (cancelled) return;
        setAnalytics({
          totalViews: res.totalViews || 0,
          trendViews: isHourlyRange
            ? (res.hourlyViews || []).map((i) => ({ x: i.time, views: i.views }))
            : (res.dailyViews || []).map((i) => ({ x: i.date, views: i.views })),
          topPages: res.topPages || [],
          devices: res.devices || [],
        });
      } catch {
        if (!cancelled) {
          setAnalytics({ totalViews: 0, trendViews: [], topPages: [], devices: [] });
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };
    loadTrend();
    return () => {
      cancelled = true;
    };
  }, [isHourlyRange, selectedRange.days, selectedRange.hours]);

  const chartData = useMemo(
    () =>
      (analytics.trendViews || []).map((item) => ({
        ...item,
        label: formatChartTick(item.x, isHourlyRange),
      })),
    [analytics.trendViews, isHourlyRange],
  );

  const quickActions = [
    {
      icon: <Plus />,
      title: "Create New Blog",
      desc: "Start writing a new post",
      to: "/dashboard/create-blog",
    },
    {
      icon: <FileText />,
      title: "View All Blogs",
      desc: "Browse your content library",
      to: "/dashboard/blogs",
    },
    {
      icon: <Inbox />,
      title: "View Enquiries",
      desc: enqStats.new > 0 ? `${enqStats.new} unread messages` : "Manage contact requests",
      to: "/dashboard/enquiries",
    },
    {
      icon: <ReceiptText />,
      title: "New Invoice",
      desc: "Bill a client",
      to: "/dashboard/finance/invoices/new",
    },
    {
      icon: <TrendingUp />,
      title: "View Analytics",
      desc: "Track visits and leads",
      to: "/dashboard/traffic",
    },
    {
      icon: <Settings />,
      title: "Manage Settings",
      desc: "Configure your panel",
      to: "/dashboard/settings",
    },
  ];

  return (
    <Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Blogs"
            value={stats.total}
            icon={<FileText />}
            color="primary"
            caption={`${stats.published} published`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Draft Blogs"
            value={stats.drafts}
            icon={<PenLine />}
            color="info"
            caption="In progress"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={`Traffic & Clicks (${selectedRange.shortLabel})`}
            value={analytics.totalViews.toLocaleString()}
            icon={<TrendingUp />}
            color="success"
            caption="Tracked with analytics API"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Enquiries"
            value={enqStats.total}
            icon={<Inbox />}
            color="error"
            caption={enqStats.new > 0 ? `${enqStats.new} unread` : "All caught up"}
            chip={
              enqStats.new > 0 ? (
                <Chip size="small" color="error" label={`${enqStats.new} new`} />
              ) : null
            }
          />
        </Grid>
      </Grid>

      {canSeeBills && (
        <Box component="section" sx={{ mb: 3 }}>
          <FinanceOverview />
        </Box>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", mb: 2 }}
        >
          <Box>
            <Typography variant="h6">Traffic Trend</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedRange.label}
            </Typography>
          </Box>
          <TextField
            select
            value={selectedRangeValue}
            onChange={(e) => setSelectedRangeValue(e.target.value)}
            disabled={analyticsLoading}
            sx={{ width: { sm: 200 } }}
            aria-label="Traffic range"
          >
            {RANGE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <RTooltip content={<ChartTooltip isHourly={isHourlyRange} />} />
            <Line
              type="monotone"
              dataKey="views"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          [
            `${stats.published} blogs are published`,
            "live",
            "success.main",
          ],
          [
            `${analytics.topPages[0]?.page || "/dashboard"} top page`,
            `${analytics.topPages[0]?.views || 0} views`,
            "info.main",
          ],
          [
            `${analytics.devices.find((d) => d.device === "mobile")?.views || 0} mobile visits`,
            selectedRange.shortLabel,
            "primary.main",
          ],
        ].map(([text, tag, color]) => (
          <Grid key={text} size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                <Typography sx={{ flex: 1 }} noWrap>
                  {text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tag}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ height: "100%" }}>
            <Stack
              direction="row"
              sx={{ p: 2.5, justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6">Recent Enquiries</Typography>
              <Button size="small" endIcon={<ArrowRight size={16} />} onClick={() => navigate("/dashboard/enquiries")}>
                View all
              </Button>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentEnquiries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>No enquiries yet.</TableCell>
                    </TableRow>
                  ) : (
                    recentEnquiries.map((enq) => (
                      <TableRow key={enq._id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{enq.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {enq.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{enq.service || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={enq.status}
                            color={enq.status === "new" ? "error" : "default"}
                          />
                        </TableCell>
                        <TableCell>{formatDate(enq.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ p: 2.5, pb: 1 }}>
              Quick Actions
            </Typography>
            <List sx={{ px: 1, pb: 1 }}>
              {quickActions.map((a) => (
                <ListItemButton key={a.title} onClick={() => navigate(a.to)} sx={{ borderRadius: 2 }}>
                  <ListItemIcon sx={{ color: "primary.main" }}>{a.icon}</ListItemIcon>
                  <ListItemText
                    primary={a.title}
                    secondary={a.desc}
                    slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                  />
                  <ChevronRight color="disabled" />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardHome;
