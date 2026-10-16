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
import { blogAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../components/common";
import DataTable from "../components/DataTable";
import { FileText, Plus, Search, Trash2 } from "lucide-react";

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        rows={filteredBlogs}
        getRowId={(b) => b._id || b.id}
        minWidth={820}
        onRowClick={(b) => navigate(`/dashboard/blog/${b._id || b.id}`)}
        empty={{ icon: <FileText />, title: "No blogs found", text: "Try adjusting your search or filter." }}
        toolbar={
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
        }
        columns={[
          {
            key: "title",
            label: "Post",
            mobile: "title",
            value: (b) => b.title,
            render: (b) => (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                {b.image ? (
                  <Box
                    component="img"
                    src={b.image}
                    alt=""
                    sx={{ width: 56, height: 40, borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 56,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      color: "text.disabled",
                    }}
                  >
                    <FileText size={18} />
                  </Box>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {b.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {b.author || "Admin"}
                  </Typography>
                </Box>
              </Stack>
            ),
          },
          {
            key: "status",
            label: "Status",
            mobile: "subtitle",
            value: (b) => b.status || "draft",
            render: (b) => (
              <Chip
                size="small"
                label={b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : "Draft"}
                color={STATUS_COLOR[b.status] || "default"}
              />
            ),
          },
          {
            key: "views",
            label: "Views",
            align: "right",
            value: (b) => b.views || 0,
            render: (b) => (b.views || 0).toLocaleString(),
          },
          {
            key: "date",
            label: "Date",
            value: (b) => new Date(b.createdAt || b.date || 0).getTime(),
            render: (b) => formatDate(b.createdAt || b.date),
          },
        ]}
        actions={(b) => {
          const id = b._id || b.id;
          return (
            <>
              <Button size="small" variant="outlined" onClick={() => navigate(`/dashboard/blog/${id}`)}>
                View
              </Button>
              <Button size="small" variant="outlined" onClick={() => navigate(`/dashboard/edit-blog/${id}`)}>
                Edit
              </Button>
              <Tooltip title="Delete post">
                <IconButton size="small" color="error" aria-label={`Delete ${b.title}`} onClick={() => handleDelete(id)}>
                  <Trash2 />
                </IconButton>
              </Tooltip>
            </>
          );
        }}
      />
    </Box>
  );
}
