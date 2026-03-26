import { getRecentFightsForWarrior } from "@/engine/core/historyUtils";
import { getRecentFights } from "@/engine/core/historyUtils";
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
// Re-imports removed — these functions are defined in this file below.

/** Philosophy modifiers — layered on top of personality */
function calculateRecentRecord(recentFights: import("@/types/game").FightSummary[], rosterNames: Set<string>) {
  const wins = recentFights.filter(f =>
    (rosterNames.has(f.a) && f.winner === "A") || (rosterNames.has(f.d) && f.winner === "D")
  ).length;
  const losses = recentFights.filter(f =>
    (rosterNames.has(f.a) && f.winner === "D") || (rosterNames.has(f.d) && f.winner === "A")
  ).length;
  const kills = recentFights.filter(f =>
    f.by === "Kill" && (
      (rosterNames.has(f.a) && f.winner === "A") || (rosterNames.has(f.d) && f.winner === "D")
    )
  ).length;
  const deaths = recentFights.filter(f =>
    f.by === "Kill" && (
      (rosterNames.has(f.a) && f.winner === "D") || (rosterNames.has(f.d) && f.winner === "A")
    )
  ).length;
  return { wins, losses, kills, deaths };
}

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
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);

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
export function processAIRosterManagement(
  state: GameState
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const meta = computeMetaDrift(state.arenaHistory, 20);
  const gazetteItems: string[] = [];
  const updatedRivals = (state.rivals || []).map(rival => {
    const r = {
      ...rival,
      roster: rival.roster.map(w => ({ ...w, career: { ...w.career } })),
      owner: { ...rival.owner },
    };

    const personality = r.owner.personality ?? "Pragmatic";
    const activeCount = r.roster.filter(w => w.status === "Active").length;

    // ── Retirement Logic ──
    // Methodical/Tactician owners cull underperformers
    if (personality === "Methodical" || personality === "Tactician") {
      const candidates = r.roster.filter(w =>
        w.status === "Active" &&
        w.career.wins + w.career.losses >= 5 &&
        w.career.wins / Math.max(1, w.career.wins + w.career.losses) < 0.3 &&
        (w.age ?? 18) >= 25
      );
      for (const c of candidates.slice(0, 1)) {
        c.status = "Retired";
        c.retiredWeek = state.week;
        gazetteItems.push(
          `📋 ${r.owner.name} (${r.owner.stableName}) retires ${c.name} — "Not meeting expectations."`
        );
      }
    }

    // Aggressive owners cull warriors with 0 kills after many fights
    if (personality === "Aggressive") {
      const killless = r.roster.filter(w =>
        w.status === "Active" &&
        w.career.kills === 0 &&
        w.career.wins + w.career.losses >= 8 &&
        (w.age ?? 18) >= 24
      );
      for (const c of killless.slice(0, 1)) {
        c.status = "Retired";
        c.retiredWeek = state.week;
        gazetteItems.push(
          `🗡️ ${r.owner.name} (${r.owner.stableName}) cuts ${c.name} — "No killer instinct."`
        );
      }
    }

    // Age-based retirement for all personalities (age > 30)
    const elderly = r.roster.filter(w => w.status === "Active" && (w.age ?? 18) >= 30);
    for (const old of elderly.slice(0, 1)) {
      if (Math.random() < 0.15) { // 15% chance per week for old warriors
        old.status = "Retired";
        old.retiredWeek = state.week;
        gazetteItems.push(
          `🏠 ${old.name} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`
        );
      }
    }

    // ── Recruitment Logic ──
    const currentActive = r.roster.filter(w => w.status === "Active").length;
    const minRoster = personality === "Aggressive" ? 8 : personality === "Showman" ? 7 : 6;
    const recruitChance = personality === "Aggressive" ? 0.4 : personality === "Pragmatic" ? 0.25 : 0.15;

    if (currentActive < minRoster && Math.random() < recruitChance) {
      const adaptation = r.owner.metaAdaptation ?? "Opportunist";

      let customMeta = meta;
      // Check if this AI stable has a rivalry with the player
      const rivalries = state.rivalries || [];
      const rivalry = rivalries.find(rv =>
        (rv.stableIdA === state.player.id && rv.stableIdB === r.owner.id) ||
        (rv.stableIdB === state.player.id && rv.stableIdA === r.owner.id)
      );

      // If they hate the player, they consider the player's dominant style as the "meta" to counter
      if (rivalry && rivalry.intensity >= 3 && adaptation !== "Traditionalist") {
        const playerMeta = computeMetaDrift(getRecentFightsForWarrior(state.arenaHistory, state.player.id, 10), 10);
        if (Object.keys(playerMeta).length > 0) customMeta = playerMeta;
      }

      const newWarrior = generateAIRecruit(r, state.week, customMeta);
      if (newWarrior) {
        r.roster.push(newWarrior);
        const adaptQuote = META_RECRUIT_QUOTES[adaptation] ?? "\"A new warrior joins.\"";
        gazetteItems.push(
          `📢 ${r.owner.stableName} recruits ${newWarrior.name} (${newWarrior.style}) — ${adaptQuote}`
        );
      }
    }

    // Filter out retired from active roster display
    r.roster = r.roster.filter(w => w.status === "Active");

    return r;
  });

  return { updatedRivals, gazetteItems };
}

