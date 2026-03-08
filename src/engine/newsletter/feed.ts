/**
 * Newsletter feed — collects fight cards per week and generates issues.
 */
import type { FightSummary } from "@/types/game";

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
  if (f.flashyTags?.includes("KO")) s += 2;
  if (f.flashyTags?.includes("Kill")) s += 3;
  if (f.by === "Draw") s += 1;
  return s;
}

const current: FightCard[] = [];

export const NewsletterFeed = {
  appendFightResult(card: FightCard) {
    current.push(card);
  },

  closeWeekToIssue(week: number): NewsletterIssue {
    const fights = [...current];
    current.length = 0;

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
      highlights: { fightOfTheWeekId: bestId, topMovers: [] },
      styleRollups: {},
      createdAt: new Date().toISOString(),
    };
  },
};
