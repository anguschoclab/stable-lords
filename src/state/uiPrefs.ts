/**
 * UI Preferences — persisted to localStorage.
 */
import type { UIPrefs } from "@/types/game";

const KEY = "sl.uiprefs.v1";

export function loadUIPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { autoTunePlan: true };
}

export function saveUIPrefs(p: UIPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}
