import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { blogAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../components/common";
import { Eye, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";

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

  return (
    <Box>
      <PageHeader
        title="All Blogs"
        subtitle={`${filteredBlogs.length} total posts`}
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search blogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: { md: 380 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={filterStatus}
          onChange={(_, v) => updateStatusFilter(v)}
          sx={{ flexWrap: "wrap" }}
        >
          {STATUS_FILTERS.map(([value, label]) => (
            <ToggleButton key={value} value={value} sx={{ px: 2 }}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {filteredBlogs.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No blogs found"
        >
          Try adjusting your search or filter criteria
        </EmptyState>
      ) : (
        <Grid container spacing={2}>
          {filteredBlogs.map((blog) => {
            const id = blog._id || blog.id;
            return (
              <Grid key={id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  variant="outlined"
                  sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                >
                  {blog.image ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={blog.image}
                      alt={blog.title}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      <FileText size={44} color="var(--mui-palette-text-disabled)" />
                    </Box>
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Chip
                      size="small"
                      label={
                        blog.status
                          ? blog.status.charAt(0).toUpperCase() + blog.status.slice(1)
                          : "Draft"
                      }
                      color={STATUS_COLOR[blog.status] || "default"}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ fontSize: 16, mb: 0.5 }}>
                      {blog.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {blog.author || "Admin"} ·{" "}
                      {formatDate(blog.createdAt || blog.date)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {(blog.views || 0).toLocaleString()} views
                    </Typography>
                    <Box>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          aria-label="View details"
                          onClick={() => navigate(`/dashboard/blog/${id}`)}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label="Edit"
                          onClick={() => navigate(`/dashboard/edit-blog/${id}`)}
                        >
                          <Pencil size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete"
                          onClick={() => handleDelete(id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
