/**
 * Favorite Weapon & Rhythm Discovery System
 *
 * Each warrior has hidden favorite weapon and OE/AL rhythm generated at creation.
 * These are discovered through bout experience:
 * - After 5 fights: first hint appears in combat log
 * - After 10 fights: second hint (narrows down)
 * - After 15 fights: fully revealed
 * - Insight Tokens (tournament rewards) skip the grind
 *
 * Using favorite weapon grants +1 ATT, favorite rhythm grants +1 INI.
 */
import type { Warrior, WarriorFavorites } from "@/types/warrior.types";
import { FightingStyle } from "@/types/shared.types";
import { WEAPONS, getAvailableItems, STYLE_CLASSIC_WEAPONS } from "@/data/equipment";

// ─── Generation ─────────────────────────────────────────────────────────

/** Preferred OE/AL ranges per style (favorites are drawn from these) */
const STYLE_RHYTHM_RANGES: Record<FightingStyle, { oe: [number, number]; al: [number, number] }> = {
  [FightingStyle.AimedBlow]:       { oe: [3, 5],  al: [4, 6]  },
  [FightingStyle.BashingAttack]:   { oe: [7, 9],  al: [3, 5]  },
  [FightingStyle.LungingAttack]:   { oe: [6, 8],  al: [6, 8]  },
  [FightingStyle.ParryLunge]:      { oe: [4, 6],  al: [4, 6]  },
  [FightingStyle.ParryRiposte]:    { oe: [2, 4],  al: [3, 5]  },
  [FightingStyle.ParryStrike]:     { oe: [4, 6],  al: [4, 6]  },
  [FightingStyle.SlashingAttack]:  { oe: [6, 8],  al: [5, 7]  },
  [FightingStyle.StrikingAttack]:  { oe: [6, 8],  al: [4, 6]  },
  [FightingStyle.TotalParry]:      { oe: [2, 4],  al: [2, 4]  },
  [FightingStyle.WallOfSteel]:     { oe: [3, 5],  al: [4, 6]  },
};

/** Generate hidden favorites for a warrior at creation */
export function generateFavorites(
  style: FightingStyle,
  rng: () => number
): WarriorFavorites {
  // Favorite weapon: draw randomly from style-appropriate pool (no bias toward canonical gear)
  // This allows for "unideal" but legal favorites (e.g. lightweight warrior favoring a medium weapon)
  const available = getAvailableItems("weapon", style);
  const weaponId = available[Math.floor(rng() * available.length)]?.id ?? "broadsword";

  // Favorite rhythm: 80% chance of style-standard range, 20% global "weird" range
  const useStyleRange = rng() < 0.8;
  let oe: number, al: number;
  
  if (useStyleRange) {
    const range = STYLE_RHYTHM_RANGES[style];
    oe = range.oe[0] + Math.floor(rng() * (range.oe[1] - range.oe[0] + 1));
    al = range.al[0] + Math.floor(rng() * (range.al[1] - range.al[0] + 1));
  } else {
    oe = 1 + Math.floor(rng() * 9);
    al = 1 + Math.floor(rng() * 9);
  }

  return {
    weaponId,
    rhythm: { oe, al },
    discovered: {
      weapon: false,
      rhythm: false,
      weaponHints: 0,
      rhythmHints: 0,
    },
  };
}

// ─── Discovery ──────────────────────────────────────────────────────────

const CHANCE_REVEAL_BASE = 0.02;     // 2% "Lucky Epiphany"
const CHANCE_REVEAL_SYMMETRY = 0.25; // 25% if using correct gear
const CHANCE_HINT = 0.10;           // 10% chance to learn a hint regardless

export interface DiscoveryResult {
  updated: boolean;
  hints: string[];
  weaponRevealed: boolean;
  rhythmRevealed: boolean;
}

