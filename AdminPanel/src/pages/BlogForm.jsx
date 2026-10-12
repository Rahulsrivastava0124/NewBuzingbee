import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { blogAPI } from "../services/api";
import { LoadingState } from "../components/common";
import RichTextField from "../components/RichTextField";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";

const CATEGORIES = ["technology", "design", "business", "lifestyle", "development"];

const STATUSES = [
  ["draft", "Draft"],
  ["review", "In Review"],
  ["published", "Published"],
  ["scheduled", "Scheduled"],
];

const isContentEmpty = (html = "") =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim().length === 0;

const toScheduledIso = (value = "") => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const pad = (n) => String(n).padStart(2, "0");
const toDatetimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function BlogForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    status: "draft",
    scheduledAt: "",
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    const loadBlog = async () => {
      try {
        setLoading(true);
        const blog = await blogAPI.getById(id);
        if (blog) {
          setFormData({
            title: blog.title || "",
            slug: blog.slug || "",
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            category: blog.category || "",
            tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : blog.tags || "",
            status: blog.status || "draft",
            scheduledAt: toDatetimeLocal(blog.scheduledAt),
            featuredImage: blog.image || "",
            seoTitle: blog.seo?.title || "",
            seoDescription: blog.seo?.description || "",
            seoKeywords: Array.isArray(blog.seo?.keywords)
              ? blog.seo.keywords.join(", ")
              : "",
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };
    loadBlog();
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
      // Auto-generate the slug only for new posts so edits never change a live URL
      ...(name === "title" && !isEditing ? { slug: slugify(value) } : {}),
      ...(name === "status" && value !== "scheduled" ? { scheduledAt: "" } : {}),
    }));
  };

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

  const submit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (formData.status === "scheduled" && !formData.scheduledAt) {
        setError("Please select schedule date & time for scheduled publishing.");
        return;
      }
      if (isContentEmpty(formData.content)) {
        setError("Please add blog content before saving.");
        return;
      }

      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        image:
          imageFile || formData.featuredImage?.startsWith("blob:")
            ? ""
            : formData.featuredImage || "",
        imageFile,
        status: formData.status,
        scheduledAt:
          formData.status === "scheduled" ? toScheduledIso(formData.scheduledAt) : "",
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
      };

      if (isEditing) {
        await blogAPI.update(id, payload);
        setMessage("Blog updated successfully");
      } else {
        await blogAPI.create(payload);
        setMessage("Blog created successfully");
      }
      setTimeout(() => navigate("/dashboard/blogs"), 500);
    } catch (err) {
      setError(err.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing && loading && !formData.title && !error) {
    return <LoadingState text="Loading blog..." />;
  }

  return (
    <Box sx={{ maxWidth: 1300 }} component="form" onSubmit={submit}>
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
            {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
          </Typography>
        </Stack>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? "Saving..." : isEditing ? "Update Blog" : "Save Blog"}
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
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Blog title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter an engaging title for your blog post"
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
                      <InputAdornment position="start">buzingbee.com/blog/</InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                multiline
                minRows={3}
                placeholder="Brief summary (150-160 characters recommended)"
                disabled={loading}
                helperText={`${formData.excerpt.length} / 160`}
              />
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
                placeholder="keyword1, keyword2, keyword3"
                disabled={loading}
              />

              <RichTextField
                label="Content *"
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, content: value }))
                }
                placeholder="Start writing your blog content here..."
                disabled={loading}
                minHeight={320}
              />
            </Stack>
          </Paper>
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
                      alt="Featured"
                      onError={() => setPreviewError(true)}
                      onLoad={() => setPreviewError(false)}
                      sx={{ width: "100%", borderRadius: 2, display: previewError ? "none" : "block" }}
                    />
                    {previewError && (
                      <Alert severity="warning">
                        Could not preview this image. Check the URL or upload again.
                      </Alert>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Category
              </Typography>
              <TextField
                select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">Select category</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tags
              </Typography>
              <TextField
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="react, javascript, web-dev"
                disabled={loading}
                helperText="Separate tags with commas"
              />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <FormControl disabled={loading} sx={{ width: "100%" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <RadioGroup name="status" value={formData.status} onChange={handleChange}>
                  {STATUSES.map(([value, label]) => (
                    <FormControlLabel
                      key={value}
                      value={value}
                      control={<Radio />}
                      label={label}
                    />
                  ))}
                </RadioGroup>
                {formData.status === "scheduled" && (
                  <Box sx={{ mt: 1.5 }}>
                    <TextField
                      label="Publish at"
                      type="datetime-local"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleChange}
                      disabled={loading}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { min: toDatetimeLocal(new Date()) },
                      }}
                    />
                    <FormHelperText>Uses your local time zone</FormHelperText>
                  </Box>
                )}
              </FormControl>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
