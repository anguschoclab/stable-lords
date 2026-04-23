/**
 * Stable Lords — UI Preferences
 * Simple persistence for non-gameplay UI state.
 */

import { STORE_KEYS } from '@/constants/storeKeys';

export interface UIPrefs {
  dashboardLayout?: string[];
  theme?: 'dark' | 'light';
  coachDismissed?: string[];
}

const STORAGE_KEY = STORE_KEYS.UI_PREFS;

export async function loadUIPrefs(): Promise<UIPrefs> {
  if (typeof window === 'undefined') return {};

  // Try electron-store first (Electron environment)
  if (window.electronAPI) {
    try {
      const data = await window.electronAPI.storeGet(STORAGE_KEY);
      return data ? data : {};
    } catch {
      return {};
    }
  }

  // Fallback to localStorage (web environment)
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveUIPrefs(prefs: UIPrefs): Promise<void> {
  if (typeof window === 'undefined') return;

  // Try electron-store first (Electron environment)
  if (window.electronAPI) {
    try {
      const current = await loadUIPrefs();
      await window.electronAPI.storeSet(STORAGE_KEY, { ...current, ...prefs });
    } catch (err) {
      console.error('Failed to save UI prefs to electron-store:', err);
    }
    return;
  }

  // Fallback to localStorage (web environment)
  try {
    const current = await loadUIPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch (err) {
    if ((err as Error)?.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded when saving UI preferences', err);
      // UI prefs are not critical, just log and continue
    } else {
      console.error('Failed to save UI prefs:', err);
    }
  }
}
