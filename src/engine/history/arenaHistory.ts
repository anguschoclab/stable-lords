/**
 * Arena history — persists fight summaries to localStorage.
 */
import type { FightSummary } from "@/types/game";

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
    localStorage.setItem(KEY, JSON.stringify(arr));
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
    save(arr);
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
