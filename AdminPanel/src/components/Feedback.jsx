import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";

const FeedbackContext = createContext(null);

// Replaces window.confirm / window.alert with MUI dialogs and snackbars.
export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const notify = useCallback((message, severity = "info") => {
    setToast({ message, severity, key: Date.now() });
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

      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== "clickaway" && setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity || "info"}
          variant="filled"
          onClose={() => setToast(null)}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside FeedbackProvider");
  return ctx;
}
