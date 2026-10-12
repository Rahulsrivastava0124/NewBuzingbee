import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Users } from "lucide-react";

export default function Audience() {
  return (
    <Box sx={{ maxWidth: 560 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={1.5}>
          <Users size={36} color="var(--mui-palette-primary-main)" />
          <Typography variant="h5">Audience</Typography>
          <Typography color="text.secondary">
            Audience analytics are not available yet. Visit Traffic &amp; Leads
            for visit-level data.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
