import { Phase } from "@/types/game";

export function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getPhase(exchange: number, maxExchanges: number): Phase {
  const PHASE_OPENING_THRESHOLD = 0.25;
  const PHASE_MID_THRESHOLD = 0.65;
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
  const d20 = Math.floor(rng() * 20) + 1;
  const target = Math.max(1, Math.min(19, Math.floor(skill + modifier)));
  if (d20 === 1) return true;
  if (d20 === 20) return false;
  return d20 <= target;
}

export function contestCheck(rng: () => number, a: number, d: number, modA: number = 0, modD: number = 0): boolean {
  const d20A = Math.floor(rng() * 20) + 1;
  const d20D = Math.floor(rng() * 20) + 1;
  const effA = a + modA;
  const effD = d + modD;
  const marginA = effA - d20A;
  const marginD = effD - d20D;
  if (d20A === 1) return true;
  if (d20A === 20) return false;
  if (d20D === 1) return false;
  if (d20D === 20) return true;
  return marginA >= marginD;
}
