/**
 * Narrative Combat - Combat narration functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import type { FightingStyle } from '@/types/shared.types';
import { getWeaponDisplayName, getWeaponType, pick } from './narrativeUtils';
import {
  getFromArchive,
  interpolateTemplate,
  richHitLocation,
  getStrikeSeverity,
} from './narrativePBPUtils';
import { audioManager } from '@/lib/AudioManager';

type RNG = () => number;

/**
 * Narrates an attack/whiff.
 */
export function narrateAttack(
  rng: RNG,
  attackerName: string,
  weaponId?: string,
  isMastery?: boolean,
  defenderName?: string
): string {
  const wName = getWeaponDisplayName(weaponId);
  const template = getFromArchive(rng, ['pbp', 'whiffs']);
  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
  });
}

/**
 * Narrates a passive ability activation.
 */
export function narratePassive(rng: RNG, style: FightingStyle, actorName: string): string {
  const template = getFromArchive(rng, ['passives', style]);
  return interpolateTemplate(template, { attacker: actorName });
}

/**
 * Narrates a successful parry.
 */
export function narrateParry(rng: RNG, defenderName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ['small_shield', 'medium_shield', 'large_shield'].includes(weaponId);
  const type = isShield ? 'shield' : 'parry';

  const template = getFromArchive(rng, ['pbp', 'defenses', type, 'success']);
  return interpolateTemplate(template, { defender: defenderName, weapon: wName });
}

/**
 * Narrates a successful dodge.
 */
export function narrateDodge(rng: RNG, defenderName: string): string {
  const template = getFromArchive(rng, ['pbp', 'defenses', 'dodge', 'success']);
  return interpolateTemplate(template, { defender: defenderName });
}

/**
 * Narrates a counterstrike.
 */
export function narrateCounterstrike(rng: RNG, name: string): string {
  const template =
    getFromArchive(rng, ['pbp', 'defenses', 'counterstrike']) || '{{attacker}} counters!';
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Narrates a hit with severity-based flavor.
 */
export function narrateHit(
  rng: RNG,
  defenderName: string,
  location: string,
  isMastery?: boolean,
  isSuperFlashy?: boolean,
  attackerName?: string,
  weaponId?: string,
  damage?: number,
  maxHp?: number,
  isFatal?: boolean,
  attackerFame?: number,
  isFavorite?: boolean
): string {
  const richLoc = richHitLocation(rng, location);
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  const severity = getStrikeSeverity(
    damage || 0,
    maxHp || 100,
    isFatal || false,
    isSuperFlashy || false,
    isFavorite || false,
    attackerFame || 0
  );

  if (severity === 'critical_human' || severity === 'critical_supernatural') {
    audioManager.play('crit');
  }

  let template = '';
  if (isFatal) {
    template = getFromArchive(rng, ['pbp', 'executions']);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template = getFromArchive(rng, ['strikes', wType, severity]);
  }

  if (!template || template === 'A fierce exchange occurs.') {
    template =
      getFromArchive(rng, ['strikes', 'generic']) ||
      getFromArchive(rng, ['pbp', 'hits', 'generic']);
  }

  return interpolateTemplate(template, {
    attacker: attackerName,
    defender: defenderName,
    weapon: wName,
    bodyPart: richLoc,
  });
}

/**
 * Narrates a broken parry.
 */
export function narrateParryBreak(rng: RNG, attackerName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  const template =
    getFromArchive(rng, ['pbp', 'defenses', 'parry_break']) || '{{attacker}} breaks the guard!';
  return interpolateTemplate(template, { attacker: attackerName, weapon: wName });
}

/**
 * Narrates initiative win.
 */
export function narrateInitiative(
  rng: RNG,
  winnerName: string,
  isFeint: boolean,
  defenderName?: string
): string {
  const path = isFeint ? ['pbp', 'feints'] : ['pbp', 'initiative'];
  const template = getFromArchive(rng, path);
  return interpolateTemplate(template, { attacker: winnerName, defender: defenderName });
}
