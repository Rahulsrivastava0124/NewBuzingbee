import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { caseStudyAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { EmptyState, LoadingState, PageHeader } from "../components/common";
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
    <Box sx={{ maxWidth: 1400 }}>
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search case studies..."
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
          onChange={(_, v) => v && setFilterStatus(v)}
        >
          {["all", "published", "draft"].map((s) => (
            <ToggleButton key={s} value={s} sx={{ px: 2 }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {filtered.length === 0 ? (
        <EmptyState icon={<Briefcase size={48} />}>
          No case studies found. Use the &quot;Add Case Study&quot; button above
          to get started.
        </EmptyState>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Avatar variant="rounded" src={item.image} alt={item.title}>
                        <Briefcase />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.summary || item.client}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.client || "—"}</TableCell>
                  <TableCell>{item.industry || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.status}
                      color={item.status === "published" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label="Edit"
                        onClick={() => navigate(`/dashboard/edit-case-study/${item._id}`)}
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
