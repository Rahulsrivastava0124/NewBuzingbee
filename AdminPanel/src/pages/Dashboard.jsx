import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import ButtonBase from "@mui/material/ButtonBase";
import MuiMenu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
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
import { BookOpen, ChevronDown, Briefcase, Clock, Contact, FileText, Inbox, LayoutDashboard, LogOut, Menu, PenLine, ReceiptText, Search, Settings, ShieldCheck, TrendingUp, UserRound } from "lucide-react";
import BrandMark from "../components/Brand";
import NotificationBell from "../components/NotificationBell";

const DRAWER_WIDTH = 280;
const TOPBAR_HEIGHT = 64;
const SIDEBAR_BG = "background.paper";
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
  const [menuAnchor, setMenuAnchor] = useState(null);
  const initial = (admin?.username || "A").charAt(0).toUpperCase();
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

  // Wait for the profile so the Finance group doesn't flash for users without access
  const canSeeBills = Boolean(admin) && (admin.role === "super" || admin.showBills !== false);

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
    ...(canSeeBills
      ? [
    {
      label: "Finance",
      items: [
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
          to: "/dashboard/finance/wallet",
          label: "Expenses & Wallet",
          icon: <BookOpen />,
          selected: path.startsWith("/dashboard/finance/wallet"),
        },
      ],
    },
        ]
      : []),
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
        ...(admin?.role === "super"
          ? [
              {
                to: "/dashboard/users",
                label: "Users",
                icon: <ShieldCheck />,
                selected: path.startsWith("/dashboard/users"),
              },
            ]
          : []),
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
        wallet: "Expenses & Wallet",
      };
      return ["Finance", subs[path.split("/")[3]] || "Finance"];
    }
    if (path.startsWith("/dashboard/enquiries")) return ["Manage", "Enquiries"];
    if (path.startsWith("/dashboard/traffic")) return ["Analytics", "Traffic & Leads"];
    if (path.startsWith("/dashboard/users")) return ["Manage", "Users"];
    if (path.startsWith("/dashboard/settings")) return ["Manage", "Settings"];
    return ["Dashboard", "Overview"];
  };

  const [crumbMain, crumbSub] = getBreadcrumb();

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: SIDEBAR_BG }}>
      <Stack
        direction="row"
        sx={{ height: TOPBAR_HEIGHT, flexShrink: 0, px: 2, alignItems: "center" }}
      >
        <ButtonBase
          onClick={() => go("/dashboard")}
          aria-label="Go to dashboard"
          sx={{ borderRadius: 1.5, p: 0.25, "&.Mui-focusVisible": { boxShadow: "0 0 0 3px rgba(161,161,170,.5)" } }}
        >
          <BrandMark size={58} />
        </ButtonBase>
      </Stack>

      <Box component="nav" aria-label="Main" sx={{ flex: 1, overflowY: "auto", px: 1.5, pb: 2 }}>
        {sections.map((section) => {
          const single = section.items.length === 1;
          const isOpen = single || Boolean(openSections[section.label]);

          return (
            <Box key={section.label} sx={{ pt: single ? 1 : 1.5 }}>
              {!single && (
                <ButtonBase
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={isOpen}
                  sx={{
                    width: "100%",
                    height: 40,
                    px: 1.5,
                    borderRadius: 1,
                    justifyContent: "space-between",
                    color: "text.primary",
                    fontSize: 15,
                    fontWeight: 600,
                    "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                  }}
                >
                  {section.label}
                  <ChevronDown
                    size={18}
                    style={{
                      transition: "transform .2s ease",
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    }}
                  />
                </ButtonBase>
              )}
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ display: "grid", gap: 0.5 }}>
                  {section.items.map((item) => (
                    <ListItemButton
                      key={item.to}
                      selected={item.selected}
                      onClick={() => go(item.to)}
                      aria-current={item.selected ? "page" : undefined}
                      sx={(t) => ({
                        color: "text.primary",
                        "&.Mui-selected, &.Mui-selected:hover": {
                          bgcolor: `color-mix(in srgb, ${t.vars.palette.primary.main} 16%, transparent)`,
                        },
                        "&.Mui-selected .MuiListItemIcon-root, &.Mui-selected .MuiListItemText-primary": {
                          color: "primary.dark",
                        },
                        minHeight: 40,
                        px: 1.5,
                        gap: 1.5,
                        borderRadius: 2,
                        "& .MuiListItemIcon-root": { minWidth: 0 },
                        "& .MuiListItemIcon-root svg": { width: 20, height: 20 },
                      })}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{ primary: { noWrap: true, sx: { fontSize: 15, fontWeight: item.selected ? 600 : 400 } } }}
                      />
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
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const accountName = admin?.username || "Admin";
  const accountEmail = admin?.email || "";

  return (
    <Box className="app-shell" sx={{ display: "flex", height: "100dvh", bgcolor: "background.default" }}>
      <GlobalStyles styles={printStyles} />

      <Box
        className="app-sidebar"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isDesktop ? (
          <Box
            sx={{
              width: DRAWER_WIDTH,
              height: "100%",
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
                maxWidth: "85vw",
                boxSizing: "border-box",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        className="app-main"
        sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <AppBar
          className="app-topbar"
          position="static"
          sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
        >
          <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 2 }, height: TOPBAR_HEIGHT, px: { xs: 1.5, sm: 2, md: 3 } }}>
            {/* Left and right zones share the leftover width equally, so the search stays centred */}
            <Stack direction="row" sx={{ flex: "1 1 0", minWidth: 0, alignItems: "center", gap: 1 }}>
              {!isDesktop && (
                <>
                  <IconButton aria-label="Open menu" onClick={() => setMobileOpen(true)} size="small">
                    <Menu />
                  </IconButton>
                  <Divider orientation="vertical" flexItem sx={{ my: 2 }} />
                </>
              )}
              <Breadcrumbs separator="/" sx={{ minWidth: 0, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}>
                <Typography noWrap color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                  {crumbMain}
                </Typography>
                <Typography noWrap sx={{ fontWeight: 500 }}>
                  {crumbSub}
                </Typography>
              </Breadcrumbs>
            </Stack>

            <Box
              component="form"
              role="search"
              onSubmit={submitSearch}
              sx={{ flex: "0 1 420px", minWidth: 0, display: { xs: "none", sm: "block" } }}
            >
              <TextField
                placeholder="Search blogs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  htmlInput: { "aria-label": "Search blogs" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Stack
              direction="row"
              sx={{ flex: "1 1 0", minWidth: 0, alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}
            >
              <IconButton
                aria-label="Search blogs"
                onClick={() => navigate("/dashboard/blogs")}
                sx={{ display: { xs: "inline-flex", sm: "none" } }}
              >
                <Search size={18} />
              </IconButton>
              <NotificationBell newEnquiries={newEnqCount} />
              <ButtonBase
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={Boolean(menuAnchor)}
                sx={{
                  borderRadius: 1.5,
                  p: 0.5,
                  pr: { xs: 0.5, md: 1 },
                  gap: 1,
                  minWidth: 0,
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-focusVisible": { boxShadow: "0 0 0 3px rgba(161,161,170,.5)" },
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 36, height: 36 }}>
                  {initial}
                </Avatar>
                <Box sx={{ textAlign: "left", display: { xs: "none", md: "block" }, minWidth: 0, maxWidth: 180 }}>
                  <Typography noWrap sx={{ fontWeight: 500, lineHeight: 1.25 }}>
                    {accountName}
                  </Typography>
                  <Typography noWrap variant="caption" color="text.secondary" component="div">
                    {accountEmail}
                  </Typography>
                </Box>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </ButtonBase>
              <MuiMenu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { minWidth: 224, mt: 1 } } }}
              >
                <Stack direction="row" spacing={1} sx={{ px: 1, py: 0.75, alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 36, height: 36 }}>
                    {initial}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 500, lineHeight: 1.25 }}>
                      {accountName}
                    </Typography>
                    <Typography noWrap variant="caption" color="text.secondary" component="div">
                      {accountEmail}
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: "4px !important", mx: -0.5 }} />
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    navigate("/dashboard/settings?tab=profile");
                  }}
                >
                  <ListItemIcon><UserRound size={16} /></ListItemIcon>
                  Profile
                </MenuItem>
                <Divider sx={{ my: "4px !important", mx: -0.5 }} />
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    handleLogout();
                  }}
                  sx={{ color: "error.main" }}
                >
                  <ListItemIcon><LogOut size={16} /></ListItemIcon>
                  Log out
                </MenuItem>
              </MuiMenu>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          className="app-content"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 2, sm: 3 },
            bgcolor: "background.default",
          }}
        >
          <Outlet context={{ admin, canSeeBills }} />
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
