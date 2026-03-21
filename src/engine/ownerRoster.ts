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
const META_RECRUIT_QUOTES: Record<MetaAdaptation, string> = {
  MetaChaser: "\"If it wins, we buy it.\"",
  Traditionalist: "\"We rely on what we know.\"",
  Opportunist: "\"There is room in the market for a new face.\"",
  Innovator: "\"They will never see this coming.\""
};

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
        const playerMeta = computeMetaDrift(state.arenaHistory.filter(f => f.a === state.player.id || f.d === state.player.id), 10);
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