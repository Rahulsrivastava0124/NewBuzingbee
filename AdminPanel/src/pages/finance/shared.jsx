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

export function Modal({ title, onClose, children, wide }) {
  return (
    <Dialog open onClose={onClose} maxWidth={wide ? "md" : "sm"} scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
