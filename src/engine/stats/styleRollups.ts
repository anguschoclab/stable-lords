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

function isBucket(o: unknown): o is Bucket {
  return (
    !!o &&
    (o as Bucket).w !== undefined &&
    typeof (o as Bucket).w === 'number' &&
    typeof (o as Bucket).l === 'number' &&
    typeof (o as Bucket).k === 'number' &&
    typeof (o as Bucket).pct === 'number' &&
    typeof (o as Bucket).fights === 'number'
  );
}

function isRollingBucket(o: unknown): o is RollingBucket {
  return (
    !!o &&
    (o as RollingBucket).W !== undefined &&
    typeof (o as RollingBucket).W === 'number' &&
    typeof (o as RollingBucket).L === 'number' &&
    typeof (o as RollingBucket).K === 'number' &&
    typeof (o as RollingBucket).fights === 'number'
  );
}

function validateWeekRecord(o: unknown): Record<string, Bucket> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, Bucket> = {};
  const obj = o as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (isBucket(value)) res[key] = value;
  }
  return res;
}

function validateRollingRecord(o: unknown): Record<string, RollingBucket[]> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, RollingBucket[]> = {};
  const obj = o as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (Array.isArray(value)) {
      const arr = value.filter(isRollingBucket);
      if (arr.length > 0) res[key] = arr;
    }
  }
  return res;
}

function validateTourRecord(o: unknown): Record<string, Record<string, RollingBucket>> {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {};
  const res: Record<string, Record<string, RollingBucket>> = {};
  const obj = o as Record<string, unknown>;
  for (const tourId in obj) {
    const tourData = obj[tourId];
    if (typeof tourData === 'object' && tourData !== null && !Array.isArray(tourData)) {
      const validWeeks: Record<string, RollingBucket> = {};
      const tourObj = tourData as Record<string, unknown>;
      for (const weekId in tourObj) {
        const weekData = tourObj[weekId];
        if (isRollingBucket(weekData)) validWeeks[weekId] = weekData;
      }
      if (Object.keys(validWeeks).length > 0) res[tourId] = validWeeks;
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
    try {
      localStorage.setItem(`${KEY_WEEK}_${week}`, JSON.stringify(m));
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error(`localStorage quota exceeded when saving week ${week} style rollups`, error);
        // Attempt to clear older weeks to free up space
        try {
          for (let i = week - 10; i >= 1; i--) {
            localStorage.removeItem(`${KEY_WEEK}_${i}`);
          }
          // Retry saving
          localStorage.setItem(`${KEY_WEEK}_${week}`, JSON.stringify(m));
        } catch (retryError) {
          console.error(`Failed to recover from localStorage quota error for week ${week}`, retryError);
        }
      } else {
        console.error(`Failed to save week ${week} style rollups`, error);
      }
    }
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
    try {
      localStorage.setItem(KEY_ROLLING, JSON.stringify(m));
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded when saving rolling style metrics', error);
        // Rolling metrics are ephemeral, can be recalculated, so just log and continue
      } else {
        console.error('Failed to save rolling style metrics', error);
      }
    }
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
    try {
      localStorage.setItem(KEY_TOUR, JSON.stringify(m));
    } catch (error) {
      if ((error as Error)?.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded when saving tournament style metrics', error);
        // Tournament metrics are ephemeral, can be recalculated, so just log and continue
      } else {
        console.error('Failed to save tournament style metrics', error);
      }
    }
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
      const list = rolling[s] || [];
      rolling[s] = list;
      list.push({ W: win ? 1 : 0, L: win ? 0 : 1, K: killed ? 1 : 0, fights: 1 });
      while (list.length > 10) list.shift();
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
        const tourData = tour[tid] || {};
        tour[tid] = tourData;
        const b = tourData[s] || { W: 0, L: 0, K: 0, fights: 0 };
        tourData[s] = b;
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
      const styleData = rolling[s];
      if (!styleData) return;
      const agg = styleData.reduce(
        (a: RollingBucket, b: RollingBucket) => ({ W: a.W + b.W, L: a.L + b.L, K: a.K + b.K, fights: a.fights + b.fights }),
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
      if (!b) return;
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
