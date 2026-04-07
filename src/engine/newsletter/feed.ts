/**
 * Newsletter feed — collects fight cards per week and generates issues.
 */
import type { FightSummary } from "@/types/combat.types";

export interface FightCard {
  summary: FightSummary;
  transcript: string[];
}

export interface NewsletterIssue {
  id: string;
  week: number;
  fights: FightCard[];
  highlights: {
    fightOfTheWeekId?: string | null;
    topMovers?: { name: string; fameDelta: number; popDelta: number }[];
  };
  styleRollups: Record<
    string,
    { w: number; l: number; k: number; pct: number; fights: number }
  >;
  createdAt: string;
}

function scoreFight(f: FightSummary): number {
  let s = 0;
  if (f.flashyTags?.includes("Comeback")) s += 3;
  if (f.flashyTags?.includes("Flashy")) s += 2;
  if (f.by === "KO") s += 2;
  if (f.by === "Kill") s += 3;
  if (f.by === "Draw") s += 1;
  return s;
}

function computeStyleRollups(fights: FightCard[]): Record<string, { w: number; l: number; k: number; pct: number; fights: number }> {
  const rollups: Record<string, { w: number; l: number; k: number; pct: number; fights: number }> = {};
  const ensure = (s: string) => {
    if (!rollups[s]) rollups[s] = { w: 0, l: 0, k: 0, pct: 0, fights: 0 };
  };

  for (const card of fights) {
    const f = card.summary;
    ensure(f.styleA);
    ensure(f.styleD);
    rollups[f.styleA].fights++;
    rollups[f.styleD].fights++;

    if (f.winner === "A") {
      rollups[f.styleA].w++;
      rollups[f.styleD].l++;
    } else if (f.winner === "D") {
      rollups[f.styleD].w++;
      rollups[f.styleA].l++;
    }

    if (f.by === "Kill") {
      if (f.winner === "A") rollups[f.styleA].k++;
      else if (f.winner === "D") rollups[f.styleD].k++;
    }
  }

  // Calculate percentages
  for (const key of Object.keys(rollups)) {
    const r = rollups[key];
    r.pct = r.fights > 0 ? Math.round((r.w / r.fights) * 100) : 0;
  }

  return rollups;
}

function computeTopMovers(fights: FightCard[]): { name: string; fameDelta: number; popDelta: number }[] {
  const movers = new Map<string, { name: string; fameDelta: number; popDelta: number }>();

  for (const card of fights) {
    const f = card.summary;
    // Track fighter A
    const existA = movers.get(f.a) ?? { name: f.a, fameDelta: 0, popDelta: 0 };
    existA.fameDelta += f.fameDeltaA ?? 0;
    existA.popDelta += f.popularityDeltaA ?? 0;
    movers.set(f.a, existA);

    // Track fighter D
    const existD = movers.get(f.d) ?? { name: f.d, fameDelta: 0, popDelta: 0 };
    existD.fameDelta += f.fameDeltaD ?? 0;
    existD.popDelta += f.popularityDeltaD ?? 0;
    movers.set(f.d, existD);
  }

  return [...movers.values()]
    .sort((a, b) => (b.fameDelta + b.popDelta) - (a.fameDelta + a.popDelta))
    .slice(0, 5);
}

const current: FightCard[] = [];

export const NewsletterFeed = {
  appendFightResult(card: FightCard) {
    current.push(card);
  },

  closeWeekToIssue(week: number): NewsletterIssue {
    const fights = [...current];
    current.length = 0;
    return this.generateIssue(week, fights);
  },

  clear() {
    current.length = 0;
  },

  generateIssue(week: number, fights: FightCard[]): NewsletterIssue {

    let bestId: string | null = null;
    let best = -1;
    for (const c of fights) {
      const sc = scoreFight(c.summary);
      if (sc > best) {
        best = sc;
        bestId = c.summary.id;
      }
    }

    return {
      id: `issue_${week}`,
      week,
      fights,
      highlights: {
        fightOfTheWeekId: bestId,
        topMovers: computeTopMovers(fights),
      },
      styleRollups: computeStyleRollups(fights),
      createdAt: new Date().toISOString(),
    };
  },
};
