/**
 * Announcer AI — generates flavourful blurbs, hype lines, and recap narration.
 * Consolidated and Unified with the Bard Archive (narrativeContent.json).
 */

import { getFromArchive, interpolateTemplate } from "@/engine/narrativePBP";
import type { IRNGService } from "@/engine/core/rng/IRNGService";

export type AnnounceTone = "neutral" | "hype" | "grim";

/**
 * Generates a summary blurb for a fight.
 */
export function blurb(opts: {
  tone?: AnnounceTone;
  winner?: string;
  loser?: string;
  by?: string;
  rng: IRNGService;
}): string {
  const { rng } = opts;
  const tone = opts.tone || "neutral";
  
  const template = getFromArchive(rng, ["blurbs", tone]);
  
  return interpolateTemplate(template, {
    attacker: opts.winner,
    defender: opts.loser,
    hits: opts.by ? ` by ${opts.by.toLowerCase()}` : ""
  });
}

/**
 * Generates a short reactionary hype line for specific events.
 */
export function commentatorFor(
  tag: "KO" | "Kill" | "Flashy" | "Upset",
  rng: IRNGService
): string {
  return getFromArchive(rng, ["commentary", tag]);
}

/**
 * Generates a one-line summary of a bout's outcome.
 */
export function recapLine(
  winner: string,
  loser: string,
  minutes: number,
  rng: IRNGService
): string {
  const template = getFromArchive(rng, ["recap"]);
  
  return interpolateTemplate(template, {
    attacker: winner,
    defender: loser,
    hits: minutes
  });
}
