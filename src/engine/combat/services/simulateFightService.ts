import type { FightingStyle, WeatherType } from "@/types/shared.types";
import type { Warrior } from "@/types/warrior.types";
import type { Trainer } from "@/types/state.types";
import type { 
  FightPlan, 
  FightOutcome, 
  MinuteEvent, 
  DeathCauseBucket 
} from "@/types/combat.types";
import { DEFAULT_LOADOUT } from "@/data/equipment";
import { getPhase as getCombatPhase } from "@/engine/combat/combatMath";
import { generateWarriorIntro, battleOpener, conservingLine, minuteStatusLine, narrateBoutEnd } from "@/engine/narrativePBP";
import { resolveExchange, resolveEffectiveTactics, MAX_EXCHANGES, EXCHANGES_PER_MINUTE } from "@/engine/combat/resolution";
import { narrateEvents, NarrationContext } from "@/engine/combat/narrator";
import { resolveDecision } from "@/engine/bout/decisionLogic";
import { setupRng, setupFightersAndContext, processOutcomeTags } from "../simulate/core/simulateHelpers";

function getPhase(exchange: number, maxExchanges: number): "OPENING" | "MID" | "LATE" {
  const p = getCombatPhase(exchange, maxExchanges);
  return p.toUpperCase() as "OPENING" | "MID" | "LATE";
}

export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  providedRng?: (() => number) | number,
  trainers?: Trainer[],
  weather: WeatherType = "Clear"
): FightOutcome {
  const rng = setupRng(providedRng);
  const { nameA, nameD, weaponA, weaponD, fA, fD, resCtx } = setupFightersAndContext(planA, planD, warriorA, warriorD, trainers, weather, rng);

  const log: MinuteEvent[] = [];
  let prevHpRatioA = 1.0, prevHpRatioD = 1.0;
  let winner: "A" | "D" | null = null;
  let by: FightOutcome["by"] = null;
  let lastPhase: string | null = null;
  let lastMinuteMarker = 0;
  let causeBucket: DeathCauseBucket | undefined;
  let fatalHitLocation: string | undefined;
  let fatalExchangeIndex: number | undefined;

  // Introductions
  const introA = generateWarriorIntro(rng, { name: nameA, style: planA.style, weaponId: weaponA, armorId: (warriorA?.equipment ?? DEFAULT_LOADOUT).armor, helmId: (warriorA?.equipment ?? DEFAULT_LOADOUT).helm }, warriorA?.attributes?.SZ);
  const introD = generateWarriorIntro(rng, { name: nameD, style: planD.style, weaponId: weaponD, armorId: (warriorD?.equipment ?? DEFAULT_LOADOUT).armor, helmId: (warriorD?.equipment ?? DEFAULT_LOADOUT).helm }, warriorD?.attributes?.SZ);
  introA.forEach(line => log.push({ minute: 0, text: line })); log.push({ minute: 0, text: "" });
  introD.forEach(line => log.push({ minute: 0, text: line })); log.push({ minute: 0, text: "" });
  log.push({ minute: 1, text: battleOpener(rng) });
  if (planA.OE <= 3) log.push({ minute: 1, text: conservingLine(nameA) });
  if (planD.OE <= 3) log.push({ minute: 1, text: conservingLine(nameD) });

  // Main Simulation Loop
  for (let ex = 0; ex < MAX_EXCHANGES; ex++) {
    const min = Math.floor(ex / EXCHANGES_PER_MINUTE) + 1;
    const phase = getPhase(ex, MAX_EXCHANGES);
    resCtx.phase = phase;
    resCtx.exchange = ex;

    if (phase !== lastPhase) {
      lastPhase = phase;
      const tacticsA = resolveEffectiveTactics(fA.plan, phase.toLowerCase() as any);
      const tacticsD = resolveEffectiveTactics(fD.plan, phase.toLowerCase() as any);
      log.push({ minute: min, text: `— ${phase.charAt(0) + phase.slice(1).toLowerCase()} Phase —`, phase, offTacticA: tacticsA.offTactic !== "none" ? tacticsA.offTactic : undefined, defTacticA: tacticsA.defTactic !== "none" ? tacticsA.defTactic : undefined, offTacticD: tacticsD.offTactic !== "none" ? tacticsD.offTactic : undefined, defTacticD: tacticsD.defTactic !== "none" ? tacticsD.defTactic : undefined });
    }

    if (min > lastMinuteMarker && min > 1) {
      lastMinuteMarker = min;
      log.push({ minute: min, text: `MINUTE ${min}.` });
      log.push({ minute: min, text: minuteStatusLine(rng, min, nameA, nameD, fA.hitsLanded, fD.hitsLanded) });
    }

    const events = resolveExchange(resCtx, fA, fD);
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
      isFavoriteA: warriorA?.favorites?.weaponId === weaponA,
      isFavoriteD: warriorD?.favorites?.weaponId === weaponD
    };
    const { log: newLines, lastHpRatioA, lastHpRatioD } = narrateEvents(events, narCtx, min);
    log.push(...newLines);
    prevHpRatioA = lastHpRatioA; prevHpRatioD = lastHpRatioD;

    const boutEnd = events.find(e => e.type === "BOUT_END");
    if (boutEnd) {
      winner = boutEnd.actor === "A" ? "A" : "D";
      by = boutEnd.result as any;
      fatalHitLocation = boutEnd.metadata?.location as string;
      fatalExchangeIndex = ex;
      causeBucket = boutEnd.metadata?.cause as DeathCauseBucket;
      const boutEndLines = narrateBoutEnd(rng, by as string, boutEnd.actor === "A" ? nameA : nameD, boutEnd.actor === "A" ? nameD : nameA);
      boutEndLines.forEach(line => log.push({ minute: min, text: line }));
      break;
    }
  }

  if (!winner) {
    const finalOutcome = resolveDecision(fA, fD, nameA, nameD);
    winner = finalOutcome.winner;
    by = finalOutcome.by;
    log.push({ minute: Math.floor(MAX_EXCHANGES / EXCHANGES_PER_MINUTE), text: finalOutcome.narrative });
  }

  const tags = winner ? processOutcomeTags(winner, by, fA, fD) : [];

  return {
    winner, by, minutes: Math.max(1, log[log.length - 1]?.minute ?? 1), log,
    post: { xpA: winner === "A" ? 2 : 1, xpD: winner === "D" ? 2 : 1, hitsA: fA.hitsLanded, hitsD: fD.hitsLanded, gotKillA: winner === "A" && by === "Kill", gotKillD: winner === "D" && by === "Kill", tags, causeBucket, fatalHitLocation, fatalExchangeIndex },
  };
}
