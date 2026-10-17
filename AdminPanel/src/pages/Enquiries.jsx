import { useState, useEffect, useCallback } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { enquiryAPI } from "../services/api";
import { useFeedback } from "../components/Feedback";
import { LoadingState, PageHeader, SearchField, TableToolbar } from "../components/common";
import DataTable from "../components/DataTable";
import { MessagesSquare, RefreshCw, Search, Trash2, X } from "lucide-react";

const STATUS_COLORS = {
  new: "success",
  read: "info",
  replied: "warning",
  archived: "default",
};

const STATUS_LABELS = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const SERVICE_LABELS = {
  "web-development": "Web Development",
  "mobile-app": "Mobile App",
  "ai-ml": "AI & ML",
  seo: "SEO",
  "social-media": "Social Media",
  ppc: "Google & Meta Ads",
  "email-marketing": "Email Marketing",
  branding: "Branding",
  ecommerce: "E-Commerce",
  other: "Other",
};

const BUDGET_LABELS = {
  "below-5k": "Below ₹5,000",
  "5k-10k": "₹5,000 – ₹10,000",
  "10k-25k": "₹10,000 – ₹25,000",
  "25k-50k": "₹25,000 – ₹50,000",
  "50k-1l": "₹50,000 – ₹1,00,000",
  "above-1l": "Above ₹1,00,000",
};

const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Field({ label, children }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{children}</Typography>
    </Box>
  );
}

