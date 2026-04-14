import type { Warrior } from "@/types/state.types";
import type { FightOutcome, FightSummary } from "@/types/combat.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { generateId } from "@/utils/idUtils";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { commentatorFor, blurb, type AnnounceTone } from "@/lore/AnnouncerAI";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";

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
  rng?: IRNGService
) {
  const safeRng = rng;
  const boutId = safeRng ? safeRng.uuid() : generateId(undefined, "bout");
  const summary: FightSummary = { 
    id: boutId, week, title: `${wA.name} vs ${wD.name}`, a: wA.name, d: wD.name, 
    warriorIdA: wA.id, warriorIdD: wD.id,
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
  // Create a simple RNG wrapper if not provided
  const seededFallback = new SeededRNGService(week * 12345 + 67890);
  const fallbackRng: IRNGService = {
    next: () => seededFallback.next(),
    pick: (arr) => {
      if (arr.length === 0) throw new Error("Cannot pick from empty array");
      const idx = Math.floor(seededFallback.next() * arr.length);
      return arr[idx]!;
    },
    uuid: (prefix) => generateId(undefined, prefix || "uuid"),
    roll: (min, max) => Math.floor(seededFallback.next() * (max - min)) + min,
    shuffle: (arr) => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(seededFallback.next() * (i + 1));
        const temp = result[i]!;
        result[i] = result[j]!;
        result[j] = temp;
      }
      return result;
    }
  };
  const rngService = safeRng || fallbackRng;
  const announcement = (outcome.by === "Kill" || outcome.by === "KO")
    ? commentatorFor(outcome.by, rngService)
    : blurb({
        tone,
        winner: outcome.winner === "A" ? wA.name : wD.name,
        loser: outcome.winner === "A" ? wD.name : wA.name,
        by: outcome.by ?? undefined,
        rng: rngService
      });

  return { summary, announcement };
}
