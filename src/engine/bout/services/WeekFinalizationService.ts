/**
 * Week Finalization Service
 * Handles post-bout side effects: crowd mood, gazette, rivalries
 * Extracted from boutProcessorService.ts to enforce SRP
 */
import type { GameState } from "@/types/state.types";
import type { StateImpact } from "@/engine/impacts";
import type { BoutResult } from "./boutProcessorService";
import { computeCrowdMood } from "@/engine/crowdMood";
import { updateRivalriesFromBouts } from "@/engine/matchmaking/rivalryLogic";
import { generateWeeklyGazette } from "@/engine/gazetteNarrative";
import { getFightsForWeek } from "@/engine/core/historyUtils";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";

/**
 * Finalizes week side effects into StateImpact
 * Includes: fame delta, crowd mood, gazette, rivalries
 */
export function finalizeWeekSideEffectsToImpact(
  state: GameState,
  results: BoutResult[]
): StateImpact {
  const playerFameGain = results.filter(
    (r) => r.outcome.winner === "A" && !r.rivalStable
  ).length;
  const newMood = computeCrowdMood(state.arenaHistory);
  const oldMood = state.crowdMood;

  // Unified fame tracking: player.fame is the authority
  const impact: StateImpact = {
    fameDelta: playerFameGain,
    crowdMood: newMood,
    moodHistory: [
      ...(state.moodHistory || []).slice(-19),
      { week: state.week, mood: newMood },
    ],
  };

  // Add mood change notification if mood changed significantly
  if (oldMood && oldMood !== newMood) {
    impact.newsletterItems = [
      {
        id: `mood_change_${state.week}`,
        week: state.week,
        title: `Crowd Mood Shift: ${oldMood} → ${newMood}`,
        items: [
          `The arena atmosphere has shifted from ${oldMood} to ${newMood}. This will affect fame gains, kill probabilities, and gazette tone this week.`,
        ],
      },
    ];
  }

  const weekFights = getFightsForWeek(state.arenaHistory, state.week);
  const gazetteRng = createWeekRng(state.week, 123);
  impact.gazettes = [
    generateWeeklyGazette(
      weekFights,
      newMood,
      state.week,
      state.graveyard,
      state.arenaHistory,
      gazetteRng
    ),
  ];
  const rng = createWeekRng(state.week, 13);
  impact.rivalries = updateRivalriesFromBouts(
    state.rivalries || [],
    weekFights,
    state.week,
    rng
  );

  NewsletterFeed.closeWeekToIssue(state.week);

  return impact;
}
