import Box from "@mui/material/Box";
import { Hexagon } from "lucide-react";

// Logo tile used in the sidebar, login and printed invoices.
export default function BrandMark({ size = 44 }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.27)}px`,
        display: "grid",
        placeItems: "center",
        color: "#0f172a",
        background: "linear-gradient(135deg, #f5a623 0%, #ff8c00 100%)",
        boxShadow: "0 4px 12px rgba(245,166,35,0.35)",
      }}
    >
      <Hexagon size={Math.round(size * 0.5)} strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
    </Box>
  );
}
