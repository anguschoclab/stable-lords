import { Warrior, FightOutcome, FightSummary } from "@/types/game";
import { generateId } from "@/utils/idUtils";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { commentatorFor, blurb, type AnnounceTone } from "@/lore/AnnouncerAI";

export function handleReporting(
  wA: Warrior, 
  wD: Warrior, 
  outcome: FightOutcome, 
  tags: string[], 
  fA: number, 
  pA: number, 
  fD: number, 
  pD: number, 
  week: number, 
  rivalStableId?: string, 
  isRivalry?: boolean,
  day: number = 0,
  rng?: () => number
) {
  const safeRng = rng || Math.random;
  const boutId = `b_w${week}_d${day}_${Math.floor(safeRng() * 1000000)}`;
  const summary: FightSummary = { 
    id: boutId, week, title: `${wA.name} vs ${wD.name}`, a: wA.name, d: wD.name, 
    winner: outcome.winner, by: outcome.by, styleA: wA.style, styleD: wD.style, 
    flashyTags: tags, fameDeltaA: fA, fameDeltaD: fD, fameA: wA.fame, fameD: wD.fame, 
    popularityDeltaA: pA, popularityDeltaD: pD, transcript: outcome.log.map(e => e.text), 
    isRivalry, createdAt: new Date().toISOString() 
  };
  
  // Side effects
  StyleRollups.addFight({ week, styleA: wA.style, styleD: wD.style, winner: outcome.winner, by: outcome.by });
  ArenaHistory.append(summary);
  LoreArchive.signalFight(summary);
  NewsletterFeed.appendFightResult({ summary, transcript: summary.transcript ?? [] });

  const tone: AnnounceTone = outcome.by === "Kill" ? "grim" : (tags.includes("Flashy") ? "hype" : "neutral");
  const announcement = (outcome.by === "Kill" || outcome.by === "KO") 
    ? commentatorFor(outcome.by) 
    : blurb({ 
        tone, 
        winner: outcome.winner === "A" ? wA.name : wD.name, 
        loser: outcome.winner === "A" ? wD.name : wA.name, 
        by: outcome.by ?? undefined 
      });

  return { summary, announcement };
}
