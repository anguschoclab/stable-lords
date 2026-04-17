/**
 * Gazette Factory - Main factory functions for gazette generation
 * Extracted from gazetteNarrative.ts to follow SRP
 */
import type { FightSummary } from "@/types/combat.types";
import type { CrowdMoodType } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { GazetteStory } from "@/types/state.types";
import type { IRNGService } from "@/engine/core/rng/IRNGService";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { MOOD_TONE } from "./gazetteTemplateHelpers";
import {
  computeStreaks,
  detectRivalryMatchup,
  detectGazetteTags,
  detectHotStreakers,
  detectRisingStars,
  detectUpsets,
  type GazetteDetections
} from "./gazetteDetections";
import { generateGazetteHeadline, generateGazetteBody, generateSeasonSummary } from "./gazetteNarrative";

/**
 * Generates a weekly gazette from fight data.
 */
export function generateWeeklyGazette(
  fights: FightSummary[],
  mood: CrowdMoodType,
  week: number,
  graveyard: Warrior[],
  allFights?: FightSummary[],
  rng?: IRNGService
): GazetteStory {
  const rngService = rng || new SeededRNGService(week * 7919 + 55);
  const storyId = rngService.uuid();
  const moodKey = mood && MOOD_TONE[mood] ? mood : "Calm";
  const tone = MOOD_TONE[moodKey];

  // Run all detections
  const streaks = allFights ? computeStreaks(allFights) : new Map<string, number>();
  const hotStreakers = detectHotStreakers(fights, streaks);
  const rivalryPair = detectRivalryMatchup(fights, allFights ?? []);
  const risingStars = detectRisingStars(fights, allFights ?? []);
  const upsets = detectUpsets(fights);

  const detections: GazetteDetections = {
    tags: [],
    hotStreakers,
    rivalryPair,
    risingStars,
    upsets,
  };

  // Generate tags from detections
  detections.tags = detectGazetteTags(fights, detections);

  // Generate headline and body using helper functions
  const headline = generateGazetteHeadline(detections, fights, week, mood, rngService, tone);
  const body = generateGazetteBody(detections, fights, mood, week, graveyard, rngService, tone);

  return {
    id: storyId,
    headline,
    body,
    mood,
    tags: detections.tags,
    week,
  };
}
