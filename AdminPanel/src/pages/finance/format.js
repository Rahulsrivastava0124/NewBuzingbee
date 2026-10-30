export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const toInputDate = (d = new Date()) => {
  const date = new Date(d);
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
};

export const PAYMENT_METHODS = [
  ["upi", "UPI"],
  ["bank-transfer", "Bank Transfer"],
  ["cash", "Cash"],
  ["card", "Card"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];

export const methodLabel = (m) =>
  PAYMENT_METHODS.find(([v]) => v === m)?.[1] || m;

export const EXPENSE_CATEGORIES = [
  "software",
  "hosting",
  "marketing",
  "salary",
  "freelancer",
  "office",
  "travel",
  "tax",
  "other",
];

export const titleCase = (s = "") =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

// Date-only inputs are sent as local noon so the calendar day survives any
// timezone round-trip (midnight UTC would show as the previous day west of UTC).
export const dateToApi = (value) =>
  value ? new Date(`${value}T12:00:00`).toISOString() : undefined;

export const STATUS_COLOR = {
  paid: "success",
  credit: "success",
  partial: "info",
  sent: "info",
  overdue: "error",
  debit: "error",
  draft: "default",
  cancelled: "default",
  pending: "warning",
  approved: "success",
  rejected: "error",
};

// "Due today", "Due in 3 days", "5 days overdue" for a due date.
export const dueLabel = (dueDate, now = new Date()) => {
  if (!dueDate) return "";
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const days = Math.round((startOfDay(dueDate) - startOfDay(now)) / 86400000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
};
