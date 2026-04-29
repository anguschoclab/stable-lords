import type { Warrior } from '@/types/state.types';
import type { StableId, FightId } from '@/types/shared.types';
import type { FightOutcome, FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { generateId } from '@/utils/idUtils';
import { StyleRollups } from '@/engine/stats/styleRollups';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import { LoreArchive } from '@/lore/LoreArchive';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import { commentatorFor, blurb, type AnnounceTone } from '@/lore/AnnouncerAI';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

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
  _rivalStableId?: string,
  isRivalry?: boolean,
  _day: number = 0,
  rng?: IRNGService
) {
  const safeRng = rng;
  const boutId = (safeRng ? safeRng.uuid() : generateId(undefined, 'bout')) as FightId;
  const summary: FightSummary = {
    id: boutId,
    week,
    title: `${wA.name} vs ${wD.name}`,
    a: wA.name,
    d: wD.name,
    warriorIdA: wA.id,
    warriorIdD: wD.id,
    // Stable identity fields — needed by stableManager.weeklyIncome (which keys
    // by stableIdA/B) and by ownerNarrative/schedulingAssistant rivalry lookups.
    // Prior code omitted these on regular bouts (only tournament summaries via
    // createFightSummary set them), so rival income from arenaHistory was always
    // 0 and rival treasuries never reflected bout earnings.
    stableIdA: wA.stableId as unknown as StableId,
    stableIdD: wD.stableId as unknown as StableId,
    winner: outcome.winner,
    by: outcome.by,
    styleA: wA.style,
    styleD: wD.style,
    flashyTags: tags,
    fameDeltaA: fA,
    fameDeltaD: fD,
    fameA: wA.fame,
    fameD: wD.fame,
    popularityDeltaA: pA,
    popularityDeltaD: pD,
    transcript: outcome.log.map((e) => e.text),
    isRivalry,
    createdAt: new Date(Date.UTC(2026, 0, 1) + (week - 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Side effects
  StyleRollups.addFight({
    week,
    styleA: wA.style,
    styleD: wD.style,
    winner: outcome.winner,
    by: outcome.by,
  });
  ArenaHistory.append(summary);
  LoreArchive.signalFight(summary);
  NewsletterFeed.appendFightResult({ summary, transcript: summary.transcript ?? [] });

  const tone: AnnounceTone =
    outcome.by === 'Kill' ? 'grim' : tags.includes('Flashy') ? 'hype' : 'neutral';
  // Use SeededRNGService directly as fallback (implements IRNGService)
  const rngService = safeRng || new SeededRNGService(week * 12345 + 67890);
  const announcement =
    outcome.by === 'Kill' || outcome.by === 'KO'
      ? commentatorFor(outcome.by, rngService)
      : blurb({
          tone,
          winner: outcome.winner === 'A' ? wA.name : wD.name,
          loser: outcome.winner === 'A' ? wD.name : wA.name,
          by: outcome.by ?? undefined,
          rng: rngService,
        });

  return { summary, announcement };
}
