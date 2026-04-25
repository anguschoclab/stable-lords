import { createFighterState } from './bout/fighterState';
import { resolveDecision } from './bout/decisionLogic';
import { defaultPlanForWarrior } from './bout/planDefaults';
import { getPhase as getCombatPhase } from './combat/mechanics/combatMath';
import { DEFAULT_LOADOUT, checkWeaponRequirements } from '@/data/equipment';
import {
  getMatchupBonus,
  MAX_EXCHANGES,
  EXCHANGES_PER_MINUTE,
} from './combat/mechanics/combatConstants';
import {
  resolveEffectiveTactics,
  resolveExchange,
  type ResolutionContext,
} from './combat/resolution/resolution';
import { narrateEvents, NarrationContext } from './combat/narrative/narrator';
import {
  generateWarriorIntro,
  battleOpener,
  minuteStatusLine,
  narrateBoutEnd,
  conservingLine,
  tacticStreakLine,
  arenaIntroLine,
} from './narrativePBP';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Trainer, FightOutcomeBy } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type {
  FightPlan,
  FightOutcome,
  MinuteEvent,
  DeathCauseBucket,
  ExchangeLogEntry,
  CombatEvent,
} from '@/types/combat.types';
import type { WeatherType, DistanceRange, ArenaZone } from '@/types/shared.types';
import { getTrainerMods } from './combat/mechanics/simulateHelpers';
import { getWeatherEffect, weatherOpeningLine } from './combat/mechanics/weatherEffects';
import { getArenaById } from '@/data/arenas';
import { getFeatureFlags } from '@/engine/featureFlags';
import type { CrowdMood } from '@/engine/crowdMood';

/**
 * Per-mood kill-window deltas. Magnitudes intentionally tiny — the 0.025 cap
 * in `calculateKillWindow` (lowered from 0.08 in 2026-04 to enable retirements)
 * keeps per-bout mortality near the ~5% baseline even when a Bloodthirsty
 * crowd stacks with other risk factors. Halved 2026-04 in proportion to the
 * cap reduction so crowd mood remains a modulation, not a near-binary switch.
 */
const CROWD_KILL_BONUS: Record<CrowdMood, number> = {
  Calm: 0,
  Bloodthirsty: 0.004,
  Theatrical: 0,
  Solemn: -0.002,
  Festive: 0,
};

// ─── Exports from sub-modules for backward compatibility ───
export { createFighterState, resolveDecision, defaultPlanForWarrior };

type Phase = 'OPENING' | 'MID' | 'LATE';

function getPhase(exchange: number, maxExchanges: number): Phase {
  const p = getCombatPhase(exchange, maxExchanges);
  return p.toUpperCase() as Phase;
}

/**
 * Derive a structured `ExchangeLogEntry` from the `CombatEvent[]` emitted by
 * `resolveExchange`. Strictly a read-over-events projection — no resolution
 * logic lives here, which keeps this callable safely on any event stream.
 * Consumers: HighlightLog curation, telemetry aggregation, kill-text tiers.
 */
function buildExchangeLogEntry(
  exchangeIndex: number,
  minute: number,
  phase: Phase,
  events: CombatEvent[]
): ExchangeLogEntry {
  const entry: ExchangeLogEntry = { exchangeIndex, minute, phase };
  const reasonCodes: string[] = [];
  for (const e of events) {
    switch (e.type) {
      case 'INITIATIVE':
        entry.iniWinner = e.actor;
        break;
      case 'ATTACK':
        if (e.result === 'WHIFF') entry.attResult = 'miss';
        else if (e.metadata?.crit) entry.attResult = 'crit';
        else if (e.result === 'FUMBLE') entry.attResult = 'fumble';
        break;
      case 'DEFENSE':
        if (e.result === 'PARRY') {
          entry.parResult = 'success';
          entry.attResult ??= 'miss';
        } else if (e.result === 'DODGE') {
          entry.defResult = 'dodge';
          entry.attResult ??= 'miss';
        } else if (e.result === 'RIPOSTE') entry.ripResult = 'hit';
        break;
      case 'HIT':
        entry.attResult ??= e.metadata?.crit ? 'crit' : 'hit';
        if (typeof e.value === 'number') entry.damage = (entry.damage ?? 0) + e.value;
        if (e.location) entry.hitLocation = e.location;
        break;
      case 'BOUT_END':
        if (e.metadata?.cause) reasonCodes.push(`CAUSE_${String(e.metadata.cause)}`);
        entry.executionFlag = e.result === 'Kill';
        entry.killWindow ??= e.result === 'Kill';
        break;
    }
  }
  if (reasonCodes.length) entry.reasonCodes = reasonCodes;
  return entry;
}

