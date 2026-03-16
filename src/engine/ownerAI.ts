/**
 * Owner AI — Personality-driven decision-making, roster management,
 * owner rivalries, narrative events, and philosophy evolution.
 *
 * Consumes: Owner personalities, stable philosophies, match results, meta drift.
 * Produces: Plan adjustments, gazette events, roster changes, rivalry updates.
 */
import type {
  GameState, Warrior, RivalStableData, FightPlan, Owner,
  OwnerPersonality, Season, NewsletterItem, MetaAdaptation,
} from "@/types/game";
import { FightingStyle } from "@/types/game";
import { defaultPlanForWarrior } from "./simulate";
import { computeWarriorStats } from "./skillCalc";
import { computeMetaDrift, type StyleMeta } from "./metaDrift";

// ─── 1) Personality-Driven Plan Adjustments ───────────────────────────────

/** Personality modifiers applied on top of style defaults */
const PERSONALITY_PLAN_MODS: Record<OwnerPersonality, Partial<FightPlan>> = {
  Aggressive:  { OE: 2, AL: 1, killDesire: 3 },
  Methodical:  { OE: -1, AL: 0, killDesire: -1 },
  Showman:     { OE: 1, AL: 2, killDesire: 1 },
  Pragmatic:   { OE: 0, AL: 0, killDesire: 0 },
  Tactician:   { OE: -1, AL: 1, killDesire: -2 },
};
import { processAIRosterManagement } from "./ownerRoster";
import { generateOwnerNarratives } from "./ownerNarrative";
import { evolvePhilosophies } from "./ownerPhilosophy";

/** Philosophy modifiers — layered on top of personality */
const PHILOSOPHY_PLAN_MODS: Record<string, Partial<FightPlan>> = {
  "Brute Force":    { OE: 2, AL: -1, killDesire: 2 },
  "Speed Kills":    { OE: 1, AL: 3, killDesire: 1 },
  "Iron Defense":   { OE: -2, AL: -1, killDesire: -2 },
  "Balanced":       { OE: 0, AL: 0, killDesire: 0 },
  "Spectacle":      { OE: 1, AL: 2, killDesire: 2 },
  "Cunning":        { OE: -1, AL: 1, killDesire: -1 },
  "Endurance":      { OE: -1, AL: -2, killDesire: -1 },
  "Specialist":     { OE: 0, AL: 1, killDesire: 1 },
};

/** Flavor quotes for recruitment based on meta adaptation */
const META_RECRUIT_QUOTES: Record<MetaAdaptation, string> = {
  MetaChaser: "\"Everyone's using this style — so will we!\"",
  Traditionalist: "\"We train them our way, always.\"",
  Opportunist: "\"The right warrior for the right moment.\"",
  Innovator: "\"They won't see this coming.\"",
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics from the Fighting Styles Compendium.
 */
/**
 * Top-level planning logic for an AI manager generating a fight plan for a warrior.
 * Analyzes the warrior's current state, their opponent, and the manager's philosophy.
 *
 * @param w - The AI manager's warrior.
 * @param ownerPhil - The underlying strategic philosophy governing AI behavior.
 * @param enemy - The opponent warrior being analyzed to adapt the fight plan.
 * @returns A comprehensive `FightPlan` object tailored by the AI.
 */
export function aiPlanForWarrior(
  w: Warrior,
  personality: OwnerPersonality,
  philosophy: string,
  metaContext?: { meta: StyleMeta; adaptation: MetaAdaptation },
  opponentStyle?: FightingStyle
): FightPlan {
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};

  let metaOE = 0;
  let metaAL = 0;
  let metaKD = 0;

  if (metaContext && w.style) {
    const drift = metaContext.meta[w.style as FightingStyle] ?? 0;

    switch (metaContext.adaptation) {
      case "MetaChaser":
        metaOE = drift > 3 ? 2 : drift < -3 ? -2 : 0;
        metaAL = drift > 3 ? 1 : drift < -3 ? -1 : 0;
        metaKD = drift > 3 ? 1 : 0;
        break;
      case "Innovator":
        metaOE = drift < -2 ? 2 : drift > 3 ? -1 : 0;
        metaAL = drift < -2 ? 1 : drift > 3 ? -1 : 0;
        metaKD = drift < -3 ? 1 : 0;
        break;
    }
  }

  // ── Per-style matchup heuristics (from Fighting Styles Compendium) ──
  const matchup = opponentStyle ? getStyleMatchupMods(w.style, opponentStyle) : { oe: 0, al: 0, kd: 0 };

  return {
    ...base,
    OE: clamp((base.OE ?? 5) + (pMod.OE ?? 0) + (phMod.OE ?? 0) + metaOE + matchup.oe, 1, 10),
    AL: clamp((base.AL ?? 5) + (pMod.AL ?? 0) + (phMod.AL ?? 0) + metaAL + matchup.al, 1, 10),
    killDesire: clamp((base.killDesire ?? 5) + (pMod.killDesire ?? 0) + (phMod.killDesire ?? 0) + metaKD + matchup.kd, 1, 10),
  };
}

