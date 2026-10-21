import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import useMediaQuery from "@mui/material/useMediaQuery";
import { blogAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { EmptyState, LoadingState, PageHeader, SearchField, TableToolbar } from "../components/common";
import { Eye, FileText, Plus, Trash2 } from "lucide-react";

// Time filter for the views graphs (the API allows up to 90 days)
const RANGES = [
  [7, "7 days"],
  [14, "14 days"],
  [30, "30 days"],
  [90, "90 days"],
];
const shortDate = (key) => new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// Tiny 14-day views line for a card
function Sparkline({ id, data, color }) {
  const fillId = `spark-${id}`;
  return (
    <Box sx={{ height: 36, flex: 1, minWidth: 0 }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="views" stroke={color} strokeWidth={2} fill={`url(#${fillId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

const STATUS_FILTERS = [
  ["all", "All"],
  ["published", "Published"],
  ["draft", "Drafts"],
  ["review", "In Review"],
  ["scheduled", "Scheduled"],
];

const STATUS_COLOR = {
  published: "success",
  draft: "default",
  review: "warning",
  scheduled: "info",
};

export default function BlogList() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get("status") || "all";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daily, setDaily] = useState(null);
  const [mode, setMode] = useState(null); // "posts" | "trend"; null = pick automatically
  const isPhone = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [range, setRange] = useState(() => {
    const saved = Number(localStorage.getItem("blogViewsRange"));
    return RANGES.some(([d]) => d === saved) ? saved : 14;
  });
  const theme = useTheme();

  // Keep the box in sync when the top-bar search navigates here
  const urlSearch = searchParams.get("search") || "";
  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) setLoading(true);
        const filters = filterStatus !== "all" ? { status: filterStatus } : {};
        const response = await blogAPI.getAll(filters);
        if (isMounted) {
          setBlogs(response || []);
          setError("");
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (showLoader && isMounted) setLoading(false);
      }
    };

    fetchBlogs({ showLoader: true });
    const intervalId = window.setInterval(() => fetchBlogs(), 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [filterStatus]);

  // Views per day for the chosen range, refreshed every minute
  useEffect(() => {
    let alive = true;
    const load = () =>
      blogAPI
        .getViewsDaily(range)
        .then((res) => alive && setDaily(res))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 60000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [range]);

  const changeRange = (_, value) => {
    if (!value) return;
    setRange(value);
    try {
      localStorage.setItem("blogViewsRange", String(value));
    } catch {
      // storage unavailable; the choice just won't be remembered
    }
  };

  const updateStatusFilter = (status) => {
    if (!status) return;
    const next = {};
    if (status !== "all") next.status = status;
    if (searchTerm.trim()) next.search = searchTerm.trim();
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete blog",
      message: "Are you sure you want to delete this blog?",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await blogAPI.delete(id);
      setBlogs((prev) => prev.filter((blog) => (blog._id || blog.id) !== id));
      notify("Blog deleted", "success");
    } catch (err) {
      notify("Error deleting blog: " + err.message, "error");
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) return <LoadingState text="Loading blogs..." />;

  const accent = theme.palette.primary.main;
  const labelWidth = isPhone ? 130 : 260;
  const labelChars = isPhone ? 16 : 34;
  const totalSeries = (daily?.days || []).map((d, i) => ({ day: shortDate(d), views: daily.totals[i] }));
  const periodViews = (daily?.totals || []).reduce((a, b) => a + b, 0);
  const allTimeViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
  // "By post": top 10 of the posts currently shown, by all-time views
  const topPosts = [...filteredBlogs]
    .filter((b) => (b.views || 0) > 0)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map((b) => ({
      id: b._id || b.id,
      title: b.title,
      label: b.title?.length > labelChars ? `${b.title.slice(0, labelChars - 1)}…` : b.title,
      views: b.views || 0,
    }));
  const shownViews = filteredBlogs.reduce((sum, b) => sum + (b.views || 0), 0);
  // Until daily data exists, open on the view that has data
  const chartMode = mode || (periodViews > 0 ? "trend" : "posts");

  const seriesFor = (id) =>
    (daily?.days || []).map((d, i) => ({ day: d, views: daily.series[id]?.[i] || 0 }));

  return (
    <Box>
      <PageHeader
        title="All Blogs"
        subtitle={`${filteredBlogs.length} posts · ${allTimeViews.toLocaleString()} views all time`}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => navigate("/dashboard/create-blog")}
          >
            Create New Post
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Visibility: most-viewed posts, or total views per day */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { md: "center" }, mb: 2 }}
        >
          <Box>
            <Typography variant="h6">Blog views</Typography>
            <Typography variant="body2" color="text.secondary">
              {chartMode === "posts"
                ? `Most-viewed posts, all time${filterStatus !== "all" || searchTerm ? " (filtered)" : ""}`
                : `Last ${range} days, all posts`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
            <ToggleButtonGroup exclusive size="small" value={chartMode} onChange={(_, v) => v && setMode(v)} aria-label="Graph type">
              <ToggleButton value="posts">By post</ToggleButton>
              <ToggleButton value="trend">Trend</ToggleButton>
            </ToggleButtonGroup>
            {chartMode === "trend" && (
              <ToggleButtonGroup exclusive size="small" value={range} onChange={changeRange} aria-label="Time range">
                {RANGES.map(([days, label]) => (
                  <ToggleButton key={days} value={days}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
            <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 56, textAlign: "right" }}>
              {(chartMode === "posts" ? shownViews : periodViews).toLocaleString()}
            </Typography>
          </Stack>
        </Stack>

        {chartMode === "posts" ? (
          topPosts.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No views yet for these posts.
            </Typography>
          ) : (
            <Box sx={{ height: topPosts.length * 38 + 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPosts} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={8}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={labelWidth}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: theme.palette.text.primary }}
                  />
                  <RTooltip
                    cursor={{ fill: theme.palette.action.hover }}
                    formatter={(v) => [`${v.toLocaleString()} views`, "All time"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.title || ""}
                  />
                  <Bar
                    dataKey="views"
                    fill={accent}
                    radius={[0, 6, 6, 0]}
                    cursor="pointer"
                    onClick={(d) => navigate(`/dashboard/blog/${d.id}`)}
                    label={{ position: "right", fontSize: 12, fill: theme.palette.text.secondary, formatter: (v) => v.toLocaleString() }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )
        ) : periodViews === 0 ? (
          <Stack spacing={0.5} sx={{ py: 5, alignItems: "center", textAlign: "center" }}>
            <Typography sx={{ fontWeight: 600 }}>No daily views recorded yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
              Daily tracking started recently, so this trend fills in as people read your posts. The “By post” view
              shows all-time views right now.
            </Typography>
          </Stack>
        ) : (
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totalSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} width={40} />
                <RTooltip formatter={(v) => [`${v} views`, "Views"]} />
                <Area type="monotone" dataKey="views" stroke={accent} strokeWidth={2} fill="url(#viewsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <TableToolbar>
          <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search blogs..." />
          <ToggleButtonGroup exclusive size="small" value={filterStatus} onChange={(_, v) => updateStatusFilter(v)}>
            {STATUS_FILTERS.map(([value, label]) => (
              <ToggleButton key={value} value={value}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </TableToolbar>
      </Paper>

      {filteredBlogs.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="No blogs found">
          Try adjusting your search or filter.
        </EmptyState>
      ) : (
        <Grid container spacing={2}>
          {filteredBlogs.map((blog) => {
            const id = blog._id || blog.id;
            const series = seriesFor(String(id));
            const recent = series.reduce((sum, d) => sum + d.views, 0);
            return (
              <Grid key={id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box
                    onClick={() => navigate(`/dashboard/blog/${id}`)}
                    sx={{ cursor: "pointer", position: "relative" }}
                  >
                    {blog.image ? (
                      <CardMedia component="img" height="160" image={blog.image} alt={blog.title} sx={{ objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ height: 160, display: "grid", placeItems: "center", bgcolor: "action.hover", color: "text.disabled" }}>
                        <FileText size={40} />
                      </Box>
                    )}
                    <Chip
                      size="small"
                      label={blog.status ? blog.status.charAt(0).toUpperCase() + blog.status.slice(1) : "Draft"}
                      color={STATUS_COLOR[blog.status] || "default"}
                      sx={{ position: "absolute", top: 12, left: 12, bgcolor: "background.paper", boxShadow: 1 }}
                    />
                  </Box>
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: 16, lineHeight: 1.35, mb: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {blog.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {blog.author || "Admin"} · {formatDate(blog.createdAt || blog.date)}
                    </Typography>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: "center" }}>
                      <Tooltip title={`${(blog.views || 0).toLocaleString()} views all time · ${recent} in the last ${range} days`}>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary", flexShrink: 0 }}>
                          <Eye size={16} />
                          <Typography sx={{ fontWeight: 600, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
                            {(blog.views || 0).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Tooltip>
                      {daily && <Sparkline id={id} data={series} color={recent ? accent : theme.palette.divider} />}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/dashboard/blog/${id}`)}>
                      View
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/dashboard/edit-blog/${id}`)}>
                      Edit
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Delete post">
                      <IconButton size="small" color="error" aria-label={`Delete ${blog.title}`} onClick={() => handleDelete(id)}>
                        <Trash2 />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
