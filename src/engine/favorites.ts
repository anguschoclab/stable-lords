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
import { FightingStyle, type Warrior, type WarriorFavorites } from "@/types/game";
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
  // Favorite weapon: 60% chance of classic weapon, 40% random from available
  const available = getAvailableItems("weapon", style);
  const classicId = STYLE_CLASSIC_WEAPONS[style];
  let weaponId: string;
  if (rng() < 0.6 && classicId) {
    weaponId = classicId;
  } else {
    weaponId = available[Math.floor(rng() * available.length)]?.id ?? "broadsword";
  }

  // Favorite rhythm: random within style's preferred range
  const range = STYLE_RHYTHM_RANGES[style];
  const oe = range.oe[0] + Math.floor(rng() * (range.oe[1] - range.oe[0] + 1));
  const al = range.al[0] + Math.floor(rng() * (range.al[1] - range.al[0] + 1));

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

const WEAPON_HINT_FIGHTS = 5;
const WEAPON_REVEAL_FIGHTS = 15;
const RHYTHM_HINT_FIGHTS = 7;
const RHYTHM_REVEAL_FIGHTS = 18;

export interface DiscoveryResult {
  updated: boolean;
  hints: string[];
  weaponRevealed: boolean;
  rhythmRevealed: boolean;
}

/** Check if a warrior should discover more about their favorites after a bout */
export function checkDiscovery(warrior: Warrior): DiscoveryResult {
  const totalFights = warrior.career.wins + warrior.career.losses;
  const fav = warrior.favorites;
  if (!fav) return { updated: false, hints: [], weaponRevealed: false, rhythmRevealed: false };

  const hints: string[] = [];
  let updated = false;
  let weaponRevealed = false;
  let rhythmRevealed = false;

  // Weapon discovery
  if (!fav.discovered.weapon) {
    if (totalFights >= WEAPON_REVEAL_FIGHTS) {
      fav.discovered.weapon = true;
      const weaponItem = WEAPONS.find(w => w.id === fav.weaponId);
      hints.push(`💡 ${warrior.name} has discovered their favorite weapon: ${weaponItem?.name ?? fav.weaponId}! (+1 ATT when equipped)`);
      updated = true;
    } else if (totalFights >= WEAPON_HINT_FIGHTS * 2 && fav.discovered.weaponHints < 2) {
      fav.discovered.weaponHints = 2;
      const weaponItem = WEAPONS.find(w => w.id === fav.weaponId);
      const weight = weaponItem?.weight ?? 3;
      const category = weight <= 2 ? "light" : weight <= 4 ? "medium" : "heavy";
      hints.push(`🔍 ${warrior.name} seems to favor ${category} weapons — a preference is emerging...`);
      updated = true;
    } else if (totalFights >= WEAPON_HINT_FIGHTS && fav.discovered.weaponHints < 1) {
      fav.discovered.weaponHints = 1;
      hints.push(`🔍 ${warrior.name} shows subtle weapon preferences in training — keep fighting to learn more.`);
      updated = true;
    }
  }

  // Rhythm discovery
  if (!fav.discovered.rhythm) {
    if (totalFights >= RHYTHM_REVEAL_FIGHTS) {
      fav.discovered.rhythm = true;
      hints.push(`💡 ${warrior.name} has found their natural rhythm: OE ${fav.rhythm.oe}, AL ${fav.rhythm.al}! (+1 INI when matched)`);
      updated = true;
    } else if (totalFights >= RHYTHM_HINT_FIGHTS * 2 && fav.discovered.rhythmHints < 2) {
      fav.discovered.rhythmHints = 2;
      const oeLabel = fav.rhythm.oe <= 4 ? "conservative" : fav.rhythm.oe >= 7 ? "aggressive" : "moderate";
      hints.push(`🔍 ${warrior.name} fights best with a ${oeLabel} offensive approach...`);
      updated = true;
    } else if (totalFights >= RHYTHM_HINT_FIGHTS && fav.discovered.rhythmHints < 1) {
      fav.discovered.rhythmHints = 1;
      hints.push(`🔍 ${warrior.name} is developing fight rhythm preferences — more bouts will reveal them.`);
      updated = true;
    }
  }

  return { updated, hints };
}

// ─── Combat Bonuses ─────────────────────────────────────────────────────

/** Get ATT bonus from using favorite weapon (only if discovered) */
export function getFavoriteWeaponBonus(warrior: Warrior): number {
  const fav = warrior.favorites;
  if (!fav?.discovered.weapon) return 0;
  const equippedWeapon = warrior.equipment?.weapon ?? "broadsword";
  return equippedWeapon === fav.weaponId ? 1 : 0;
}

/** Get INI bonus from matching favorite rhythm (only if discovered, ±1 tolerance) */
export function getFavoriteRhythmBonus(warrior: Warrior, currentOE: number, currentAL: number): number {
  const fav = warrior.favorites;
  if (!fav?.discovered.rhythm) return 0;
  const oeDiff = Math.abs(currentOE - fav.rhythm.oe);
  const alDiff = Math.abs(currentAL - fav.rhythm.al);
  // Perfect match = +1 INI, within 1 = +0, further = 0
  if (oeDiff <= 1 && alDiff <= 1) return 1;
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

/** Get display info for warrior's favorites (respects discovery state) */
export function getFavoritesDisplay(warrior: Warrior): {
  weapon: string | null;
  weaponHint: string | null;
  rhythm: string | null;
  rhythmHint: string | null;
} {
  const fav = warrior.favorites;
  if (!fav) return { weapon: null, weaponHint: null, rhythm: null, rhythmHint: null };

  const weaponItem = WEAPONS.find(w => w.id === fav.weaponId);

  return {
    weapon: fav.discovered.weapon ? (weaponItem?.name ?? fav.weaponId) : null,
    weaponHint: !fav.discovered.weapon && fav.discovered.weaponHints > 0
      ? fav.discovered.weaponHints >= 2
        ? `Prefers ${(weaponItem?.weight ?? 3) <= 2 ? "light" : (weaponItem?.weight ?? 3) <= 4 ? "medium" : "heavy"} weapons`
        : "Developing preference..."
      : null,
    rhythm: fav.discovered.rhythm ? `OE ${fav.rhythm.oe} / AL ${fav.rhythm.al}` : null,
    rhythmHint: !fav.discovered.rhythm && fav.discovered.rhythmHints > 0
      ? fav.discovered.rhythmHints >= 2
        ? `Favors ${fav.rhythm.oe <= 4 ? "conservative" : fav.rhythm.oe >= 7 ? "aggressive" : "moderate"} offense`
        : "Developing rhythm..."
      : null,
  };
}
