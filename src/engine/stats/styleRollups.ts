/**
 * Style rollup tracking — records win/loss/kill rates per style over time.
 * Consolidated: also serves as the style meter (formerly src/metrics/StyleMeter.ts).
 */
const KEY_WEEK = "sl.styleRollups.week";
const KEY_ROLLING = "sl.metrics.style.week10";
const KEY_TOUR = "sl.metrics.style.tournaments";

type Bucket = { w: number; l: number; k: number; pct: number; fights: number };
type RollingBucket = { W: number; L: number; K: number; fights: number };

// ── Validation ────────────────────────────────────────────────────────────

function isBucket(o: any): o is Bucket {
  return (
    !!o &&
    (o as any).w !== undefined &&
    typeof (o as any).w === 'number' &&
    typeof (o as any).l === 'number' &&
    typeof (o as any).k === 'number' &&
    typeof (o as any).pct === 'number' &&
    typeof (o as any).fights === 'number'
  );
}

function isRollingBucket(o: any): o is RollingBucket {
  return (
    !!o &&
    (o as any).W !== undefined &&
    typeof (o as any).W === 'number' &&
    typeof (o as any).L === 'number' &&
    typeof (o as any).K === 'number' &&
    typeof (o as any).fights === 'number'
  );
}

function validateWeekRecord(o: unknown): Record<string, Bucket> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, Bucket> = {};
  for (const key in (o as any)) {
    if (isBucket((o as any)[key])) res[key] = (o as any)[key];
  }
  return res;
}

function validateRollingRecord(o: unknown): Record<string, RollingBucket[]> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, RollingBucket[]> = {};
  for (const key in (o as any)) {
    if (Array.isArray((o as any)[key])) {
      const arr = (o as any)[key].filter(isRollingBucket);
      if (arr.length > 0) res[key] = arr;
    }
  }
  return res;
}

function validateTourRecord(o: unknown): Record<string, Record<string, RollingBucket>> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, Record<string, RollingBucket>> = {};
  for (const tourId in (o as any)) {
    const tourData = (o as any)[tourId];
    if (tourData && typeof tourData === 'object' && !Array.isArray(tourData)) {
      const validatedStyles: Record<string, RollingBucket> = {};
      for (const style in tourData) {
        if (isRollingBucket((tourData as any)[style])) {
          validatedStyles[style] = (tourData as any)[style];
        }
      }
      if (Object.keys(validatedStyles).length > 0) {
        res[tourId] = validatedStyles;
      }
    }
  }
  return res;
}

// ── Week-based rollups ────────────────────────────────────────────────────

function loadWeek(week: number): Record<string, Bucket> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${KEY_WEEK}_${week}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return validateWeekRecord(parsed);
  } catch {
    return {};
  }
}

function saveWeek(week: number, m: Record<string, Bucket>) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${KEY_WEEK}_${week}`, JSON.stringify(m));
  }
}

function ensure(style: string, m: Record<string, Bucket>): Bucket {
  if (!m[style]) m[style] = { w: 0, l: 0, k: 0, pct: 0, fights: 0 };
  return m[style];
}

// ── Rolling window (last 10 fights per style) ─────────────────────────────

function loadRolling(): Record<string, RollingBucket[]> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY_ROLLING);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return validateRollingRecord(parsed);
  } catch {
    return {};
  }
}
function saveRolling(m: Record<string, RollingBucket[]>) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_ROLLING, JSON.stringify(m));
  }
}

function loadTour(): Record<string, Record<string, RollingBucket>> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY_TOUR);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return validateTourRecord(parsed);
  } catch {
    return {};
  }
}
function saveTour(m: Record<string, Record<string, RollingBucket>>) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_TOUR, JSON.stringify(m));
  }
}

// ── Public types ──────────────────────────────────────────────────────────

export type StyleRecord = {
  style: string;
  W: number;
  L: number;
  K: number;
  P: number;
  fights: number;
};

// ── Combined API ──────────────────────────────────────────────────────────

export const StyleRollups = {
  /** Record a fight in both week-rollup and rolling-window trackers */
  addFight(opts: {
    week: number;
    styleA: string;
    styleD: string;
    winner: "A" | "D" | null;
    by: string | null;
    isTournament?: string | null;
  }) {
    // Week rollup
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

    // Rolling window (last 10)
    const rolling = loadRolling();
    const kill = opts.by === "Kill";
    const addRolling = (s: string, win: boolean, killed: boolean) => {
      rolling[s] = rolling[s] || [];
      rolling[s].push({ W: win ? 1 : 0, L: win ? 0 : 1, K: killed ? 1 : 0, fights: 1 });
      while (rolling[s].length > 10) rolling[s].shift();
    };
    addRolling(opts.styleA, opts.winner === "A", kill && opts.winner === "A");
    addRolling(opts.styleD, opts.winner === "D", kill && opts.winner === "D");
    saveRolling(rolling);

    // Tournament tracking
    if (opts.isTournament) {
      const tour = loadTour();
      const tid = opts.isTournament;
      tour[tid] = tour[tid] || {};
      const bump = (s: string, win: boolean, killed: boolean) => {
        tour[tid][s] = tour[tid][s] || { W: 0, L: 0, K: 0, fights: 0 };
        const b = tour[tid][s];
        b.W += win ? 1 : 0;
        b.L += win ? 0 : 1;
        b.K += killed ? 1 : 0;
        b.fights += 1;
      };
      bump(opts.styleA, opts.winner === "A", kill && opts.winner === "A");
      bump(opts.styleD, opts.winner === "D", kill && opts.winner === "D");
      saveTour(tour);
    }
  },

  getWeekRollup(week: number): Record<string, Bucket> {
    return loadWeek(week);
  },

  /** Last 10 fights per style (rolling window) */
  last10(): StyleRecord[] {
    const rolling = loadRolling();
    const rows: StyleRecord[] = [];
    Object.keys(rolling).forEach((s) => {
      const agg = rolling[s].reduce(
        (a, b) => ({ W: a.W + b.W, L: a.L + b.L, K: a.K + b.K, fights: a.fights + b.fights }),
        { W: 0, L: 0, K: 0, fights: 0 }
      );
      rows.push({
        style: s,
        W: agg.W,
        L: agg.L,
        K: agg.K,
        P: agg.fights ? Math.round((agg.W / agg.fights) * 100) : 0,
        fights: agg.fights,
      });
    });
    return rows.sort((a, b) => b.P - a.P);
  },

  /** Tournament-specific stats */
  tournament(tid: string): StyleRecord[] {
    const tour = loadTour()[tid] || {};
    const rows: StyleRecord[] = [];
    Object.keys(tour).forEach((s) => {
      const b = tour[s];
      rows.push({
        style: s,
        W: b.W,
        L: b.L,
        K: b.K,
        P: b.fights ? Math.round((b.W / b.fights) * 100) : 0,
        fights: b.fights,
      });
    });
    return rows.sort((a, b) => b.P - a.P);
  },
};
