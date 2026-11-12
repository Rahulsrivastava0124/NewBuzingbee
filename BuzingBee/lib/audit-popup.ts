// The "Get Free Audit" popup lives in the Navbar. Anything on the page can open it
// (optionally naming a service to pre-fill) by dispatching this event.
export const AUDIT_POPUP_EVENT = "open-audit-popup";

export function openAuditPopup(service?: string) {
  window.dispatchEvent(new CustomEvent(AUDIT_POPUP_EVENT, { detail: { service } }));
}