/** Check if a warrior should discover more about their favorites after a bout */
export function checkDiscovery(
  warrior: Warrior, 
  rng: () => number,
  context?: { weaponId: string; oe: number; al: number }
): DiscoveryResult {
  const fav = warrior.favorites;
  if (!fav) return { updated: false, hints: [], weaponRevealed: false, rhythmRevealed: false };

  const hints: string[] = [];
  let updated = false;
  let weaponRevealed = false;
  let rhythmRevealed = false;

  // 1. Weapon Discovery Roll
  if (!fav.discovered.weapon) {
    const isUsingFav = context?.weaponId === fav.weaponId;
    const revealRoll = isUsingFav ? CHANCE_REVEAL_SYMMETRY : CHANCE_REVEAL_BASE;
    
    if (rng() < revealRoll) {
      fav.discovered.weapon = true;
      weaponRevealed = true;
      const weaponItem = WEAPONS.find(w => w.id === fav.weaponId);
      const sparkLine = isUsingFav 
        ? `✨ A moment of pure clarity! ${warrior.name} has mastered the ${weaponItem?.name ?? fav.weaponId}!`
        : `💡 A sudden epiphany! ${warrior.name} realizes their true weapon preference is the ${weaponItem?.name ?? fav.weaponId}.`;
      hints.push(sparkLine);
      updated = true;
    } else if (rng() < CHANCE_HINT && fav.discovered.weaponHints < 2) {
      fav.discovered.weaponHints++;
      hints.push(`🔍 ${warrior.name} is developing a distinct feel for certain weapons...`);
      updated = true;
    }
  }

  // 2. Rhythm Discovery Roll
  if (!fav.discovered.rhythm) {
    const isMatchingRhythm = context && Math.abs(context.oe - fav.rhythm.oe) <= 1 && Math.abs(context.al - fav.rhythm.al) <= 1;
    const revealRoll = isMatchingRhythm ? CHANCE_REVEAL_SYMMETRY : CHANCE_REVEAL_BASE;

    if (rng() < revealRoll) {
      fav.discovered.rhythm = true;
      rhythmRevealed = true;
      hints.push(`✨ ${warrior.name} has found their natural soul-rhythm: OE ${fav.rhythm.oe}, AL ${fav.rhythm.al}!`);
      updated = true;
    } else if (rng() < CHANCE_HINT && fav.discovered.rhythmHints < 2) {
      fav.discovered.rhythmHints++;
      hints.push(`🔍 ${warrior.name} is finding their own unique rhythm in the chaos of battle.`);
      updated = true;
    }
  }

  return { updated, hints, weaponRevealed, rhythmRevealed };
}

// ─── Combat Bonuses ─────────────────────────────────────────────────────

/** Get ATT bonus from using favorite weapon (only if discovered) */
export function getFavoriteWeaponBonus(warrior: Warrior): number {
  const fav = warrior.favorites;
  if (!fav?.discovered.weapon) return 0;
  const equippedWeapon = warrior.equipment?.weapon ?? "broadsword";
  return equippedWeapon === fav.weaponId ? 1 : 0;
}

/** Get INI bonus from matching favorite rhythm (only if discovered, perfect match) */
export function getFavoriteRhythmBonus(warrior: Warrior, currentOE: number, currentAL: number): number {
  const fav = warrior.favorites;
  if (!fav?.discovered.rhythm) return 0;
  const oeMatches = currentOE === fav.rhythm.oe;
  const alMatches = currentAL === fav.rhythm.al;
  // Perfect match = +2 INI
  if (oeMatches && alMatches) return 2;
  return 0;
}

/** Apply Insight Token — instantly reveals weapon or rhythm */
export function applyInsightToken(
  warrior: Warrior,
  type: "weapon" | "rhythm"
): string {
  const fav = warrior.favorites;
  if (!fav) return `${warrior.name} has no hidden favorites.`;

  if (type === "weapon") {
    if (fav.discovered.weapon) return `${warrior.name} already knows their favorite weapon.`;
    fav.discovered.weapon = true;
    const weaponItem = WEAPONS.find(w => w.id === fav.weaponId);
    return `Weapon Insight Token used! ${warrior.name}'s favorite weapon is the ${weaponItem?.name ?? fav.weaponId}.`;
  } else {
    if (fav.discovered.rhythm) return `${warrior.name} already knows their natural rhythm.`;
    fav.discovered.rhythm = true;
    return `Rhythm Insight Token used! ${warrior.name}'s natural rhythm is OE ${fav.rhythm.oe}, AL ${fav.rhythm.al}.`;
  }
}

