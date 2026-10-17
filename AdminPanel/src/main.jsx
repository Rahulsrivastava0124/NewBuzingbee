import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LucideProvider } from "lucide-react";
import theme from "./theme";
import { FeedbackProvider } from "./components/Feedback";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LucideProvider size={20} strokeWidth={1.75}>
        <ErrorBoundary>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </ErrorBoundary>
      </LucideProvider>
    </ThemeProvider>
  </StrictMode>,
);