/**
 * Per-style matchup heuristics from the Fighting Styles Compendium.
 * Returns OE/AL/KD adjustments when facing a specific opponent style.
 */
function getStyleMatchupMods(
  myStyle: FightingStyle,
  oppStyle: FightingStyle
): { oe: number; al: number; kd: number } {
  switch (myStyle) {
    case FightingStyle.AimedBlow:
      // AB vs predictable heavy-commit (BA, SL): wait for openings, don't inflate OE
      if (oppStyle === FightingStyle.BashingAttack || oppStyle === FightingStyle.SlashingAttack)
        return { oe: -1, al: 0, kd: 0 };
      // AB vs deep defense (TP, PR): openings are scarce, raise OE slightly
      if (oppStyle === FightingStyle.TotalParry || oppStyle === FightingStyle.ParryRiposte)
        return { oe: 1, al: 1, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.BashingAttack:
      // BA vs LU/WS: force engagement early before being kited
      if (oppStyle === FightingStyle.LungingAttack || oppStyle === FightingStyle.WallOfSteel)
        return { oe: 2, al: 1, kd: 1 };
      // BA vs TP: add Decisiveness in mid rounds, don't spam
      if (oppStyle === FightingStyle.TotalParry)
        return { oe: 1, al: 0, kd: 1 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.LungingAttack:
      // LU vs BA: kite and pick angles — classic advantage
      if (oppStyle === FightingStyle.BashingAttack)
        return { oe: -1, al: 2, kd: 0 };
      // LU vs TP/PR: avoid wasteful OE, use AL to deny tempo
      if (oppStyle === FightingStyle.TotalParry || oppStyle === FightingStyle.ParryRiposte)
        return { oe: -2, al: 1, kd: -1 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.ParryLunge:
      // PL vs SL: prefer defensive posture, then punish whiffs
      if (oppStyle === FightingStyle.SlashingAttack)
        return { oe: -1, al: 0, kd: 0 };
      // PL vs BA: stay mobile enough to avoid being pinned
      if (oppStyle === FightingStyle.BashingAttack)
        return { oe: 0, al: 1, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.ParryRiposte:
      // PR vs BA/SL (high error): lean into counter identity — LOW OE
      if (oppStyle === FightingStyle.BashingAttack || oppStyle === FightingStyle.SlashingAttack)
        return { oe: -2, al: 0, kd: 0 };
      // PR vs TP (few openings): raise OE slightly but keep counter core
      if (oppStyle === FightingStyle.TotalParry)
        return { oe: 1, al: 0, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.ParryStrike:
      // PS vs SL: capitalize on reduced parry — happy matchup
      if (oppStyle === FightingStyle.SlashingAttack)
        return { oe: 1, al: 0, kd: 1 };
      // PS vs LU: keep OE disciplined, don't chase
      if (oppStyle === FightingStyle.LungingAttack)
        return { oe: -1, al: 0, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.StrikingAttack:
      // ST vs BA: avoid mirror brawl if lighter, reposition
      if (oppStyle === FightingStyle.BashingAttack)
        return { oe: 0, al: 1, kd: 0 };
      // ST vs WS: don't let it become a stamina race
      if (oppStyle === FightingStyle.WallOfSteel)
        return { oe: 2, al: 0, kd: 1 };
      // ST vs TP/PR: Decisiveness spikes later, not early waste
      if (oppStyle === FightingStyle.TotalParry || oppStyle === FightingStyle.ParryRiposte)
        return { oe: -1, al: 0, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.SlashingAttack:
      // SL vs TP/PR: must create openings — controlled OE ramps
      if (oppStyle === FightingStyle.TotalParry || oppStyle === FightingStyle.ParryRiposte)
        return { oe: 1, al: 0, kd: 0 };
      // SL vs PS: expect stronger defense, KD spikes after wound
      if (oppStyle === FightingStyle.ParryStrike)
        return { oe: 0, al: 0, kd: 1 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.TotalParry:
      // TP vs LU/WS: let them burn out, do not chase
      if (oppStyle === FightingStyle.LungingAttack || oppStyle === FightingStyle.WallOfSteel)
        return { oe: -2, al: -1, kd: -1 };
      // TP vs AB: avoid giving openings, keep posture compact
      if (oppStyle === FightingStyle.AimedBlow)
        return { oe: -1, al: 0, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    case FightingStyle.WallOfSteel:
      // WS vs ST: zone them out, punish entries
      if (oppStyle === FightingStyle.StrikingAttack)
        return { oe: 0, al: 1, kd: 0 };
      // WS vs SL: manage endurance carefully — fatigue windows
      if (oppStyle === FightingStyle.SlashingAttack)
        return { oe: -1, al: 0, kd: 0 };
      return { oe: 0, al: 0, kd: 0 };

    default:
      return { oe: 0, al: 0, kd: 0 };
  }
}

// ─── 2) Owner-to-Owner Rivalries (Personality-Driven) ─────────────────────

export interface OwnerGrudge {
  ownerIdA: string;
  ownerIdB: string;
  intensity: number; // 1-5
  reason: string;
  startWeek: number;
  lastEscalation: number;
}

/** Personality compatibility — some owners naturally clash */
const PERSONALITY_CLASH: Record<OwnerPersonality, OwnerPersonality[]> = {
  Aggressive:  ["Methodical", "Tactician"],
  Methodical:  ["Aggressive", "Showman"],
  Showman:     ["Methodical", "Pragmatic"],
  Pragmatic:   ["Showman"],
  Tactician:   ["Aggressive"],
};

/**
 * Detect and escalate owner-to-owner grudges based on personality clashes
 * and recent kill/loss history between stables.
 */
/**
 * Updates and processes rivalries and grudges for AI owners based on recent outcomes.
 * AI managers track wins and losses and develop grudges against specific factions.
 *
 * @param weekId - The current week ID of the simulation.
 * @param recentBouts - A list of bout outcomes to analyze for new grudges.
 * @param factions - The global state object containing all factions and their data.
 */
export function processOwnerGrudges(
  state: GameState,
  existingGrudges: OwnerGrudge[]
): { grudges: OwnerGrudge[]; gazetteItems: string[] } {
  const grudges = existingGrudges.map(g => ({ ...g }));
  const gazetteItems: string[] = [];
  const rivals = state.rivals || [];

  // Check for personality clashes between stables that have recently fought
  const recentFights = state.arenaHistory.filter(f => f.week >= state.week - 13);

  for (let i = 0; i < rivals.length; i++) {
    for (let j = i + 1; j < rivals.length; j++) {
      const rA = rivals[i];
      const rB = rivals[j];
      const persA = rA.owner.personality;
      const persB = rB.owner.personality;
      if (!persA || !persB) continue;

      // Check if personalities naturally clash
      const clash = PERSONALITY_CLASH[persA]?.includes(persB) || PERSONALITY_CLASH[persB]?.includes(persA);
      if (!clash) continue;

      // Check if they've had kills against each other recently
      const aNamesSet = new Set(rA.roster.map(w => w.name));
      const bNamesSet = new Set(rB.roster.map(w => w.name));

      const crossFights = recentFights.filter(f =>
        (aNamesSet.has(f.a) && bNamesSet.has(f.d)) ||
        (bNamesSet.has(f.a) && aNamesSet.has(f.d))
      );

      if (crossFights.length === 0) continue;

      const hasKill = crossFights.some(f => f.by === "Kill");
      const existing = grudges.find(g =>
        (g.ownerIdA === rA.owner.id && g.ownerIdB === rB.owner.id) ||
        (g.ownerIdB === rA.owner.id && g.ownerIdA === rB.owner.id)
      );

      if (existing) {
        if (hasKill && existing.lastEscalation < state.week - 4) {
          existing.intensity = Math.min(5, existing.intensity + 1);
          existing.lastEscalation = state.week;
          existing.reason = `Blood spilled between ${rA.owner.stableName} and ${rB.owner.stableName}`;
          gazetteItems.push(
            `🔥 GRUDGE DEEPENS: ${rA.owner.name} (${persA}) and ${rB.owner.name} (${persB}) — their feud intensifies after another kill!`
          );
        }
      } else if (hasKill) {
        grudges.push({
          ownerIdA: rA.owner.id,
          ownerIdB: rB.owner.id,
          intensity: 2,
          reason: `Personality clash: ${persA} vs ${persB} — ignited by bloodshed`,
          startWeek: state.week,
          lastEscalation: state.week,
        });
        gazetteItems.push(
          `⚔️ NEW RIVALRY: ${rA.owner.name} the ${persA} and ${rB.owner.name} the ${persB} have declared a blood feud!`
        );
      }
    }
  }

  // Decay old grudges
  for (const g of grudges) {
    if (state.week - g.lastEscalation > 26 && g.intensity > 1) {
      g.intensity = Math.max(1, g.intensity - 1);
    }
  }

  // Remove dead grudges
  const activeGrudges = grudges.filter(g => g.intensity > 0);

  return { grudges: activeGrudges, gazetteItems };
}

// ─── 3) AI Roster Management ──────────────────────────────────────────────

/**
 * AI stables recruit, retire, and adapt their rosters each week.
 * - Aggressive owners recruit more frequently
 * - Methodical owners retire underperformers
 * - Pragmatic owners maintain optimal roster size
 */
/**
 * Manages the roster of AI owners by evaluating current warriors, recruiting new talent,
 * and releasing underperforming assets based on current owner philosophy and budget.
 *
 * @param globalState - The mutable global application state containing game rules and all factions.
 * @param randomSeed - A deterministic random seed for generation and selection logic.
 * @returns An array of narrative events related to roster management.
 */
export function computeOwnerScore(o: Owner): number {
  return o.fame * 1.25 + o.renown * 1.0 + o.titles * 10;
}

export function rankOwners(owners: Owner[]): OwnerScore[] {
  const scored = owners.map((o) => ({ id: o.id, score: computeOwnerScore(o) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}
