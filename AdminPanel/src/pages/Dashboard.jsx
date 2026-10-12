import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import GlobalStyles from "@mui/material/GlobalStyles";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import {
  adminAPI,
  authHelper,
  blogAPI,
  caseStudyAPI,
  enquiryAPI,
} from "../services/api";
import { BookOpen, ChevronDown, Briefcase, Clock, Contact, CreditCard, FileText, HandCoins, Inbox, LayoutDashboard, LogOut, Menu, PenLine, ReceiptText, Search, Settings, TrendingUp, Users, Wallet } from "lucide-react";
import BrandMark from "../components/Brand";
import NotificationBell from "../components/NotificationBell";

const DRAWER_WIDTH = 260;
const SIDEBAR_KEY = "adminSidebarSections";

const printStyles = {
  "@media print": {
    ".app-sidebar, .app-topbar, .no-print": { display: "none !important" },
    "html, body, #root, .app-shell, .app-main, .app-content": {
      display: "block !important",
      height: "auto !important",
      overflow: "visible !important",
      padding: "0 !important",
      background: "#fff !important",
    },
  },
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({ total: 0, drafts: 0, scheduled: 0 });
  const [csCount, setCsCount] = useState(0);
  const [newEnqCount, setNewEnqCount] = useState(0);
  const [admin, setAdmin] = useState(null);
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SIDEBAR_KEY) || "null");
      if (saved && typeof saved === "object") return saved;
    } catch {
      // ignore corrupt storage
    }
    return { Content: true, Finance: true, Manage: true };
  });

  const path = location.pathname;
  const statusFromQuery = new URLSearchParams(location.search).get("status");

  useEffect(() => {
    let cancelled = false;
    const loadCounts = async () => {
      try {
        const [stats, csStats, enqStats] = await Promise.all([
          blogAPI.getStats(),
          caseStudyAPI.getStats().catch(() => ({ total: 0 })),
          enquiryAPI.getStats().catch(() => ({ new: 0 })),
        ]);
        if (cancelled) return;
        setCounts({
          total: stats.total || 0,
          drafts: stats.drafts || 0,
          scheduled: stats.scheduled || 0,
        });
        setCsCount(csStats.total || 0);
        setNewEnqCount(enqStats.new || 0);
      } catch {
        // sidebar counts are best-effort
      }
    };
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    adminAPI
      .getProfile()
      .then((res) => setAdmin(res?.admin || null))
      .catch(() => {});
  }, []);

  const toggleSection = (label) =>
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, JSON.stringify(openSections));
    } catch {
      // storage unavailable (private mode); sidebar state just won't persist
    }
  }, [openSections]);

  const handleLogout = () => {
    authHelper.removeToken();
    navigate("/login");
  };

  const go = (to) => {
    navigate(to);
    setMobileOpen(false);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(`/dashboard/blogs${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  const sections = [
    {
      label: "Overview",
      items: [
        {
          to: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard />,
          selected: path === "/dashboard" || path === "/dashboard/",
        },
      ],
    },
    {
      label: "Content",
      items: [
        {
          to: "/dashboard/blogs",
          label: "All Blogs",
          icon: <FileText />,
          badge: counts.total,
          selected: path.startsWith("/dashboard/blogs") && !statusFromQuery,
        },
        {
          to: "/dashboard/blogs?status=draft",
          label: "Drafts",
          icon: <PenLine />,
          badge: counts.drafts,
          selected: path.startsWith("/dashboard/blogs") && statusFromQuery === "draft",
        },
        {
          to: "/dashboard/blogs?status=scheduled",
          label: "Scheduled",
          icon: <Clock />,
          badge: counts.scheduled,
          selected:
            path.startsWith("/dashboard/blogs") && statusFromQuery === "scheduled",
        },
        {
          to: "/dashboard/case-studies",
          label: "Case Studies",
          icon: <Briefcase />,
          badge: csCount,
          selected: path.startsWith("/dashboard/case-studies"),
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          to: "/dashboard/finance",
          label: "Overview",
          icon: <HandCoins />,
          selected: path === "/dashboard/finance",
        },
        {
          to: "/dashboard/finance/clients",
          label: "Clients",
          icon: <Contact />,
          selected: path.startsWith("/dashboard/finance/clients"),
        },
        {
          to: "/dashboard/finance/invoices",
          label: "Invoices",
          icon: <ReceiptText />,
          selected: path.startsWith("/dashboard/finance/invoices"),
        },
        {
          to: "/dashboard/finance/payments",
          label: "Payments",
          icon: <CreditCard />,
          selected: path.startsWith("/dashboard/finance/payments"),
        },
        {
          to: "/dashboard/finance/expenses",
          label: "Expenses",
          icon: <Wallet />,
          selected: path.startsWith("/dashboard/finance/expenses"),
        },
        {
          to: "/dashboard/finance/wallet",
          label: "Wallet & Ledger",
          icon: <BookOpen />,
          selected: path.startsWith("/dashboard/finance/wallet"),
        },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          to: "/dashboard/enquiries",
          label: "Enquiries",
          icon: <Inbox />,
          badge: newEnqCount,
          badgeColor: "error",
          selected: path.startsWith("/dashboard/enquiries"),
        },
        {
          to: "/dashboard/traffic",
          label: "Traffic & Leads",
          icon: <TrendingUp />,
          selected: path.startsWith("/dashboard/traffic"),
        },
        {
          to: "/dashboard/audience",
          label: "Audience",
          icon: <Users />,
          selected: path.startsWith("/dashboard/audience"),
        },
        {
          to: "/dashboard/settings",
          label: "Settings",
          icon: <Settings />,
          selected: path.startsWith("/dashboard/settings"),
        },
      ],
    },
  ];

  // Opening a page (e.g. via a link) expands the group that contains it
  useEffect(() => {
    const active = sections.find((sec) => sec.items.some((i) => i.selected));
    if (active && active.items.length > 1) {
      setOpenSections((prev) =>
        prev[active.label] ? prev : { ...prev, [active.label]: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, statusFromQuery]);

  const getBreadcrumb = () => {
    if (path === "/dashboard" || path === "/dashboard/") {
      return ["Dashboard", "Overview"];
    }
    if (path.startsWith("/dashboard/blogs")) {
      if (statusFromQuery === "draft") return ["Content", "Drafts"];
      if (statusFromQuery === "scheduled") return ["Content", "Scheduled"];
      return ["Content", "All Blogs"];
    }
    if (path.startsWith("/dashboard/blog/")) return ["Content", "Blog"];
    if (path.startsWith("/dashboard/create-blog")) return ["Content", "Create Blog"];
    if (path.startsWith("/dashboard/edit-blog")) return ["Content", "Edit Blog"];
    if (path.startsWith("/dashboard/case-studies")) return ["Content", "Case Studies"];
    if (path.startsWith("/dashboard/create-case-study")) return ["Content", "New Case Study"];
    if (path.startsWith("/dashboard/edit-case-study")) return ["Content", "Edit Case Study"];
    if (path.startsWith("/dashboard/finance")) {
      const subs = {
        clients: "Clients",
        invoices: "Invoices",
        payments: "Payments",
        expenses: "Expenses",
        wallet: "Wallet & Ledger",
      };
      return ["Finance", subs[path.split("/")[3]] || "Overview"];
    }
    if (path.startsWith("/dashboard/enquiries")) return ["Manage", "Enquiries"];
    if (path.startsWith("/dashboard/traffic")) return ["Analytics", "Traffic & Leads"];
    if (path.startsWith("/dashboard/audience")) return ["Manage", "Audience"];
    if (path.startsWith("/dashboard/settings")) return ["Manage", "Settings"];
    return ["Dashboard", "Overview"];
  };

  const [crumbMain, crumbSub] = getBreadcrumb();

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ p: 2.5, alignItems: "center", borderBottom: 1, borderColor: "divider" }}
      >
        <BrandMark />
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>BuzingBee</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            ADMIN PANEL
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", py: 1, scrollbarWidth: "thin" }}>
        {sections.map((section) => {
          const single = section.items.length === 1;
          const isOpen = single || Boolean(openSections[section.label]);
          const hasActive = section.items.some((i) => i.selected);

          return (
            <List key={section.label} dense sx={{ px: 1.5, py: 0.25 }}>
              {!single && (
                <ListItemButton
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={isOpen}
                  sx={{ borderRadius: 2, mb: 0.25, py: 0.75 }}
                >
                  <ListItemText
                    primary={section.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: hasActive ? "primary.dark" : "text.secondary",
                        },
                      },
                    }}
                  />
                  <ChevronDown
                    size={16}
                    style={{
                      transition: "transform 0.2s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </ListItemButton>
              )}
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {section.items.map((item) => (
                    <ListItemButton
                      key={item.to}
                      selected={item.selected}
                      onClick={() => go(item.to)}
                      sx={(t) => ({
                        borderRadius: 2,
                        mb: 0.25,
                        pl: single ? 1.5 : 2.5,
                        "&.Mui-selected, &.Mui-selected:hover": {
                          bgcolor: `color-mix(in srgb, ${t.vars.palette.primary.main} 16%, transparent)`,
                        },
                        "&.Mui-selected .MuiListItemIcon-root, &.Mui-selected .MuiListItemText-primary":
                          { color: "primary.dark", fontWeight: 700 },
                      })}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                      {item.badge > 0 && (
                        <Chip
                          size="small"
                          label={item.badge}
                          color={item.badgeColor || "primary"}
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </List>
          );
        })}
      </Box>

      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: "center" }}>
        <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 36, height: 36 }}>
          {(admin?.username || "A").charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
            {admin?.username || "Admin"}
          </Typography>
          <Typography noWrap variant="caption" color="text.secondary">
            {admin?.email || ""}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton onClick={handleLogout} aria-label="Logout" size="small">
            <LogOut size={18} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );

  return (
    <Box
      className="app-shell"
      sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}
    >
      <GlobalStyles styles={printStyles} />

      <Box
        component="nav"
        className="app-sidebar"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isDesktop ? (
          <Box
            sx={{
              width: DRAWER_WIDTH,
              height: "100%",
              bgcolor: "background.paper",
              borderRight: 1,
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            {drawerContent}
          </Box>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            slotProps={{ root: { keepMounted: true } }}
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                borderRadius: 0,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        className="app-main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <AppBar
          className="app-topbar"
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            borderRadius: 0,
            flexShrink: 0,
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {!isDesktop && (
              <IconButton edge="start" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                <Menu />
              </IconButton>
            )}
            <Breadcrumbs separator="/" sx={{ flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{crumbMain}</Typography>
              <Typography color="primary.dark" sx={{ fontWeight: 700 }}>
                {crumbSub}
              </Typography>
            </Breadcrumbs>

            <Box
              component="form"
              onSubmit={submitSearch}
              sx={{ flex: 1, maxWidth: 420, display: { xs: "none", sm: "block" } }}
            >
              <TextField
                placeholder="Search blogs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            </Box>
            <Box sx={{ flex: 1 }} />
            <NotificationBell newEnquiries={newEnqCount} />
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          className="app-content"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            p: { xs: 2, md: 3 },
            borderRadius: 0,
            bgcolor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
