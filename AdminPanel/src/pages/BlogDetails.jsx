import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { blogAPI } from "../services/api";
import { LoadingState } from "../components/common";
import { ArrowLeft, Eye, Flag, Pencil, Tag, User } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Fact({ icon, label, children }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{children}</Typography>
    </Paper>
  );
}

export default function BlogDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await blogAPI.getById(id, { trackView: true });
        setBlog(data || null);
      } catch (err) {
        setError(err.message || "Failed to load blog details");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id]);

  if (loading) return <LoadingState text="Loading blog details..." />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!blog) return <Alert severity="warning">Blog not found.</Alert>;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 2 }}>
        <Button startIcon={<ArrowLeft />} color="inherit" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button
          variant="outlined"
          startIcon={<Pencil />}
          onClick={() => navigate(`/dashboard/edit-blog/${blog._id || id}`)}
        >
          Edit
        </Button>
      </Stack>

      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {blog.title}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Fact icon={<User size={18} />} label="Author">
            {blog.author || "Admin"}
          </Fact>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Fact icon={<Flag size={18} />} label="Status">
            <Chip size="small" label={blog.status || "draft"} />
          </Fact>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Fact icon={<Tag size={18} />} label="Category">
            {blog.category || "General"}
          </Fact>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Fact icon={<Eye size={18} />} label="Views">
            {(blog.views || 0).toLocaleString()}
          </Fact>
        </Grid>
      </Grid>

      {blog.image && (
        <Box
          component="img"
          src={blog.image}
          alt={blog.title}
          sx={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 3, mb: 3 }}
        />
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Metadata
        </Typography>
        <Grid container spacing={1}>
          {[
            ["Published", blog.publishedAt],
            ["Scheduled", blog.scheduledAt],
            ["Created", blog.createdAt],
            ["Updated", blog.updatedAt],
          ].map(([label, value]) => (
            <Grid key={label} size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography>{formatDate(value)}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Content</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Box
          sx={{
            "& img": { maxWidth: "100%" },
            "& h1, & h2, & h3": { mt: 2, mb: 1 },
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: blog.content || "" }}
        />
      </Paper>
    </Box>
  );
}
