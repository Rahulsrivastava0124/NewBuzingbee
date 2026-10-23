import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { caseStudyAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../components/common";
import DataTable from "../components/DataTable";
import { Briefcase, Pencil, Plus, Search, Trash2 } from "lucide-react";

export default function CaseStudyList() {
  const navigate = useNavigate();
  const { confirm, notify } = useFeedback();
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
        if (isMounted) {
          setItems(data || []);
          setError("");
        }
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
    const ok = await confirm({
      title: "Delete case study",
      message: "Are you sure you want to delete this case study?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await caseStudyAPI.delete(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      notify("Case study deleted", "success");
    } catch (err) {
      notify("Error deleting: " + err.message, "error");
    }
  };

  const filtered = items.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (item.title || "").toLowerCase().includes(q) ||
      (item.client || "").toLowerCase().includes(q);
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

  if (loading) return <LoadingState text="Loading case studies..." />;

  return (
    <Box>
      <PageHeader
        title="Case Studies"
        subtitle={`${filtered.length} total case studies`}
        actions={
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => navigate("/dashboard/create-case-study")}
          >
            Add Case Study
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        rows={filtered}
        minWidth={820}
        onRowClick={(item) => navigate(`/dashboard/edit-case-study/${item._id}`)}
        empty={{
          icon: <Briefcase />,
          title: "No case studies",
          text: "Use \"Add Case Study\" above to get started.",
        }}
        toolbar={
          <TableToolbar>
            <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search case studies..." />
            <ToggleButtonGroup exclusive size="small" value={filterStatus} onChange={(_, v) => v && setFilterStatus(v)}>
              {["all", "published", "draft"].map((s) => (
                <ToggleButton key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </TableToolbar>
        }
        columns={[
          {
            key: "title",
            label: "Title",
            mobile: "title",
            value: (item) => item.title,
            render: (item) => (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                <Avatar variant="rounded" src={item.image} alt="" sx={{ borderRadius: 2 }}>
                  <Briefcase />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {item.title}
                  </Typography>
                  {item.summary && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 320 }}>
                      {item.summary}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ),
          },
          { key: "client", label: "Client", mobile: "subtitle", value: (item) => item.client || "", render: (item) => item.client || "—" },
          { key: "industry", label: "Industry", value: (item) => item.industry || "", render: (item) => item.industry || "—" },
          {
            key: "status",
            label: "Status",
            value: (item) => item.status,
            render: (item) => (
              <Chip
                size="small"
                label={item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                color={item.status === "published" ? "success" : "default"}
              />
            ),
          },
          {
            key: "createdAt",
            label: "Created",
            value: (item) => new Date(item.createdAt).getTime(),
            render: (item) => formatDate(item.createdAt),
          },
        ]}
        actions={(item) => (
          <>
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" aria-label="Edit" onClick={() => navigate(`/dashboard/edit-case-study/${item._id}`)}>
                <Pencil />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete case study">
              <IconButton size="small" color="error" aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item._id)}>
                <Trash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      />
    </Box>
  );
}
