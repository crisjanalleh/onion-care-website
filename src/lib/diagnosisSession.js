/**
 * Carries a finished-but-unsaved assessment from the wizard to the result page.
 * Only the browser holds it: nothing is stored until the farmer chooses to save.
 */
const KEY = "onioncare:pending-diagnosis";

export function readPendingDiagnosis() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writePendingDiagnosis(value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // A full or unavailable session storage just means nothing to carry over.
  }
}

export function clearPendingDiagnosis() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