/** Generate a new warrior matching the stable's philosophy, favored styles, and meta awareness */
function generateAIRecruit(rival: RivalStableData, week: number, meta?: StyleMeta): Warrior | null {
  const philosophy = rival.philosophy ?? "Balanced";
  const adaptation = rival.owner.metaAdaptation ?? "Opportunist";
  const favoredStyles = rival.owner.favoredStyles ?? [];

  // Pick style based on meta adaptation behavior
  const style = pickRecruitStyle(adaptation, philosophy, favoredStyles, meta);

  const attrs = generateRecruitAttrs(philosophy);
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

  // Generate a name
  const prefixes = ["IRON", "BLOOD", "STORM", "DARK", "SWIFT", "STONE", "FLAME", "FROST", "SHADOW", "STEEL"];
  const suffixes = ["FANG", "BLADE", "HEART", "CLAW", "MANE", "STRIKE", "BORN", "FURY", "WARD", "JAW"];
  const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;

  return {
    id: crypto.randomUUID(),
    name,
    style,
    attributes: attrs,
    baseSkills,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: "Active",
    age: 17 + Math.floor(Math.random() * 5),
    stableId: rival.owner.id,
  };
}

/**
 * Pick a recruit's fighting style based on the owner's meta adaptation type.
 * - MetaChaser: recruits dominant meta styles
 * - Traditionalist: always recruits from favored styles, ignores meta
 * - Opportunist: blends favored styles with meta-rising styles
 * - Innovator: recruits counter-meta styles (styles that beat what's dominant)
 */
