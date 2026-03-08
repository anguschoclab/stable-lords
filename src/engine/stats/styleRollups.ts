/**
 * Style rollup tracking — records win/loss/kill rates per style over time.
 */
const KEY_WEEK = "sl.styleRollups.week";

type Bucket = { w: number; l: number; k: number; pct: number; fights: number };

function loadWeek(week: number): Record<string, Bucket> {
  try {
    const raw = localStorage.getItem(`${KEY_WEEK}_${week}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWeek(week: number, m: Record<string, Bucket>) {
  localStorage.setItem(`${KEY_WEEK}_${week}`, JSON.stringify(m));
}

function ensure(style: string, m: Record<string, Bucket>): Bucket {
  if (!m[style]) m[style] = { w: 0, l: 0, k: 0, pct: 0, fights: 0 };
  return m[style];
}

export const StyleRollups = {
  addFight(opts: {
    week: number;
    styleA: string;
    styleD: string;
    winner: "A" | "D" | null;
    by: string | null;
  }) {
    const wkMap = loadWeek(opts.week);
    const ea = ensure(opts.styleA, wkMap);
    const ed = ensure(opts.styleD, wkMap);
    ea.fights++;
    ed.fights++;
    if (opts.winner === "A") {
      ea.w++;
      ed.l++;
    } else if (opts.winner === "D") {
      ed.w++;
      ea.l++;
    }
    if (opts.by === "Kill") {
      if (opts.winner === "A") ea.k++;
      else if (opts.winner === "D") ed.k++;
    }
    ea.pct = ea.fights ? ea.w / ea.fights : 0;
    ed.pct = ed.fights ? ed.w / ed.fights : 0;
    saveWeek(opts.week, wkMap);
  },

  getWeekRollup(week: number): Record<string, Bucket> {
    return loadWeek(week);
  },
};
