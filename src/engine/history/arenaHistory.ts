/**
 * Arena history — persists fight summaries to localStorage.
 */
import type { FightSummary } from "@/types/combat.types";

const KEY = "sl.arenaHistory";

function load(): FightSummary[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(arr: FightSummary[]) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded when saving arena history', error);
        // Arena history is capped at 500 entries, attempt to clear older entries
        try {
          const existing = load();
          if (existing.length > 100) {
            const trimmed = existing.slice(-100);
            localStorage.setItem(KEY, JSON.stringify(trimmed));
          }
        } catch (retryError) {
          console.error('Failed to recover from localStorage quota error for arena history', retryError);
        }
      } else {
        console.error('Failed to save arena history', error);
      }
    }
  }
}

export const ArenaHistory = {
  all(): FightSummary[] {
    return load();
  },

  append(summary: FightSummary) {
    const arr = load();
    arr.push(summary);
    while (arr.length > 500) arr.shift();

    const cleaned = arr.map((f, i, array) => {
      if (array.length - i > 20 && f.transcript) {
        const { transcript, ...rest } = f;
        return rest as FightSummary;
      }
      return f;
    });

    save(cleaned);
  },

  query(opts: { week?: number; warriorName?: string } = {}): FightSummary[] {
    let arr = load();
    if (opts.week != null) arr = arr.filter((f) => f.week === opts.week);
    if (opts.warriorName)
      arr = arr.filter(
        (f) => f.a === opts.warriorName || f.d === opts.warriorName
      );
    return arr;
  },
};