export default function Enquiries() {
  const { confirm, notify } = useFeedback();
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEnquiries = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) setLoading(true);
        const filters = {};
        if (filterStatus !== "all") filters.status = filterStatus;
        if (searchTerm.trim()) filters.search = searchTerm.trim();
        const data = await enquiryAPI.getAll(filters);
        setEnquiries(data.enquiries || []);
        setTotal(data.total || 0);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [filterStatus, searchTerm],
  );

  useEffect(() => {
    fetchEnquiries({ showLoader: true });
  }, [fetchEnquiries]);

  const handleOpen = async (enquiry) => {
    setSelected(enquiry);
    setNoteText(enquiry.adminNotes || "");
    if (enquiry.status === "new") {
      try {
        setDetailLoading(true);
        const updated = await enquiryAPI.getById(enquiry._id);
        setSelected(updated);
        setEnquiries((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      } catch {
        /* ignore */
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSelected(null);
    setNoteText("");
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await enquiryAPI.update(id, { status });
      setEnquiries((prev) => prev.map((e) => (e._id === id ? updated : e)));
      if (selected?._id === id) setSelected(updated);
    } catch (err) {
      notify("Failed to update status: " + err.message, "error");
    }
  };

  const handleSaveNote = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await enquiryAPI.update(selected._id, { adminNotes: noteText });
      setSelected(updated);
      setEnquiries((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      notify("Note saved", "success");
    } catch (err) {
      notify("Failed to save note: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Delete enquiry",
      message: "Delete this enquiry permanently?",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await enquiryAPI.delete(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id));
      if (selected?._id === id) handleClose();
      notify("Enquiry deleted", "success");
    } catch (err) {
      notify("Failed to delete: " + err.message, "error");
    }
  };

  if (loading) return <LoadingState text="Loading enquiries..." />;

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <Box>
      <PageHeader
        title="Enquiries"
        subtitle={`${total} total · ${newCount} new`}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshCw />}
            onClick={() => fetchEnquiries({ showLoader: true })}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        rows={enquiries}
        minWidth={860}
        onRowClick={handleOpen}
        empty={{ icon: <MessagesSquare />, title: "No enquiries", text: "No enquiries match these filters." }}
        toolbar={
          <TableToolbar>
            <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search name, email or service..." />
            <ToggleButtonGroup exclusive size="small" value={filterStatus} onChange={(_, v) => v && setFilterStatus(v)}>
              {["all", "new", "read", "replied", "archived"].map((s) => (
                <ToggleButton key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </TableToolbar>
        }
        columns={[
          {
            key: "name",
            label: "Name",
            mobile: "title",
            value: (enq) => enq.name,
            render: (enq) => (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {enq.status === "new" && (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }} />
                )}
                <Typography sx={{ fontWeight: enq.status === "new" ? 700 : 500 }}>{enq.name}</Typography>
              </Stack>
            ),
          },
          { key: "email", label: "Email", mobile: "subtitle", value: (enq) => enq.email },
          {
            key: "service",
            label: "Service",
            value: (enq) => SERVICE_LABELS[enq.service] || enq.service || "",
            render: (enq) => SERVICE_LABELS[enq.service] || enq.service || "—",
          },
          {
            key: "budget",
            label: "Budget",
            value: (enq) => BUDGET_LABELS[enq.budget] || enq.budget || "",
            render: (enq) => BUDGET_LABELS[enq.budget] || enq.budget || "—",
          },
          {
            key: "status",
            label: "Status",
            value: (enq) => enq.status,
            render: (enq) => (
              <Chip size="small" label={STATUS_LABELS[enq.status] || enq.status} color={STATUS_COLORS[enq.status] || "default"} />
            ),
          },
          {
            key: "createdAt",
            label: "Date",
            value: (enq) => new Date(enq.createdAt).getTime(),
            render: (enq) => formatDate(enq.createdAt),
          },
        ]}
        actions={(enq) => (
          <>
            <Button size="small" variant="outlined" onClick={() => handleOpen(enq)}>
              View
            </Button>
            <Tooltip title="Delete enquiry">
              <IconButton size="small" color="error" aria-label={`Delete enquiry from ${enq.name}`} onClick={() => handleDelete(enq._id)}>
                <Trash2 />
              </IconButton>
            </Tooltip>
          </>
        )}
      />

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: 480 } } } }}
      >
        {selected && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack
              direction="row"
              sx={{
                p: 2,
                px: 3,
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6">Enquiry detail</Typography>
              <IconButton onClick={handleClose} aria-label="Close">
                <X />
              </IconButton>
            </Stack>

            {detailLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3} sx={{ p: 3, overflowY: "auto" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                    Status
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mt: 0.5 }}>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <Chip
                        key={val}
                        label={label}
                        clickable
                        color={selected.status === val ? "primary" : "default"}
                        variant={selected.status === val ? "filled" : "outlined"}
                        onClick={() => handleStatusChange(selected._id, val)}
                      />
                    ))}
                  </Stack>
                </Box>

                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Field label="Name">{selected.name}</Field>
                    </Grid>
                    <Grid size={6}>
                      <Field label="Email">
                        <Link href={`mailto:${selected.email}`} underline="hover">
                          {selected.email}
                        </Link>
                      </Field>
                    </Grid>
                    {selected.phone && (
                      <Grid size={6}>
                        <Field label="Phone">
                          <Link href={`tel:${selected.phone}`} underline="hover">
                            {selected.phone}
                          </Link>
                        </Field>
                      </Grid>
                    )}
                    {selected.service && (
                      <Grid size={6}>
                        <Field label="Service">
                          {SERVICE_LABELS[selected.service] || selected.service}
                        </Field>
                      </Grid>
                    )}
                    {selected.budget && (
                      <Grid size={6}>
                        <Field label="Budget">
                          {BUDGET_LABELS[selected.budget] || selected.budget}
                        </Field>
                      </Grid>
                    )}
                    <Grid size={6}>
                      <Field label="Received">{formatDate(selected.createdAt)}</Field>
                    </Grid>
                    <Grid size={6}>
                      <Field label="Source">{selected.source || "contact-form"}</Field>
                    </Grid>
                  </Grid>
                </Paper>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                    Message
                  </Typography>
                  <Paper sx={{ p: 2, mt: 0.5, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                    {selected.message}
                  </Paper>
                </Box>

                <Button
                  variant="contained"
                  href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: Your Enquiry at BuzingBee")}`}
                  onClick={() => handleStatusChange(selected._id, "replied")}
                >
                  Reply via email
                </Button>

                <Stack spacing={1}>
                  <TextField
                    label="Admin notes"
                    multiline
                    minRows={3}
                    placeholder="Add internal notes about this enquiry..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Box>
                    <Button variant="outlined" onClick={handleSaveNote} disabled={saving}>
                      {saving ? "Saving..." : "Save note"}
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
