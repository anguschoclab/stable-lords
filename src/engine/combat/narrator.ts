/**
 * Combat Narrator — Consumer of CombatEvents that produces MinuteEvent[] log.
 * Translates pure math results into the flavor text defined in the Design Bible.
 */
import {
  type CombatEvent,
  type MinuteEvent,
  type FightingStyle,
} from "@/types/game";
import {
  narrateAttack, narrateParry, narrateDodge, narrateCounterstrike,
  narrateHit, damageSeverityLine, stateChangeLine,
  fatigueLine, crowdReaction, narrateInitiative,
  tauntLine, narrateInsightHint, narratePassive,
  narrateBoutEnd
} from "../narrativePBP";
import { getWeaponDisplayName } from "../narrative/narrativeUtils";

export interface NarrationContext {
  rng: () => number;
  nameA: string;
  nameD: string;
  weaponA?: string;
  weaponD?: string;
  styleA: FightingStyle;
  styleD: FightingStyle;
  maxHpA: number;
  maxHpD: number;
  prevHpRatioA: number;
  prevHpRatioD: number;
  fameA: number;
  fameD: number;
  isFavoriteA: boolean;
  isFavoriteD: boolean;
}

export function narrateEvents(
  events: CombatEvent[],
  ctx: NarrationContext,
  minute: number
): { log: MinuteEvent[]; lastHpRatioA: number; lastHpRatioD: number } {
  const { rng, nameA, nameD, weaponA, weaponD } = ctx;
  const log: MinuteEvent[] = [];
  
  let currentHpRatioA = ctx.prevHpRatioA;
  let currentHpRatioD = ctx.prevHpRatioD;

  const getName = (actor: "A" | "D") => actor === "A" ? nameA : nameD;
  const getOpponentName = (actor: "A" | "D") => actor === "A" ? nameD : nameA;
  const getWeapon = (actor: "A" | "D") => actor === "A" ? weaponA : weaponD;
  const getMaxHp = (actor: "A" | "D") => actor === "A" ? ctx.maxHpA : ctx.maxHpD;
  const getFame = (actor: "A" | "D") => actor === "A" ? ctx.fameA : ctx.fameD;
  const getIsFavorite = (actor: "A" | "D") => actor === "A" ? ctx.isFavoriteA : ctx.isFavoriteD;
  const getHpRatio = (actor: "A" | "D") => actor === "A" ? currentHpRatioA : currentHpRatioD;
  const setHpRatio = (actor: "A" | "D", ratio: number) => {
    if (actor === "A") currentHpRatioA = ratio;
    else currentHpRatioD = ratio;
  };

  for (const event of events) {
    const actorName = getName(event.actor);
    const opponentName = getOpponentName(event.actor);
    const weapon = getWeapon(event.actor);

    switch (event.type) {
      case "INITIATIVE":
        if (rng() < 0.3) {
          log.push({ minute, text: narrateInitiative(rng, actorName, rng() < 0.3) });
        }
        break;

      case "ATTACK":
        if (event.result === "WHIFF") {
          log.push({ minute, text: narrateAttack(rng, actorName, weapon) });
          log.push({ minute, text: narrateDodge(rng, opponentName) });
        }
        break;

      case "DEFENSE":
        if (event.result === "PARRY") {
          log.push({ minute, text: narrateAttack(rng, getOpponentName(event.actor), getWeapon(event.actor === "A" ? "D" : "A")) });
          log.push({ minute, text: narrateParry(rng, actorName, weapon) });
        } else if (event.result === "DODGE") {
          log.push({ minute, text: narrateDodge(rng, actorName) });
        } else if (event.result === "RIPOSTE") {
          log.push({ minute, text: narrateCounterstrike(rng, actorName) });
        }
        break;

      case "HIT":
        if (event.location) {
          const isMastery = !!event.metadata?.isMastery;
          const isSuperFlashy = isMastery && (!!event.metadata?.crit || (event.value && event.value > 5) || events.some(e => e.type === "BOUT_END"));

          // If it's a normal attack (not following a PARRY or COUNTERSTRIKE event immediately), 
          // we might need to narrate the attack first if it wasn't already.
          // For simplicity in this decoupled version, we assume the resolution emits 
          // a sequence: [ATTACK(whiff)] or [DEFENSE(parry/dodge)] or [HIT]
          
          // Only narrate attack if it's the start of a sequence or a riposte
          // Actually, let's keep it consistent with simulate.ts:
          // Riposte: counterstrike + attack + hit
          // Normal: attack + hit
          
          if (events.some(e => e.type === "DEFENSE" && e.result === "RIPOSTE" && e.actor === event.actor)) {
             log.push({ minute, text: narrateAttack(rng, actorName, weapon, isMastery) });
          } else if (!events.some(e => e.type === "DEFENSE" && e.actor === event.target)) {
             log.push({ minute, text: narrateAttack(rng, actorName, weapon, isMastery) });
          }

          const isFatal = !!event.metadata?.lethal;

          log.push({ 
            minute, 
            text: narrateHit(
              rng, 
              opponentName, 
              event.location, 
              isMastery, 
              isSuperFlashy, 
              actorName, 
              weapon, 
              event.value, 
              getMaxHp(event.target as "A" | "D"), 
              isFatal,
              getFame(event.actor as "A" | "D"),
              getIsFavorite(event.actor as "A" | "D")
            ) 
          });
          
          if (event.metadata?.crit) {
            log.push({ minute, text: `💥 CRITICAL HIT! ${actorName} finds a vital weakness!` });
          }

          if (event.value) {
            const sevLine = damageSeverityLine(rng, event.value, getMaxHp(event.target as "A" | "D"));
            if (sevLine) log.push({ minute, text: sevLine });
            
            // HP Ratio update and state change narration
            const newHpRatio = getHpRatio(event.target as "A" | "D") - (event.value / getMaxHp(event.target as "A" | "D"));
            const sLine = stateChangeLine(rng, opponentName, newHpRatio, getHpRatio(event.target as "A" | "D"));
            if (sLine) log.push({ minute, text: sLine });
            setHpRatio(event.target as "A" | "D", newHpRatio);

            // Crowd reaction
            const crowd = crowdReaction(rng, opponentName, actorName, newHpRatio);
            if (crowd) log.push({ minute, text: crowd });
          }
        }
        break;

      case "FATIGUE":
        if (event.value !== undefined) {
          const fLine = fatigueLine(rng, actorName, event.value);
          if (fLine) log.push({ minute, text: fLine });
        }
        break;

      case "PASSIVE":
        if (event.result) {
          log.push({ minute, text: narratePassive(rng, event.actor === "A" ? ctx.styleA : ctx.styleD, actorName) });
        }
        break;

      case "INSIGHT": {
        const attribute = (event.metadata?.attribute as string) || "ST";
        const hint = narrateInsightHint(rng, attribute);
        if (hint) log.push({ minute, text: `🔍 ${hint}` });
        break;
      }

      case "BOUT_END": {
        const resultType = event.result as string;
        const winnerName = actorName;
        const loserName = opponentName;
        const weaponId = getWeapon(event.actor);
        
        const lines = narrateBoutEnd(rng, resultType, winnerName, loserName, weaponId);
        lines.forEach(text => log.push({ minute, text }));
        break;
      }
    }
  }

  return { log, lastHpRatioA: currentHpRatioA, lastHpRatioD: currentHpRatioD };
}
