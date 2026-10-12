import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { caseStudyAPI } from "../services/api";
import { LoadingState } from "../components/common";
import RichTextField from "../components/RichTextField";
import { ArrowLeft, ImagePlus, Plus, Save, Trash2 } from "lucide-react";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "E-Commerce",
  "Finance",
  "Education",
  "Real Estate",
  "Marketing",
  "Retail",
  "SaaS",
  "Startup",
  "Other",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function CaseStudyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    client: "",
    industry: "",
    summary: "",
    challenge: "",
    solution: "",
    results: "",
    category: "",
    tags: "",
    status: "draft",
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [metrics, setMetrics] = useState([{ label: "", value: "" }]);
  const [imageFile, setImageFile] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        setLoading(true);
        const cs = await caseStudyAPI.getById(id);
        if (cs) {
          setFormData({
            title: cs.title || "",
            slug: cs.slug || "",
            client: cs.client || "",
            industry: cs.industry || "",
            summary: cs.summary || "",
            challenge: cs.challenge || "",
            solution: cs.solution || "",
            results: cs.results || "",
            category: cs.category || "",
            tags: Array.isArray(cs.tags) ? cs.tags.join(", ") : cs.tags || "",
            status: cs.status || "draft",
            featuredImage: cs.image || "",
            seoTitle: cs.seo?.title || "",
            seoDescription: cs.seo?.description || "",
            seoKeywords: Array.isArray(cs.seo?.keywords)
              ? cs.seo.keywords.join(", ")
              : cs.seo?.keywords || "",
          });
          setMetrics(cs.metrics?.length ? cs.metrics : [{ label: "", value: "" }]);
        }
      } catch (err) {
        setError(err.message || "Failed to load case study");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "featuredImage") {
      setPreviewError(false);
      setImageFile(null);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Only auto-generate for new entries so edits never change a live URL
      ...(name === "title" && !isEditing ? { slug: slugify(value) } : {}),
    }));
  };

  const setRich = (key) => (value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.featuredImage?.startsWith("blob:")) {
      URL.revokeObjectURL(formData.featuredImage);
    }
    setImageFile(file);
    setFormData((prev) => ({ ...prev, featuredImage: URL.createObjectURL(file) }));
    setPreviewError(false);
    setMessage("Image selected. It will be uploaded when you save.");
    e.target.value = "";
  };

  useEffect(
    () => () => {
      if (imageFile && formData.featuredImage?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.featuredImage);
      }
    },
    [imageFile, formData.featuredImage],
  );

  const handleMetricChange = (index, field, value) =>
    setMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!formData.title.trim()) {
        setError("Title is required");
        return;
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        client: formData.client,
        industry: formData.industry,
        summary: formData.summary,
        challenge: formData.challenge,
        solution: formData.solution,
        results: formData.results,
        metrics: JSON.stringify(
          metrics.filter((m) => m.label.trim() || m.value.trim()),
        ),
        category: formData.category,
        tags: formData.tags,
        status: formData.status,
        image:
          imageFile || formData.featuredImage?.startsWith("blob:")
            ? ""
            : formData.featuredImage || "",
        imageFile,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      };

      if (isEditing) {
        await caseStudyAPI.update(id, payload);
        setMessage("Case study updated successfully");
      } else {
        await caseStudyAPI.create(payload);
        setMessage("Case study created successfully");
      }
      setTimeout(() => navigate("/dashboard/case-studies"), 500);
    } catch (err) {
      setError(err.message || "Failed to save case study");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing && loading && !formData.title && !error) {
    return <LoadingState text="Loading case study..." />;
  }

  return (
    <Box sx={{ maxWidth: 1300 }} component="form" onSubmit={handleSubmit}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Button color="inherit" startIcon={<ArrowLeft />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h5" component="h1">
            {isEditing ? "Edit Case Study" : "New Case Study"}
          </Typography>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? "Saving..." : isEditing ? "Update Case Study" : "Save Case Study"}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Case study title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. How We Helped Acme Grow 300% in 6 Months"
                  required
                  disabled={loading}
                />
                <TextField
                  label="URL slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-from-title"
                  disabled={loading}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          buzingbee.com/case-studies/
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Client name"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  disabled={loading}
                />
                <TextField
                  label="Summary / excerpt"
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                  placeholder="Brief overview shown on the listing page"
                  disabled={loading}
                  helperText={`${formData.summary.length} / 200`}
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Case study content
              </Typography>
              <Stack spacing={3}>
                <RichTextField
                  label="The challenge"
                  value={formData.challenge}
                  onChange={setRich("challenge")}
                  placeholder="Describe the problem the client faced..."
                  disabled={loading}
                  minHeight={180}
                />
                <RichTextField
                  label="Our solution"
                  value={formData.solution}
                  onChange={setRich("solution")}
                  placeholder="Describe the approach and solution provided..."
                  disabled={loading}
                  minHeight={180}
                />
                <RichTextField
                  label="Results & outcomes"
                  value={formData.results}
                  onChange={setRich("results")}
                  placeholder="Describe the measurable outcomes and results..."
                  disabled={loading}
                  minHeight={180}
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">Key metrics</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add key performance indicators, e.g. &quot;Revenue Growth&quot; →
                &quot;300%&quot;
              </Typography>
              <Stack spacing={1.5}>
                {metrics.map((m, i) => (
                  <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <TextField
                      placeholder="Label (e.g. Revenue Growth)"
                      value={m.label}
                      onChange={(e) => handleMetricChange(i, "label", e.target.value)}
                      disabled={loading}
                    />
                    <TextField
                      placeholder="Value (e.g. +300%)"
                      value={m.value}
                      onChange={(e) => handleMetricChange(i, "value", e.target.value)}
                      disabled={loading}
                    />
                    <IconButton
                      color="error"
                      aria-label="Remove metric"
                      disabled={loading || metrics.length === 1}
                      onClick={() =>
                        setMetrics((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 />
                    </IconButton>
                  </Stack>
                ))}
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<Plus />}
                    disabled={loading}
                    onClick={() =>
                      setMetrics((prev) => [...prev, { label: "", value: "" }])
                    }
                  >
                    Add metric
                  </Button>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                SEO settings
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="SEO title"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleChange}
                  disabled={loading}
                />
                <TextField
                  label="Meta description"
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                  disabled={loading}
                />
                <TextField
                  label="SEO keywords"
                  name="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={handleChange}
                  placeholder="keyword1, keyword2"
                  disabled={loading}
                />
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Featured image
              </Typography>
              <Stack spacing={1.5}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  hidden
                />
                <TextField
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleChange}
                  placeholder="Image URL"
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  startIcon={<ImagePlus />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Upload image
                </Button>
                {formData.featuredImage && (
                  <Box>
                    <Box
                      component="img"
                      src={formData.featuredImage}
                      alt="Preview"
                      onError={() => setPreviewError(true)}
                      onLoad={() => setPreviewError(false)}
                      sx={{ width: "100%", borderRadius: 2, display: previewError ? "none" : "block" }}
                    />
                    {previewError && (
                      <Alert severity="warning">
                        Could not preview image. Check the URL or upload again.
                      </Alert>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Industry
              </Typography>
              <TextField
                select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={loading}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">Select industry</MenuItem>
                {INDUSTRIES.map((ind) => (
                  <MenuItem key={ind} value={ind}>
                    {ind}
                  </MenuItem>
                ))}
              </TextField>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Category
              </Typography>
              <TextField
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. SEO, Web Design, Branding"
                disabled={loading}
              />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tags
              </Typography>
              <TextField
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="seo, growth, startup"
                disabled={loading}
                helperText="Separate tags with commas"
              />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Status
              </Typography>
              <RadioGroup name="status" value={formData.status} onChange={handleChange}>
                {["draft", "published"].map((s) => (
                  <FormControlLabel
                    key={s}
                    value={s}
                    control={<Radio />}
                    disabled={loading}
                    label={s.charAt(0).toUpperCase() + s.slice(1)}
                  />
                ))}
              </RadioGroup>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
