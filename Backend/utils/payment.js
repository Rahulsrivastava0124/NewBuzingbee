// Bank/UPI details printed on invoices: the company's (Settings > Company), or
// for personal clients, those of the admin who manages them (Settings > Profile)
const PAYMENT_FIELDS = ["bankAccountName", "bankName", "bankAccountNumber", "bankIfsc", "upiId"];

const UPI_RE = /^[\w.-]{2,256}@[a-zA-Z][\w-]{1,64}$/;

module.exports = { PAYMENT_FIELDS, UPI_RE };
