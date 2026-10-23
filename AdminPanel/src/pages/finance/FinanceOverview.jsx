import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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
export default function FinanceOverview() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    financeAPI
      .summary()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

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

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack sx={{ mb: 2 }}>
          <Typography variant="h6">Last 6 months</Typography>
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
    </Box>
  );
}
