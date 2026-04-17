/**
 * Narrative Post-Bout - Post-bout narration functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import { getWeaponDisplayName, getWeaponType, pick } from "./narrativeUtils";
import { getFromArchive, interpolateTemplate } from "./narrativePBPUtils";
import { audioManager } from "@/lib/AudioManager";

type RNG = () => number;

/**
 * Narrates bout end.
 */
export function narrateBoutEnd(rng: RNG, by: string, winnerName: string, loserName: string, weaponId?: string): string[] {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);
  
  const categoryMap: Record<string, string> = {
    "Kill": "Kill",
    "KO": "KO",
    "Stoppage": "Stoppage",
    "Exhaustion": "Exhaustion"
  };

  const cat = categoryMap[by] || "KO";
  const conclusionTemplate = getFromArchive(rng, ["conclusions", cat]);
  const conclusion = interpolateTemplate(conclusionTemplate, { attacker: winnerName, defender: loserName, weapon: wName });

  if (cat === "Kill") audioManager.play("death");

  if (cat === "Kill") {
     const fatalBlowTemplate = getFromArchive(rng, ["strikes", wType, "fatal"]) || getFromArchive(rng, ["strikes", "generic"]);
     const fatalBlow = interpolateTemplate(fatalBlowTemplate, { attacker: winnerName, defender: loserName, weapon: wName });
     return [fatalBlow, conclusion];
  }
  
  return [conclusion];
}

/**
 * Generates popularity line.
 */
export function popularityLine(rng: RNG, name: string, popDelta: number): string | null {
  const cat = popDelta >= 3 ? "great" : popDelta >= 1 ? "normal" : "";
  if (!cat) return null;
  const template = getFromArchive(rng, ["pbp", "meta", "popularity", cat]);
  return interpolateTemplate(template, { name });
}

/**
 * Generates skill learn line.
 */
export function skillLearnLine(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ["pbp", "meta", "skill_learns"]);
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Generates trading blows line.
 */
export function tradingBlowsLine(rng: RNG): string {
  return getFromArchive(rng, ["pbp", "pacing", "trading_blows"]);
}

/**
 * Generates stalemate line.
 */
export function stalemateLine(rng: RNG): string {
  return getFromArchive(rng, ["pbp", "pacing", "stalemate"]);
}

/**
 * Generates taunt line.
 */
export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  if (rng() > 0.2) return null;
  const cat = isWinner ? "winner" : "loser";
  const template = getFromArchive(rng, ["pbp", "taunts", cat]);
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Generates conserving line.
 */
export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}
