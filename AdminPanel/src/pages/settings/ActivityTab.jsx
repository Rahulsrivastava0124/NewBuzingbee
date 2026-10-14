import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ScrollText } from "lucide-react";
import { adminAPI } from "../../services/api";
import { EmptyState, LoadingState } from "../../components/common";

const ACTION_COLOR = {
  create: "success",
  update: "info",
  delete: "error",
  login: "default",
  login_failed: "warning",
};

const ACTION_LABEL = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  login: "Signed in",
  login_failed: "Failed sign-in",
};

const fmt = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ActivityTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [action, setAction] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminAPI
      .getAuditLog({ page: page + 1, limit, action })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [page, limit, action]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <LoadingState text="Loading activity..." />;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Every change made by a signed-in admin, plus sign-ins. Kept for about
          6 months.
        </Typography>
        <TextField
          select
          label="Show"
          value={action}
          onChange={(e) => {
            setPage(0);
            setAction(e.target.value);
          }}
          sx={{ maxWidth: { sm: 220 } }}
        >
          <MenuItem value="">Everything</MenuItem>
          <MenuItem value="create">Created</MenuItem>
          <MenuItem value="update">Updated</MenuItem>
          <MenuItem value="delete">Deleted</MenuItem>
          <MenuItem value="login">Sign-ins</MenuItem>
          <MenuItem value="login_failed">Failed sign-ins</MenuItem>
        </TextField>
      </Stack>

      {data.entries.length === 0 ? (
        <EmptyState icon={<ScrollText size={28} />}>
          No activity recorded yet.
        </EmptyState>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Who</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>What</TableCell>
                  <TableCell>From</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.entries.map((e) => (
                  <TableRow key={e._id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmt(e.createdAt)}</TableCell>
                    <TableCell>{e.username || "—"}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Chip
                          size="small"
                          color={ACTION_COLOR[e.action] || "default"}
                          label={ACTION_LABEL[e.action] || e.action}
                        />
                        {!e.success && e.action !== "login_failed" && (
                          <Chip size="small" color="error" variant="outlined" label={`Failed ${e.status}`} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box component="code" sx={{ fontSize: 12.5 }}>
                        {e.resource || e.path}
                      </Box>
                      {e.resourceId && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          {e.resourceId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 12.5 }}>
                      {e.ip || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[25, 50, 100]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setPage(0);
              setLimit(Number(e.target.value));
            }}
          />
        </Paper>
      )}
    </Stack>
  );
}
