import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AlarmClock, Bell, CheckCheck, Inbox, TriangleAlert } from "lucide-react";
import { financeAPI } from "../services/api";
import { dueLabel, fmtDate, money } from "../pages/finance/format";

const POLL_MS = 5 * 60 * 1000;

function Section({ title, color, icon, children }) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ px: 2, pt: 1.5, pb: 0.5, alignItems: "center", color }}
      >
        {icon}
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

// Bell in the top bar: overdue invoices, invoices due soon, unread enquiries.
export default function NotificationBell({ newEnquiries = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchor, setAnchor] = useState(null);
  const [data, setData] = useState(null);

  // Refresh on every navigation (a payment or edit changes what is due) and
  // on a timer so a long-open tab stays current.
  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = () =>
      financeAPI
        .notifications({ days: 7 })
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch(() => {
          // keep the previous list; the bell is best-effort
        });

    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [location.pathname]);

  const overdue = data?.overdue || [];
  const dueSoon = data?.dueSoon || [];
  const total = overdue.length + dueSoon.length + newEnquiries;

  const go = (to) => {
    setAnchor(null);
    navigate(to);
  };

  const renderInvoice = (item, isOverdue) => (
    <ListItemButton
      key={item.invoiceId}
      onClick={() => go(`/dashboard/finance/invoices/${item.invoiceId}`)}
    >
      <ListItemText
        primary={`${item.number} · ${item.client}`}
        secondary={`${dueLabel(item.dueDate)} (${fmtDate(item.dueDate)}) · ${money(item.balance)}`}
        slotProps={{
          primary: { sx: { fontWeight: 600, fontSize: 14 } },
          secondary: {
            sx: { color: isOverdue ? "error.main" : "text.secondary", fontSize: 12.5 },
          },
        }}
      />
    </ListItemButton>
  );

  return (
    <>
      <Tooltip title={total ? `${total} notification${total === 1 ? "" : "s"}` : "No notifications"}>
        <IconButton aria-label="Notifications" onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge color="error" badgeContent={total} max={99}>
            <Bell />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: "calc(100vw - 24px)" } } }}
      >
        <Stack
          direction="row"
          sx={{ px: 2, py: 1.5, justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {data && (
            <Typography variant="caption" color="text.secondary">
              Due within {data.days} days
            </Typography>
          )}
        </Stack>
        <Divider />

        <Box sx={{ maxHeight: 440, overflowY: "auto" }}>
          {total === 0 ? (
            <Stack spacing={1} sx={{ py: 5, alignItems: "center", color: "text.secondary" }}>
              <CheckCheck size={28} />
              <Typography>You&apos;re all caught up</Typography>
            </Stack>
          ) : (
            <>
              {overdue.length > 0 && (
                <Section
                  title={`Overdue (${overdue.length}) · ${money(data.counts.overdueAmount)}`}
                  color="var(--mui-palette-error-main)"
                  icon={<TriangleAlert size={16} />}
                >
                  <List dense disablePadding>
                    {overdue.map((i) => renderInvoice(i, true))}
                  </List>
                </Section>
              )}
              {dueSoon.length > 0 && (
                <Section
                  title={`Due soon (${dueSoon.length}) · ${money(data.counts.dueSoonAmount)}`}
                  color="var(--mui-palette-warning-main)"
                  icon={<AlarmClock size={16} />}
                >
                  <List dense disablePadding>
                    {dueSoon.map((i) => renderInvoice(i, false))}
                  </List>
                </Section>
              )}
              {newEnquiries > 0 && (
                <Section
                  title="Enquiries"
                  color="var(--mui-palette-info-main)"
                  icon={<Inbox size={16} />}
                >
                  <List dense disablePadding>
                    <ListItemButton onClick={() => go("/dashboard/enquiries")}>
                      <ListItemText
                        primary={`${newEnquiries} new enquir${newEnquiries === 1 ? "y" : "ies"}`}
                        secondary="Open the enquiries inbox"
                        slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
                      />
                    </ListItemButton>
                  </List>
                </Section>
              )}
            </>
          )}
        </Box>

        <Divider />
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Button size="small" onClick={() => go("/dashboard/finance/invoices")}>
            View all invoices
          </Button>
        </Box>
      </Popover>
    </>
  );
}
