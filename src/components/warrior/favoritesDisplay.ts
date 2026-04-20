/**
 * Favorites display helpers — UI layer only.
 * Separated from engine/favorites.ts to respect SRP:
 * the engine computes state, this module formats it for display.
 */
import type { Warrior } from "@/types/warrior.types";
import { WEAPONS } from "@/data/equipment";

export interface FavoritesDisplayInfo {
  weapon: string | null;
  weaponHint: string | null;
  rhythm: string | null;
  rhythmHint: string | null;
}

/** Get display strings for a warrior's favorites, respecting discovery state. */
export function getFavoritesDisplay(warrior: Warrior): FavoritesDisplayInfo {
  const fav = warrior.favorites;
  if (!fav) return { weapon: null, weaponHint: null, rhythm: null, rhythmHint: null };

  const weaponItem = WEAPONS.find((w) => w.id === fav.weaponId);

  const weaponWeight = weaponItem?.weight ?? 3;
  const weightLabel =
    weaponWeight <= 2 ? "light" : weaponWeight <= 4 ? "medium" : "heavy";

  const oeValue = fav.rhythm.oe;
  const offenseLabel =
    oeValue <= 4 ? "conservative" : oeValue >= 7 ? "aggressive" : "moderate";

  return {
    weapon: fav.discovered.weapon ? (weaponItem?.name ?? fav.weaponId) : null,
    weaponHint:
      !fav.discovered.weapon && fav.discovered.weaponHints > 0
        ? fav.discovered.weaponHints >= 2
          ? `Prefers ${weightLabel} weapons`
          : "Developing preference..."
        : null,
    rhythm: fav.discovered.rhythm
      ? `OE ${fav.rhythm.oe} / AL ${fav.rhythm.al}`
      : null,
    rhythmHint:
      !fav.discovered.rhythm && fav.discovered.rhythmHints > 0
        ? fav.discovered.rhythmHints >= 2
          ? `Favors ${offenseLabel} offense`
          : "Developing rhythm..."
        : null,
  };
}
