import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { settingsAPI } from "../services/api";

// One request per page load, shared by every BrandMark on screen
let brandPromise = null;
const loadLogoUrl = () => {
  brandPromise ??= settingsAPI
    .getBrand()
    .then((res) => res?.logoUrl || "")
    .catch(() => "");
  return brandPromise;
};

// Company logo uploaded in Settings → Company.
export default function BrandMark({ size = 44 }) {
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    let alive = true;
    loadLogoUrl().then((url) => alive && setLogoUrl(url));
    return () => {
      alive = false;
    };
  }, []);

  if (logoUrl) {
    return (
      <Box
        component="img"
        src={logoUrl}
        alt="Company logo"
        sx={{
          height: size,
          maxWidth: size * 4.5,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
          // The uploaded logo has an off-white background; blend it into the page
          mixBlendMode: "multiply",
        }}
      />
    );
  }

  // Empty spacer until the logo loads, so the layout doesn't jump
  return <Box aria-hidden sx={{ height: size, flexShrink: 0 }} />;
}