function pickRecruitStyle(
  adaptation: MetaAdaptation,
  philosophy: string,
  favoredStyles: FightingStyle[],
  meta?: StyleMeta,
): FightingStyle {
  const philosophyStyles = getPhilosophyStyles(philosophy);
  const allStyles = Object.values(FightingStyle);

  switch (adaptation) {
    case "Traditionalist": {
      // Always pick from favored styles, never deviate
      const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    case "MetaChaser": {
      // Pick from the top-performing styles in the meta
      if (meta) {
        const sorted = allStyles.slice().sort((a, b) => (meta[b] ?? 0) - (meta[a] ?? 0));
        const top = sorted.slice(0, 3);
        return top[Math.floor(Math.random() * top.length)];
      }
      return philosophyStyles[Math.floor(Math.random() * philosophyStyles.length)];
    }
    case "Innovator": {
      // Counter-meta: pick styles that are currently weak (opponents won't expect them)
      // or styles that naturally counter the dominant ones
      if (meta) {
        const sorted = allStyles.slice().sort((a, b) => (meta[a] ?? 0) - (meta[b] ?? 0));
        const underdogs = sorted.slice(0, 4);
        return underdogs[Math.floor(Math.random() * underdogs.length)];
      }
      // Without meta data, innovate from non-philosophy styles
      const nonStandard = allStyles.filter(s => !philosophyStyles.includes(s));
      return nonStandard.length > 0
        ? nonStandard[Math.floor(Math.random() * nonStandard.length)]
        : philosophyStyles[Math.floor(Math.random() * philosophyStyles.length)];
    }
    case "Opportunist":
    default: {
      // 50/50 blend: half the time pick from favored, half from meta-rising
      if (meta && Math.random() < 0.5) {
        const rising = allStyles.filter(s => (meta[s] ?? 0) >= 2);
        if (rising.length > 0) return rising[Math.floor(Math.random() * rising.length)];
      }
      const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
}

function getPhilosophyStyles(philosophy: string): FightingStyle[] {
  const map: Record<string, FightingStyle[]> = {
    "Brute Force": [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    "Speed Kills": [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    "Iron Defense": [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    "Balanced": [FightingStyle.StrikingAttack, FightingStyle.ParryStrike, FightingStyle.SlashingAttack],
    "Spectacle": [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    "Cunning": [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
    "Endurance": [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
    "Specialist": [FightingStyle.AimedBlow, FightingStyle.StrikingAttack, FightingStyle.ParryStrike],
  };
  return map[philosophy] ?? Object.values(FightingStyle);
}

function generateRecruitAttrs(philosophy: string): { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number } {
  const biasMap: Record<string, Partial<Record<string, number>>> = {
    "Brute Force": { ST: 3, CN: 2, SZ: 2 },
    "Speed Kills": { SP: 3, DF: 2, WL: 1 },
    "Iron Defense": { CN: 3, WL: 3, SZ: 1 },
    "Balanced": { ST: 1, CN: 1, WT: 1, WL: 1, SP: 1, DF: 1 },
    "Spectacle": { SP: 2, DF: 2, WL: 2, WT: 1 },
    "Cunning": { WT: 3, DF: 2, SP: 2 },
    "Endurance": { CN: 3, WL: 3 },
    "Specialist": { ST: 2, WT: 2, DF: 2 },
  };
  const bias = biasMap[philosophy] ?? {};
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21;
  const keys: (keyof typeof attrs)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

  const weighted: (keyof typeof attrs)[] = [];
  for (const k of keys) {
    const w = ((bias as any)[k] ?? 1);
    for (let i = 0; i < w; i++) weighted.push(k);
  }

  while (pool > 0) {
    const key = weighted[Math.floor(Math.random() * weighted.length)];
    const max = Math.min(pool, 25 - attrs[key]);
    if (max <= 0) continue;
    const add = Math.min(max, Math.floor(Math.random() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

// ─── 4) Owner Narrative Events ────────────────────────────────────────────

interface NarrativeContext {
  rival: RivalStableData;
  seasonWins: number;
  seasonLosses: number;
  seasonKills: number;
  seasonDeaths: number;
}

/**
 * Generate personality-driven gazette events based on recent performance.
 * Runs once per season change.
 */
/**
 * Generates narrative events reflecting current owner state, grudges, and philosophy shifts.
 * Used for the newspaper/gazette system to add flavor and context to the world simulation.
 *
 * @param globalState - The global application state object.
 * @param seed - Deterministic random seed for text generation.
 * @returns An array of string narratives representing owner activities.
 */
export function generateOwnerNarratives(
  state: GameState,
  newSeason: Season
): string[] {
  if (newSeason === state.season) return [];

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);
  const rivals = state.rivals || [];

  for (const rival of rivals) {
    const personality = rival.owner.personality ?? "Pragmatic";
    const names = new Set(rival.roster.map(w => w.name));

    const { wins, losses, kills, deaths } = calculateRecentRecord(recentFights, names);

    const totalFights = wins + losses;
    if (totalFights === 0) continue;
    const winRate = wins / totalFights;

    // ── Personality-specific reactions ──

    // Aggressive owner losing badly
    if (personality === "Aggressive" && winRate < 0.35 && totalFights >= 4) {
      const templates = [
        `😤 ${rival.owner.name} (${rival.owner.stableName}) rages: "Heads will roll if results don't improve!"`,
        `🔥 ${rival.owner.name} fires ${rival.owner.stableName}'s head trainer after a dismal ${state.season}!`,
        `⚔️ ${rival.owner.name} declares: "Next season, we fight with fury or not at all!"`,
      ];
      gazetteItems.push(templates[Math.floor(Math.random() * templates.length)]);
    }

    // Methodical owner on a winning streak
    if (personality === "Methodical" && winRate >= 0.7 && totalFights >= 4) {
      gazetteItems.push(
        `📊 ${rival.owner.name} (${rival.owner.stableName}): "Our preparation is paying dividends — ${wins}W/${losses}L this ${state.season}."`
      );
    }

    // Showman with lots of kills
    if (personality === "Showman" && kills >= 2) {
      gazetteItems.push(
        `🎭 ${rival.owner.name} (${rival.owner.stableName}) boasts: "${kills} kills this ${state.season}! The crowd demands blood, and we deliver!"`
      );
    }

    // Pragmatic owner suffering deaths
    if (personality === "Pragmatic" && deaths >= 2) {
      gazetteItems.push(
        `💀 ${rival.owner.name} (${rival.owner.stableName}) grimly assesses: "${deaths} warriors lost this ${state.season}. Costs are unsustainable."`
      );
    }

    // Tactician dominating
    if (personality === "Tactician" && winRate >= 0.65 && kills === 0 && totalFights >= 3) {
      gazetteItems.push(
        `🧠 ${rival.owner.name} (${rival.owner.stableName}): "Clean victories, no unnecessary bloodshed — ${wins}W/${losses}L. Strategy prevails."`
      );
    }

    // Any owner with a dominant season
    if (winRate >= 0.8 && totalFights >= 5) {
      gazetteItems.push(
        `🏆 ${rival.owner.stableName} dominated ${state.season} with a record of ${wins}-${losses}!`
      );
    }

    // Any owner with devastating losses
    if (deaths >= 3) {
      gazetteItems.push(
        `⚰️ A grim ${state.season} for ${rival.owner.stableName} — ${deaths} warriors fell in the arena.`
      );
    }
  }

  // Add Blood Feud public taunts for player rivalry
  for (const rival of rivals) {
    const rivalries = state.rivalries || [];
    const rivalry = rivalries.find(rv =>
      (rv.stableIdA === state.player.id && rv.stableIdB === rival.owner.id) ||
      (rv.stableIdB === state.player.id && rv.stableIdA === rival.owner.id)
    );

    if (rivalry && rivalry.intensity >= 4 && Math.random() < 0.25) { // 25% chance per season to taunt the player if feud
        const tauntTemplates = [
            `🗣️ "${state.player.stableName} is a disgrace to the sands. I will see them bleed," vows ${rival.owner.name} (${rival.owner.stableName}).`,
            `🗣️ ${rival.owner.name} (${rival.owner.stableName}) issues a public challenge: "My warriors will hunt down the dogs of ${state.player.stableName}."`,
            `🗣️ "The feud with ${state.player.stableName} ends when their stable is ash," declares ${rival.owner.name}.`,
            `🗣️ Public Grudge: ${rival.owner.name} (${rival.owner.stableName}) was heard mocking the recent performances of ${state.player.stableName}.`
        ];

        // Pick a random taunt
        const taunt = tauntTemplates[Math.floor(Math.random() * tauntTemplates.length)];
        gazetteItems.push(taunt);
    }
  }

  return gazetteItems;
}

// ─── 5) Philosophy Evolution ──────────────────────────────────────────────

const PHILOSOPHY_DRIFT: Record<string, string[]> = {
  "Brute Force":  ["Spectacle", "Balanced"],
  "Speed Kills":  ["Cunning", "Spectacle"],
  "Iron Defense": ["Endurance", "Balanced"],
  "Balanced":     ["Cunning", "Iron Defense", "Brute Force"],
  "Spectacle":    ["Speed Kills", "Brute Force"],
  "Cunning":      ["Iron Defense", "Speed Kills"],
  "Endurance":    ["Iron Defense", "Balanced"],
  "Specialist":   ["Cunning", "Balanced"],
};

/**
 * Evolve stable philosophies based on season results.
 * Losing stables adapt; winning stables double down.
 * Runs on season change.
 */
/**
 * Iterates over AI factions and slightly evolves their underlying philosophies over time.
 * Models long-term shifting strategies and trends in the AI manager pool.
 *
 * @param globalState - The global application state object.
 * @param randomSeed - Deterministic random seed used for generating philosophical drift.
 */
export function evolvePhilosophies(
  state: GameState,
  newSeason: Season
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  if (newSeason === state.season) return { updatedRivals: state.rivals || [], gazetteItems: [] };

  const gazetteItems: string[] = [];
  const recentFights = getRecentFights(state.arenaHistory, state.week - 13);
  const meta = computeMetaDrift(state.arenaHistory, 20);

  const updatedRivals = (state.rivals || []).map(rival => {
    const adaptation = rival.owner.metaAdaptation ?? "Opportunist";

    // Traditionalists NEVER change philosophy
    if (adaptation === "Traditionalist") return rival;

    const names = new Set(rival.roster.map(w => w.name));
    const { wins, losses } = calculateRecentRecord(recentFights, names);

    const totalFights = wins + losses;
    if (totalFights < 4) return rival;

    const winRate = wins / totalFights;
    const currentPhilosophy = rival.philosophy ?? "Balanced";
    const driftOptions = PHILOSOPHY_DRIFT[currentPhilosophy] ?? ["Balanced"];

    // Drift thresholds vary by adaptation type
    const driftThreshold = adaptation === "MetaChaser" ? 0.45 : adaptation === "Innovator" ? 0.40 : 0.35;
    const driftChance = adaptation === "MetaChaser" ? 0.5 : adaptation === "Innovator" ? 0.35 : 0.3;

    if (winRate < driftThreshold && Math.random() < driftChance) {
      let newPhilosophy: string;

      if (adaptation === "MetaChaser") {
        // Chase whatever philosophy aligns with the dominant meta style
        newPhilosophy = pickMetaAlignedPhilosophy(meta) ?? driftOptions[Math.floor(Math.random() * driftOptions.length)];
      } else if (adaptation === "Innovator") {
        // Pick a philosophy that counters the meta
        newPhilosophy = pickCounterMetaPhilosophy(meta) ?? driftOptions[Math.floor(Math.random() * driftOptions.length)];
      } else {
        newPhilosophy = driftOptions[Math.floor(Math.random() * driftOptions.length)];
      }

      const adaptLabel = adaptation === "MetaChaser" ? "chasing the meta" : adaptation === "Innovator" ? "innovating against the meta" : "seeking a new path";
      gazetteItems.push(
        `🔄 ${rival.owner.stableName} shifts from ${currentPhilosophy} to ${newPhilosophy} — ${rival.owner.name} is ${adaptLabel} after a losing ${state.season}.`
      );
      return { ...rival, philosophy: newPhilosophy };
    }

    return rival;
  });

  return { updatedRivals, gazetteItems };
}

/** Find the philosophy that best aligns with the current dominant meta styles */
function pickMetaAlignedPhilosophy(meta: StyleMeta): string | null {
  const philosophyStyleMap: Record<string, FightingStyle[]> = {
    "Brute Force": [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    "Speed Kills": [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    "Iron Defense": [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    "Spectacle": [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    "Cunning": [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
    "Endurance": [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
  };

  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [phil, styles] of Object.entries(philosophyStyleMap)) {
    const score = styles.reduce((sum, s) => sum + (meta[s] ?? 0), 0);
    if (score > bestScore) { bestScore = score; best = phil; }
  }
  return bestScore > 0 ? best : null;
}

/** Find a philosophy that counters the current meta (styles that are declining = opponents not prepared) */
function pickCounterMetaPhilosophy(meta: StyleMeta): string | null {
  const philosophyStyleMap: Record<string, FightingStyle[]> = {
    "Brute Force": [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    "Speed Kills": [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    "Iron Defense": [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    "Spectacle": [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    "Cunning": [FightingStyle.ParryRiposte, FightingStyle.AimedBlow, FightingStyle.ParryLunge],
    "Endurance": [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
  };

  // Pick the philosophy whose styles are least popular (counter-pick)
  let best: string | null = null;
  let bestScore = Infinity;
  for (const [phil, styles] of Object.entries(philosophyStyleMap)) {
    const score = styles.reduce((sum, s) => sum + (meta[s] ?? 0), 0);
    if (score < bestScore) { bestScore = score; best = phil; }
  }
  return best;
}

// ─── Owner Scoring & Ranking ──────────────────────────────────────────────
// (Migrated from src/modules/owners.ts)

export type OwnerScore = {
  id: string;
  score: number;
  rank: number;
};

export function computeOwnerScore(o: Owner): number {
  return o.fame * 1.25 + o.renown * 1.0 + o.titles * 10;
}

export function rankOwners(owners: Owner[]): OwnerScore[] {
  const scored = owners.map((o) => ({ id: o.id, score: computeOwnerScore(o) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}
