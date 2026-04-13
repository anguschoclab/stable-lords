/**
 * Stable Lords — UI Preferences
 * Simple persistence for non-gameplay UI state.
 */

export interface UIPrefs {
  dashboardLayout?: string[];
  theme?: "dark" | "light";
  coachDismissed?: string[];
}

const STORAGE_KEY = "sl.ui.prefs";

export function loadUIPrefs(): UIPrefs {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveUIPrefs(prefs: UIPrefs): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadUIPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (err) {
    if ((err as Error)?.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded when saving UI preferences', err);
      // UI prefs are not critical, just log and continue
    } else {
      console.error("Failed to save UI prefs:", err);
    }
  }
}
