/**
 * Narrative Positioning - Range and zone narration functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import { pick } from './narrativeUtils';
import { getFromArchive, interpolateTemplate } from './narrativePBPUtils';

type RNG = () => number;

export const RANGE_NAMES: Record<string, string> = {
  Grapple: 'grappling range',
  Tight: 'tight quarters',
  Striking: 'striking range',
  Extended: 'extended range',
};

/**
 * Narrates range shift.
 */
export function narrateRangeShift(rng: RNG, moverName: string, newRange: string): string {
  const rangeName = RANGE_NAMES[newRange] ?? newRange.toLowerCase();
  const templates = [
    `%A forces the fight to ${rangeName}.`,
    `%A dictates the distance — shifting into ${rangeName}.`,
    `%A drives the gap, repositioning to ${rangeName}.`,
    `%A seizes the spacing advantage, pulling into ${rangeName}.`,
    `%A controls the range — the fight moves to ${rangeName}.`,
  ];
  return interpolateTemplate(pick(rng, templates), { attacker: moverName });
}

/**
 * Narrates feint attempt.
 */
export function narrateFeint(rng: RNG, attackerName: string, succeeded: boolean): string {
  if (succeeded) {
    const template = getFromArchive(rng, ['pbp', 'feints']);
    return interpolateTemplate(template, { attacker: attackerName });
  } else {
    const templates = [
      `%A's feint is read — the deception falls flat.`,
      `%A attempts a feint, but the ruse is transparent.`,
      `%A tries to deceive, but their opponent sees through it instantly.`,
      `%A's misdirection fools no one — the opponent doesn't bite.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: attackerName });
  }
}

/**
 * Narrates zone shift.
 */
export function narrateZoneShift(rng: RNG, pushedName: string, zone: string): string {
  if (zone === 'Corner') {
    const templates = [
      `%A is backed into a corner — options shrinking fast.`,
      `%A finds the wall at their back, hemmed in with nowhere to go.`,
      `%A is driven into the corner — pressure becoming desperate.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  } else if (zone === 'Edge') {
    const templates = [
      `%A gives ground, retreating to the edge of the arena.`,
      `%A is pushed to the boundary — the pressure is mounting.`,
      `%A cedes the center, falling back toward the perimeter.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  } else {
    const templates = [
      `%A recovers ground, reclaiming the center of the arena.`,
      `%A finds space to breathe — pushing away from the wall.`,
      `%A wrestles back to open ground.`,
    ];
    return interpolateTemplate(pick(rng, templates), { attacker: pushedName });
  }
}

/**
 * Generates arena intro line.
 */
export function arenaIntroLine(arenaConfig: { name: string; description: string }): string {
  return `⚔ ${arenaConfig.name.toUpperCase()} — ${arenaConfig.description}`;
}

/**
 * Generates tactic streak line.
 */
export function tacticStreakLine(name: string, tactic: string, streak: number): string | null {
  if (streak === 3) return `${name} is leaning heavily on the ${tactic}.`;
  if (streak >= 5) return `${name}'s repeated ${tactic} is now obvious to everyone watching.`;
  return null;
}

/**
 * Generates pressing line.
 */
export function pressingLine(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'pacing', 'pressing']);
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Narrates insight hint.
 */
export function narrateInsightHint(rng: RNG, attribute: string): string | null {
  const template = getFromArchive(rng, ['pbp', 'insights', attribute]);
  if (!template || template === 'A fierce exchange occurs.') return null;
  return template;
}
