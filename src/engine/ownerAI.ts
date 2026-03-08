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
 * Generate a personality- and philosophy-aware fight plan for an AI warrior.
 * Replaces raw `defaultPlanForWarrior` for rival bouts.
 */
export function aiPlanForWarrior(
  w: Warrior,
  personality: OwnerPersonality,
  philosophy: string
): FightPlan {
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};

  return {
    ...base,
    OE: clamp((base.OE ?? 5) + (pMod.OE ?? 0) + (phMod.OE ?? 0), 1, 10),
    AL: clamp((base.AL ?? 5) + (pMod.AL ?? 0) + (phMod.AL ?? 0), 1, 10),
    killDesire: clamp((base.killDesire ?? 5) + (pMod.killDesire ?? 0) + (phMod.killDesire ?? 0), 1, 10),
  };
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
      const newWarrior = generateAIRecruit(r, state.week, meta);
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
    id: `ai_recruit_${rival.owner.id}_${week}_${Math.floor(Math.random() * 1e6)}`,
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
export function generateOwnerNarratives(
  state: GameState,
  newSeason: Season
): string[] {
  if (newSeason === state.season) return [];

  const gazetteItems: string[] = [];
  const recentFights = state.arenaHistory.filter(f => f.week >= state.week - 13);
  const rivals = state.rivals || [];

  for (const rival of rivals) {
    const personality = rival.owner.personality ?? "Pragmatic";
    const names = new Set(rival.roster.map(w => w.name));

    const wins = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
    ).length;
    const losses = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
    ).length;
    const kills = recentFights.filter(f =>
      f.by === "Kill" && (
        (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
      )
    ).length;
    const deaths = recentFights.filter(f =>
      f.by === "Kill" && (
        (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
      )
    ).length;

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
export function evolvePhilosophies(
  state: GameState,
  newSeason: Season
): { updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  if (newSeason === state.season) return { updatedRivals: state.rivals || [], gazetteItems: [] };

  const gazetteItems: string[] = [];
  const recentFights = state.arenaHistory.filter(f => f.week >= state.week - 13);
  const meta = computeMetaDrift(state.arenaHistory, 20);

  const updatedRivals = (state.rivals || []).map(rival => {
    const adaptation = rival.owner.metaAdaptation ?? "Opportunist";

    // Traditionalists NEVER change philosophy
    if (adaptation === "Traditionalist") return rival;

    const names = new Set(rival.roster.map(w => w.name));
    const wins = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "A") || (names.has(f.d) && f.winner === "D")
    ).length;
    const losses = recentFights.filter(f =>
      (names.has(f.a) && f.winner === "D") || (names.has(f.d) && f.winner === "A")
    ).length;

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
