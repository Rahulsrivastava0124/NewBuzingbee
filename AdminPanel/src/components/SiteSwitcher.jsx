import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check, ChevronsUpDown, Globe, Search } from "lucide-react";
import { BLOG_SITES } from "../services/api";

// Picks which website's blog, enquiries and stats the dashboard shows.
export default function SiteSwitcher({ site, onChange }) {
  const [anchor, setAnchor] = useState(null);
  const [query, setQuery] = useState("");
  const current = BLOG_SITES.find((s) => s.value === site) || BLOG_SITES[0];
  const shown = BLOG_SITES.filter((s) =>
    s.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const close = () => {
    setAnchor(null);
    setQuery("");
  };

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="listbox"
        aria-label={`Website: ${current.label}. Switch website`}
        sx={{
          width: "100%",
          gap: 1.25,
          p: 1.25,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          justifyContent: "space-between",
          textAlign: "left",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
          <Globe size={20} />
          <Typography noWrap sx={{ fontWeight: 700 }}>
            {current.label}
          </Typography>
        </Stack>
        <ChevronsUpDown size={16} />
      </ButtonBase>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 300, p: 1, borderRadius: 3, ml: 1 } } }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", px: 1.5, py: 0.75, mb: 1, border: 1, borderColor: "divider", borderRadius: 2 }}
        >
          <Search size={16} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Search websites…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ "aria-label": "Search websites" }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 700 }}>
          Websites
        </Typography>
        <Box role="listbox" sx={{ mt: 0.5 }}>
          {shown.map((s) => (
            <ButtonBase
              key={s.value}
              role="option"
              aria-selected={s.value === site}
              onClick={() => {
                close();
                if (s.value !== site) onChange(s.value);
              }}
              sx={{
                width: "100%",
                justifyContent: "space-between",
                px: 1.25,
                py: 1.25,
                borderRadius: 2,
                bgcolor: s.value === site ? "action.selected" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <Globe size={18} />
                <Typography sx={{ fontWeight: 600 }}>{s.label}</Typography>
              </Stack>
              {s.value === site && <Check size={16} />}
            </ButtonBase>
          ))}
          {!shown.length && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
              No website matches.
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}
