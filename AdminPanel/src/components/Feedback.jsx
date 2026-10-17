import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import GlobalStyles from "@mui/material/GlobalStyles";
import { Slide, ToastContainer, toast } from "react-toastify";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

const FeedbackContext = createContext(null);

// Match the admin theme: DM Sans, rounded corners, the panel's status colours
const toastStyles = {
  ":root": {
    "--toastify-font-family": "inherit",
    "--toastify-toast-bd-radius": "14px",
    "--toastify-toast-shadow": "0 12px 32px -8px rgba(17, 24, 39, 0.18)",
    "--toastify-toast-top": "max(16px, env(safe-area-inset-top))",
    "--toastify-color-success": "#059669",
    "--toastify-color-error": "#dc2626",
    "--toastify-color-warning": "#d97706",
    "--toastify-color-info": "#2563eb",
    "--toastify-color-progress-light": "#f5a623",
    "--toastify-text-color-light": "#111827",
  },
  ".Toastify__toast": { fontSize: 14, fontWeight: 500, border: "1px solid #ececef" },
};

// Replaces window.confirm / window.alert: MUI dialogs for confirmations,
// react-toastify pop-ups for notifications.
export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const notify = useCallback((message, severity = "info") => {
    const show = toast[severity] || toast.info;
    // Same text twice in a row (e.g. a double click) shows once
    show(message, { toastId: `${severity}:${message}` });
  }, []);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(
          typeof options === "string" ? { message: options } : options,
        );
      }),
    [],
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {/* Before the app so it is ready for toasts fired while pages first load */}
      <GlobalStyles styles={toastStyles} />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss={false}
        draggable
        limit={4}
        transition={Slide}
        theme="light"
      />
      {children}

      <Dialog open={Boolean(dialog)} onClose={() => close(false)} maxWidth="xs">
        <DialogTitle>{dialog?.title || "Please confirm"}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialog?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={dialog?.destructive === false ? "primary" : "error"}
            onClick={() => close(true)}
            autoFocus
          >
            {dialog?.confirmLabel || "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>


    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}