/**
 * Simulates a fight between two plans/warriors.
 *
 * @param planA - Strategy for fighter A
 * @param planD - Strategy for fighter D
 * @param warriorA - Warrior data for A (optional)
 * @param warriorD - Warrior data for D (optional)
 * @param providedRng - Seeded RNG function (optional, generates one if missing)
 * @param trainers - Active trainers providing global modifiers
 */
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  providedRng?: (() => number) | number,
  trainers?: Trainer[],
  weather: WeatherType = 'Clear',
  arenaId: string = 'standard_arena',
  crowdMood?: CrowdMood
): FightOutcome {
  // 1. Deterministic RNG setup
  let rngService: IRNGService;
  let rng: () => number;
  if (typeof providedRng === 'function') {
    rng = providedRng;
    // Create a wrapper service for functions that need IRNGService
    rngService = {
      next: rng,
      pick: <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)],
    } as IRNGService;
  } else {
    const seed =
      typeof providedRng === 'number' ? providedRng : crypto.getRandomValues(new Uint32Array(1))[0];
    rngService = new SeededRNGService(seed);
    rng = () => rngService.next();
  }

  const nameA = warriorA?.name ?? 'Attacker';
  const nameD = warriorD?.name ?? 'Defender';
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  const fA = createFighterState('A', planA, warriorA, trainers);
  const fD = createFighterState('D', planD, warriorD, trainers);

  if (weather === 'Blood Moon') {
    // Blood Moon drives fighters to a frenzy
    fA.plan = { ...fA.plan, killDesire: Math.min(10, (fA.plan.killDesire ?? 5) + 3) };
    fD.plan = { ...fD.plan, killDesire: Math.min(10, (fD.plan.killDesire ?? 5) + 3) };
  }

  const modsA = trainers
    ? getTrainerMods(trainers, planA.style)
    : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };
  const modsD = trainers
    ? getTrainerMods(trainers, planD.style)
    : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };

  const weaponReqA = checkWeaponRequirements(
    weaponA,
    warriorA?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 }
  );
  const weaponReqD = checkWeaponRequirements(
    weaponD,
    warriorD?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 }
  );

  const resCtx: ResolutionContext = {
    rng,
    phase: 'OPENING',
    exchange: 0,
    weather,
    weatherEffect: getWeatherEffect(weather),
    matchupA: getMatchupBonus(planA.style, planD.style),
    matchupD: getMatchupBonus(planD.style, planA.style),
    trainerModsA: modsA,
    trainerModsD: modsD,
    trainers: trainers ?? [],
    weaponReqA: {
      endurancePenalty: weaponReqA.endurancePenalty,
      attPenalty: weaponReqA.attPenalty,
    },
    weaponReqD: {
      endurancePenalty: weaponReqD.endurancePenalty,
      attPenalty: weaponReqD.attPenalty,
    },
    tacticStreakA: 0,
    tacticStreakD: 0,
    range: 'Striking' as DistanceRange,
    zone: 'Center' as ArenaZone,
    arenaConfig: getArenaById(arenaId),
    surfaceMod: getArenaById(arenaId).surfaceMod,
    pushedFighter: undefined,
    crowdKillBonus:
      getFeatureFlags().crowdMoodLethality && crowdMood ? CROWD_KILL_BONUS[crowdMood] : 0,
  };

  const log: MinuteEvent[] = [];
  const exchangeLog: ExchangeLogEntry[] = [];
  const skipNarration = getFeatureFlags().skipCombatNarration;

  const tags = new Set<string>();
  let prevHpRatioA = 1.0;
  let prevHpRatioD = 1.0;
  let winner: 'A' | 'D' | null = null;
  let by: FightOutcome['by'] = null;
  let lastPhase: string | null = null;
  let lastMinuteMarker = 0;

  let causeBucket: DeathCauseBucket | undefined;
  let fatalHitLocation: string | undefined;
  let fatalExchangeIndex: number | undefined;

  // ── 1. Introductions ──
  if (!skipNarration) {
    const introA = generateWarriorIntro(
      rng,
      {
        name: nameA,
        style: planA.style,
        weaponId: weaponA,
        armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor,
        helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm,
        attributes: warriorA?.attributes,
        backupWeaponId: (warriorA?.equipment as { backup?: string } | undefined)?.backup,
      },
      warriorA?.attributes?.SZ
    );
    const introD = generateWarriorIntro(
      rng,
      {
        name: nameD,
        style: planD.style,
        weaponId: weaponD,
        armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor,
        helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm,
        attributes: warriorD?.attributes,
        backupWeaponId: (warriorD?.equipment as { backup?: string } | undefined)?.backup,
      },
      warriorD?.attributes?.SZ
    );

    introA.forEach((line) => log.push({ minute: 0, text: line }));
    log.push({ minute: 0, text: '' });
    introD.forEach((line) => log.push({ minute: 0, text: line }));
    log.push({ minute: 0, text: '' });

    // Emit weather opening line with explicit type name (skipped for Clear/Overcast)
    const weatherLine = weatherOpeningLine(weather);
    if (weatherLine) log.push({ minute: 0, text: `☁ ${weather.toUpperCase()} — ${weatherLine}` });

    // Emit arena intro line for non-default arenas
    if (arenaId !== 'standard_arena') {
      log.push({ minute: 0, text: arenaIntroLine(resCtx.arenaConfig) });
    }

    log.push({ minute: 1, text: battleOpener(rng) });
    if (planA.OE <= 3) log.push({ minute: 1, text: conservingLine(nameA) });
    if (planD.OE <= 3) log.push({ minute: 1, text: conservingLine(nameD) });
  }

  // ── 2. Main Simulation Loop ──
  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
    const phase = getPhase(ex, MAX_EXCHANGES);
    resCtx.phase = phase;
    resCtx.exchange = ex;

    // Phase Change & Tactic Reveal
    if (phase !== lastPhase) {
      lastPhase = phase;
      const phaseKey = phase.toLowerCase() as 'opening' | 'mid' | 'late';
      const tacticsA = resolveEffectiveTactics(fA.plan, phaseKey);
      const tacticsD = resolveEffectiveTactics(fD.plan, phaseKey);
      if (!skipNarration) {
        log.push({
          minute: min,
          text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`,
          phase,
          offTacticA: tacticsA.offTactic !== 'none' ? tacticsA.offTactic : undefined,
          defTacticA: tacticsA.defTactic !== 'none' ? tacticsA.defTactic : undefined,
          offTacticD: tacticsD.offTactic !== 'none' ? tacticsD.offTactic : undefined,
          defTacticD: tacticsD.defTactic !== 'none' ? tacticsD.defTactic : undefined,
        });
      }
    }

    if (!skipNarration && min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      log.push({ minute: min, text: `MINUTE ${min}.` });
      log.push({
        minute: min,
        text: minuteStatusLine(rng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded),
      });
    }

    // A. Resolve Math (Dice)
    const events = resolveExchange(resCtx, fA, fD);
    exchangeLog.push(buildExchangeLogEntry(ex, min, phase, events));

    // B. Resolve Narration (Drama)
    if (!skipNarration) {
      const narCtx: NarrationContext = {
        rng,
        nameA,
        nameD,
        weaponA,
        weaponD,
        styleA: fA.style,
        styleD: fD.style,
        maxHpA: fA.maxHp,
        maxHpD: fD.maxHp,
        prevHpRatioA,
        prevHpRatioD,
        fameA: warriorA?.fame ?? 0,
        fameD: warriorD?.fame ?? 0,
        isFavoriteA: !!warriorA?.favorites?.discovered?.weapon,
        isFavoriteD: !!warriorD?.favorites?.discovered?.weapon,
      };
      const { log: newLines, lastHpRatioA, lastHpRatioD } = narrateEvents(events, narCtx, min);
      log.push(...newLines);
      prevHpRatioA = lastHpRatioA;
      prevHpRatioD = lastHpRatioD;

      // Tactic streak commentary — emit only at the 3 and 5 thresholds
      if ((resCtx.tacticStreakA === 3 || resCtx.tacticStreakA === 5) && resCtx.lastOffTacticA) {
        const streakLine = tacticStreakLine(nameA, resCtx.lastOffTacticA, resCtx.tacticStreakA);
        if (streakLine) log.push({ minute: min, text: streakLine });
      }
      if ((resCtx.tacticStreakD === 3 || resCtx.tacticStreakD === 5) && resCtx.lastOffTacticD) {
        const streakLine = tacticStreakLine(nameD, resCtx.lastOffTacticD, resCtx.tacticStreakD);
        if (streakLine) log.push({ minute: min, text: streakLine });
      }
    }

    // C. Check for End Events
    const boutEnd = events.find((e) => e.type === 'BOUT_END');
    if (boutEnd) {
      by = boutEnd.result as FightOutcomeBy;
      fatalHitLocation = boutEnd.metadata?.location as string;
      fatalExchangeIndex = ex;
      causeBucket = boutEnd.metadata?.cause as DeathCauseBucket;

      // Kill/KO: actor = who scored it (winner)
      // Stoppage: actor = who ran out of endurance (loser) → other fighter wins
      // Exhaustion: both ran out simultaneously → draw
      if (by === 'Stoppage') {
        winner = boutEnd.actor === 'A' ? 'D' : 'A';
      } else if (by === 'Exhaustion') {
        winner = null;
      } else {
        winner = boutEnd.actor === 'A' ? 'A' : 'D';
      }

      // For narration: winnerName first, loserName second
      const boutActorIsWinner = by !== 'Stoppage';
      const narWinner = boutActorIsWinner
        ? boutEnd.actor === 'A'
          ? nameA
          : nameD
        : boutEnd.actor === 'A'
          ? nameD
          : nameA;
      const narLoser = boutActorIsWinner
        ? boutEnd.actor === 'A'
          ? nameD
          : nameA
        : boutEnd.actor === 'A'
          ? nameA
          : nameD;
      // Pass kill-cause, winner's style, and crowd mood so narrativePostBout can
      // pick from tiered archive paths (cause × style × mood → cause × style → cause → generic).
      const winnerStyle = boutEnd.actor === 'A' ? planA.style : planD.style;
      if (!skipNarration) {
        const boutEndLines = narrateBoutEnd(rng, by as string, narWinner, narLoser, undefined, {
          cause: causeBucket,
          style: winnerStyle,
          mood: crowdMood,
        });
        boutEndLines.forEach((line) => log.push({ minute: min, text: line }));
      }
      break;
    }
  }

  // ── 3. Decision Logic (if time limit reached) ──
  if (!winner) {
    const finalOutcome = resolveDecision(fA, fD, nameA, nameD, rng);
    winner = finalOutcome.winner;
    by = finalOutcome.by;
    if (!skipNarration) {
      log.push({
        minute: Math.floor(MAX_EXCHANGES / EXCHANGES_PER_MINUTE),
        text: finalOutcome.narrative,
      });
    }
  }

  // Outcome Tags & Postprocessing
  const fightMinutes = Math.max(1, log[log.length - 1]?.minute ?? 1);
  if (fightMinutes <= 3) tags.add('Quick');
  if (fightMinutes >= 8) tags.add('Epic');

  if (winner) {
    const w = winner === 'A' ? fA : fD;
    const l = winner === 'A' ? fD : fA;
    if (w.hp < w.maxHp * 0.3 && w.hitsLanded > l.hitsLanded) tags.add('Comeback');
    if (w.hitsLanded >= 5) tags.add('Dominance');
    if (by === 'KO') tags.add('KO');
    if (by === 'Kill') tags.add('Kill');
    if (w.ripostes >= 3) tags.add('RiposteChain');
    if (w.ripostes >= 2 || w.hitsLanded >= 6) tags.add('Flashy');
  }

  return {
    winner,
    by,
    minutes: Math.max(1, log[log.length - 1]?.minute ?? 1),
    log,
    exchangeLog,
    post: {
      xpA: winner === 'A' ? 2 : 1,
      xpD: winner === 'D' ? 2 : 1,
      hitsA: fA.hitsLanded,
      hitsD: fD.hitsLanded,
      gotKillA: winner === 'A' && by === 'Kill',
      gotKillD: winner === 'D' && by === 'Kill',
      tags: Array.from(tags),
      causeBucket,
      fatalHitLocation,
      fatalExchangeIndex,
    },
  };
}
