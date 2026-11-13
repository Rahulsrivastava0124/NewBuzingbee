import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { STATUS_COLOR, titleCase } from "./format";
import { X } from "lucide-react";

export function StatusBadge({ status }) {
  return (
    <Chip
      size="small"
      label={titleCase(status)}
      color={STATUS_COLOR[status] || "default"}
      sx={status === "cancelled" ? { textDecoration: "line-through" } : undefined}
    />
  );
}

// busy: a save is in flight, so the dialog can't be closed (its result would land
// on whatever form is open next)
export function Modal({ title, onClose, children, wide, busy }) {
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth={wide ? "md" : "sm"} scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={busy}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
