/**
 * Style Meter — tracks win/loss/kill rates per fighting style.
 */
type Bucket = { W: number; L: number; K: number; fights: number };

const KEY_STYLE_WEEK = "sl.metrics.style.week10";
const KEY_STYLE_TOUR = "sl.metrics.style.tournaments";

function loadMap(): Record<string, Bucket[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY_STYLE_WEEK) || "{}");
  } catch {
    return {};
  }
}
function saveMap(m: Record<string, Bucket[]>) {
  localStorage.setItem(KEY_STYLE_WEEK, JSON.stringify(m));
}

function loadTour(): Record<string, Record<string, Bucket>> {
  try {
    return JSON.parse(localStorage.getItem(KEY_STYLE_TOUR) || "{}");
  } catch {
    return {};
  }
}
function saveTour(m: Record<string, Record<string, Bucket>>) {
  localStorage.setItem(KEY_STYLE_TOUR, JSON.stringify(m));
}

export type StyleRecord = {
  style: string;
  W: number;
  L: number;
  K: number;
  P: number;
  fights: number;
};

export const StyleMeter = {
  recordFight(outcome: {
    styleA: string;
    styleD: string;
    winner: "A" | "D" | null;
    by: string | null;
    isTournament?: string | null;
  }) {
    const week = loadMap();
    const adjust = (s: string, win: boolean, kill: boolean) => {
      week[s] = week[s] || [];
      week[s].push({ W: win ? 1 : 0, L: win ? 0 : 1, K: kill ? 1 : 0, fights: 1 });
      while (week[s].length > 10) week[s].shift();
    };
    const kill = outcome.by === "Kill";
    adjust(outcome.styleA, outcome.winner === "A", kill && outcome.winner === "A");
    adjust(outcome.styleD, outcome.winner === "D", kill && outcome.winner === "D");
    saveMap(week);

    if (outcome.isTournament) {
      const tour = loadTour();
      const tid = outcome.isTournament;
      tour[tid] = tour[tid] || {};
      const bump = (s: string, win: boolean, kill: boolean) => {
        tour[tid][s] = tour[tid][s] || { W: 0, L: 0, K: 0, fights: 0 };
        const b = tour[tid][s];
        b.W += win ? 1 : 0;
        b.L += win ? 0 : 1;
        b.K += kill ? 1 : 0;
        b.fights += 1;
      };
      bump(outcome.styleA, outcome.winner === "A", kill && outcome.winner === "A");
      bump(outcome.styleD, outcome.winner === "D", kill && outcome.winner === "D");
      saveTour(tour);
    }
  },

  last10(): StyleRecord[] {
    const week = loadMap();
    const rows: StyleRecord[] = [];
    Object.keys(week).forEach((s) => {
      const agg = week[s].reduce(
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
