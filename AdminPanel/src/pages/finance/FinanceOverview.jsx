import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { financeAPI } from "../../services/api";
import { LoadingState } from "../../components/common";
import { money } from "./format";
import { Plus } from "lucide-react";

function Stat({ label, value, sub, color }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: "100%", minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}
      >
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, color: color || "text.primary" }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="body2" color={color === "error.main" ? "error" : "text.secondary"}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

// Finance section of the main dashboard
// aside: optional card shown next to the "Last 6 months" chart, in the same row
const MONTH_RANGES = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
  { value: 24, label: "Last 2 years" },
];

export default function FinanceOverview({ aside }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  // keeps showing the last numbers while a new range loads
  useEffect(() => {
    financeAPI
      .summary(months)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [months]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <LoadingState text="Loading finance..." />;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Finance</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => navigate("/dashboard/finance/invoices/new")}
        >
          New Invoice
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: "grow" }}>
          <Stat
            label="Wallet balance"
            value={money(data.balance)}
            color={data.balance < 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: "grow" }}>
          <Stat label="Invoiced" value={money(data.invoiced)} sub={`${data.invoiceCount} invoices`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: "grow" }}>
          <Stat label="Received" value={money(data.paid)} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: "grow" }}>
          <Stat
            label="Outstanding"
            value={money(data.outstanding)}
            sub={
              data.overdueCount > 0
                ? `${data.overdueCount} overdue · ${money(data.overdueAmount)}`
                : undefined
            }
            color={data.overdueCount > 0 ? "error.main" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: "grow" }}>
          <Stat label="Expenses" value={money(data.totalExpenses)} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: aside ? 6 : 12 }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", mb: 2 }}
        >
          <Box>
            <Typography variant="h6">Income vs expenses</Typography>
            <Typography variant="body2" color="text.secondary">
              {MONTH_RANGES.find((r) => r.value === months)?.label}
            </Typography>
          </Box>
          <TextField
            select
            value={months}
            onChange={(e) => {
              setLoading(true);
              setMonths(Number(e.target.value));
            }}
            disabled={loading}
            sx={{ width: { sm: 200 } }}
            aria-label="Finance range"
          >
            {MONTH_RANGES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
            <RTooltip formatter={(v) => money(v)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      </Grid>
      {aside && <Grid size={{ xs: 12, md: 6 }}>{aside}</Grid>}
      </Grid>
    </Box>
  );
}
