/**
 * Combat Math — RNG, phase detection, skill/contest checks.
 * Single source of truth for combat math utilities used by simulate.ts.
 */

type Phase = "opening" | "mid" | "late";

const PHASE_OPENING_THRESHOLD = 0.25;
const PHASE_MID_THRESHOLD = 0.65;

export function getPhase(exchange: number, maxExchanges: number): Phase {
  if (maxExchanges <= 0) return "opening";
  const ratio = exchange / maxExchanges;
  if (ratio <= PHASE_OPENING_THRESHOLD) return "opening";
  if (ratio <= PHASE_MID_THRESHOLD) return "mid";
  return "late";
}

export function pickText(rng: () => number, texts: string[]): string {
  if (texts.length === 0) return "";
  return texts[Math.floor(rng() * texts.length)];
}

export function skillCheck(rng: () => number, skill: number, modifier: number = 0): boolean {
  const roll = Math.floor(rng() * 20) + 1;
  const target = Math.max(1, Math.min(19, Math.floor(skill) + modifier));
  const success = roll === 1 || (roll !== 20 && roll <= target);
  // console.log(`SKILL CHECK: roll ${roll} vs target ${target} -> ${success ? "SUCCESS" : "FAIL"}`);
  return success;
}

export function contestCheck(
  rng: () => number,
  a: number,
  d: number,
  modA: number = 0,
  modD: number = 0,
): boolean {
  const rollA = Math.floor(rng() * 20) + 1 + a + modA;
  const rollD = Math.floor(rng() * 20) + 1 + d + modD;
  return rollA > rollD;
}

export function weatherStaminaModifier(weather?: string): number {
  if (!weather) return 1.0;
  switch (weather) {
    case "Blazing Sun":
      return 1.3; // 30% more stamina drain
    case "Scalding":
      return 1.2; // 20% more stamina drain
    case "Blood Moon":
      return 1.1; // 10% more stamina drain
    case "Gale":
      return 1.15; // 15% more stamina drain
    case "Drafty":
      return 0.9; // 10% less stamina drain
    case "Eclipse":
      return 0.8; // 20% less stamina drain, slow methodical fights
    case "Overcast":
    case "Clear":
    case "Rainy":
    default:
      return 1.0;
  }
}
