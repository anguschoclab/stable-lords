/**
 * Narrative Post-Bout - Post-bout narration functions
 * Extracted from narrativePBP.ts to follow SRP
 */
import { getWeaponDisplayName, getWeaponType, pick } from './narrativeUtils';
import { getFromArchive, interpolateTemplate, peekArchive } from './narrativePBPUtils';
import { audioManager } from '@/lib/AudioManager';

type RNG = () => number;

/**
 * Narrates bout end.
 */
/**
 * Optional context for data-driven kill-text assembly. When `cause`/`style`/`mood`
 * are supplied, the narrator prefers tiered archive paths (see below) before
 * falling back to generic conclusions. All fields are optional — legacy callers
 * keep working unchanged.
 */
export interface BoutEndContext {
  cause?: string; // DeathCauseBucket: EXECUTION | CRITICAL_CHAIN | ARMOR_FAILURE | FATIGUE_COLLAPSE | RIVALRY_FINISH | FATAL_DAMAGE
  style?: string; // Winner's fighting style — drives tonal selection (e.g. AimedBlow → "precise")
  mood?: string; // CrowdMood — Calm/Bloodthirsty/Theatrical/Solemn/Festive
}

// Map DeathCauseBucket → archive subpath. Missing paths fall through to generic.
const CAUSE_ARCHIVE_PATH: Record<string, string> = {
  EXECUTION: 'execution',
  CRITICAL_CHAIN: 'critical_chain',
  ARMOR_FAILURE: 'armor_failure',
  FATIGUE_COLLAPSE: 'fatigue_collapse',
  RIVALRY_FINISH: 'rivalry_finish',
  FATAL_DAMAGE: 'fatal_damage',
};

export function narrateBoutEnd(
  rng: RNG,
  by: string,
  winnerName: string,
  loserName: string,
  weaponId?: string,
  ctx: BoutEndContext = {}
): string[] {
  const wName = getWeaponDisplayName(weaponId);
  const wType = getWeaponType(weaponId);

  const categoryMap: Record<string, string> = {
    Kill: 'Kill',
    KO: 'KO',
    Stoppage: 'Stoppage',
    Exhaustion: 'Exhaustion',
  };

  const cat = categoryMap[by] || 'KO';
  const conclusionTemplate = getFromArchive(rng, ['conclusions', cat]);
  const conclusion = interpolateTemplate(conclusionTemplate, {
    attacker: winnerName,
    defender: loserName,
    weapon: wName,
  });

  if (cat === 'Kill') audioManager.play('death');

  if (cat === 'Kill') {
    // Tiered lookup for kill-text:
    //   1) kill_text.<cause>.<style>.<mood>  (most specific)
    //   2) kill_text.<cause>.<style>
    //   3) kill_text.<cause>
    //   4) strikes.<weaponType>.fatal        (legacy weapon-first path)
    //   5) strikes.generic                   (ultimate fallback)
    // Each tier only fires if the archive returns a non-fallback line.
    const causeSlug = ctx.cause ? CAUSE_ARCHIVE_PATH[ctx.cause] : undefined;
    const styleSlug = ctx.style ? ctx.style.toLowerCase() : undefined;
    const moodSlug = ctx.mood ? ctx.mood.toLowerCase() : undefined;

    const candidatePaths: string[][] = [];
    if (causeSlug && styleSlug && moodSlug)
      candidatePaths.push(['kill_text', causeSlug, styleSlug, moodSlug]);
    if (causeSlug && styleSlug) candidatePaths.push(['kill_text', causeSlug, styleSlug]);
    if (causeSlug) candidatePaths.push(['kill_text', causeSlug]);
    candidatePaths.push(['strikes', wType, 'fatal']);
    candidatePaths.push(['strikes', 'generic']);

    let fatalBlowTemplate = '';
    const fallbackMarker = 'A fierce exchange occurs.';
    for (const path of candidatePaths) {
      // Silent peek first — avoids console.error spam for expected misses in
      // the tiered cause/style/mood cascade.
      const pool = peekArchive(path);
      if (pool && pool.length > 0) {
        fatalBlowTemplate = getFromArchive(rng, path);
        if (fatalBlowTemplate && fatalBlowTemplate !== fallbackMarker) break;
      }
    }
    if (!fatalBlowTemplate) fatalBlowTemplate = fallbackMarker;

    const fatalBlow = interpolateTemplate(fatalBlowTemplate, {
      attacker: winnerName,
      defender: loserName,
      weapon: wName,
    });
    return [fatalBlow, conclusion];
  }

  return [conclusion];
}

/**
 * Generates popularity line.
 */
export function popularityLine(rng: RNG, name: string, popDelta: number): string | null {
  const cat = popDelta >= 3 ? 'great' : popDelta >= 1 ? 'normal' : '';
  if (!cat) return null;
  const template = getFromArchive(rng, ['pbp', 'meta', 'popularity', cat]);
  return interpolateTemplate(template, { name });
}

/**
 * Generates skill learn line.
 */
export function skillLearnLine(rng: RNG, name: string): string {
  const template = getFromArchive(rng, ['pbp', 'meta', 'skill_learns']);
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Generates trading blows line.
 */
export function tradingBlowsLine(rng: RNG): string {
  return getFromArchive(rng, ['pbp', 'pacing', 'trading_blows']);
}

/**
 * Generates stalemate line.
 */
export function stalemateLine(rng: RNG): string {
  return getFromArchive(rng, ['pbp', 'pacing', 'stalemate']);
}

/**
 * Generates taunt line.
 */
export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  // Fire ~40% of the time (was 20%) — taunts are flavour, not signal, so they
  // should feel present rather than rare. Winners taunt more than losers.
  const threshold = isWinner ? 0.45 : 0.3;
  if (rng() > threshold) return null;
  const cat = isWinner ? 'winner' : 'loser';
  const template = getFromArchive(rng, ['pbp', 'taunts', cat]);
  return interpolateTemplate(template, { attacker: name });
}

/**
 * Generates conserving line.
 */
export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}
