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
// Other websites managed here show their own logo instead of the company one
const SITE_LOGOS = { hustlershive: "/hustlershive-logo.webp" };

export default function BrandMark({ size = 44, site = "buzingbee" }) {
  const [logoUrl, setLogoUrl] = useState("");
  const siteLogo = SITE_LOGOS[site];

  useEffect(() => {
    let alive = true;
    loadLogoUrl().then((url) => alive && setLogoUrl(url));
    return () => {
      alive = false;
    };
  }, []);

  if (siteLogo) {
    return (
      <Box
        component="img"
        src={siteLogo}
        alt="The Hustlers Hive logo"
        sx={{ height: size, width: size, objectFit: "contain", borderRadius: "50%", display: "block", flexShrink: 0 }}
      />
    );
  }

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
