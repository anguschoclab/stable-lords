import type { GameState, Warrior, RivalStableData, OwnerPersonality, MetaAdaptation } from "@/types/game";
import { FightingStyle } from "@/types/game";
import { computeMetaDrift, type StyleMeta } from "./metaDrift";
import { computeWarriorStats } from "./skillCalc";
import { getRecentFightsForWarrior } from "@/engine/core/historyUtils";
import { META_RECRUIT_QUOTES, getPhilosophyStyles } from "@/data/ownerData";

/**
 * Manages the roster of AI owners by evaluating current warriors, recruiting talent,
 * and releasing underperforming assets based on current owner personality and budget.
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

    // 1) Retirement / Culling Logic
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
        gazetteItems.push(`📋 ${r.owner.name} (${r.owner.stableName}) retires ${c.name} — "Not meeting expectations."`);
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
        gazetteItems.push(`🗡️ ${r.owner.name} (${r.owner.stableName}) cuts ${c.name} — "No killer instinct."`);
      }
    }

    // Age-based retirement
    const elderly = r.roster.filter(w => w.status === "Active" && (w.age ?? 18) >= 30);
    for (const old of elderly.slice(0, 1)) {
      if (Math.random() < 0.15) { 
        old.status = "Retired";
        old.retiredWeek = state.week;
        gazetteItems.push(`🏠 ${old.name} (${r.owner.stableName}) retires after a long career — ${old.career.wins}W/${old.career.losses}L.`);
      }
    }

    // 2) Recruitment Logic
    const currentActive = r.roster.filter(w => w.status === "Active").length;
    const minRoster = personality === "Aggressive" ? 8 : personality === "Showman" ? 7 : 6;
    const recruitChance = personality === "Aggressive" ? 0.4 : personality === "Pragmatic" ? 0.25 : 0.15;
    
    // Gold Awareness: Recruitment costs 100g (signing fee)
    const RECRUIT_COST = 100;
    const canAfford = r.gold >= RECRUIT_COST + 200; // Keep a buffer
    const intent = r.strategy?.intent ?? "CONSOLIDATION";

    if (currentActive < minRoster && Math.random() < recruitChance && canAfford && intent !== "RECOVERY") {
      const adaptation = r.owner.metaAdaptation ?? "Opportunist";
      let customMeta = meta;

      // Special handling for rivalries: counter player's favorite style
      if (state.rivalries) {
        const rivalry = state.rivalries.find(rv =>
          (rv.stableIdA === state.player.id && rv.stableIdB === r.owner.id) ||
          (rv.stableIdB === state.player.id && rv.stableIdA === r.owner.id)
        );
        if (rivalry && rivalry.intensity >= 3 && adaptation !== "Traditionalist") {
          const playerMeta = computeMetaDrift(getRecentFightsForWarrior(state.arenaHistory, state.player.id, 10), 10);
          if (Object.keys(playerMeta).length > 0) customMeta = playerMeta;
        }
      }

      const newWarrior = generateAIRecruit(r, state.week, customMeta);
      if (newWarrior) {
        r.gold -= RECRUIT_COST;
        r.roster.push(newWarrior);
        const adaptQuote = META_RECRUIT_QUOTES[adaptation] ?? "\"A new warrior joins.\"";
        gazetteItems.push(`📢 ${r.owner.stableName} recruits ${newWarrior.name} (${newWarrior.style}) — ${adaptQuote}`);
      }
    }

    r.roster = r.roster.filter(w => w.status === "Active");
    return r;
  });

  return { updatedRivals, gazetteItems };
}

function generateAIRecruit(rival: RivalStableData, week: number, meta?: StyleMeta): Warrior | null {
  const philosophy = rival.philosophy ?? "Balanced";
  const adaptation = rival.owner.metaAdaptation ?? "Opportunist";
  const favoredStyles = rival.owner.favoredStyles ?? [];

  const style = pickRecruitStyle(adaptation, philosophy, favoredStyles, meta);
  const attrs = generateRecruitAttrs(philosophy);
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

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
      const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    case "MetaChaser": {
      if (meta) {
        const sorted = allStyles.slice().sort((a, b) => (meta[b] ?? 0) - (meta[a] ?? 0));
        return sorted[Math.floor(Math.random() * 3)];
      }
      return philosophyStyles[Math.floor(Math.random() * philosophyStyles.length)];
    }
    case "Innovator": {
      if (meta) {
        const sorted = allStyles.slice().sort((a, b) => (meta[a] ?? 0) - (meta[b] ?? 0));
        return sorted[Math.floor(Math.random() * 4)];
      }
      const nonStandard = allStyles.filter(s => !philosophyStyles.includes(s));
      return nonStandard[Math.floor(Math.random() * Math.max(1, nonStandard.length))];
    }
    case "Opportunist":
    default: {
      if (meta && Math.random() < 0.5) {
        const rising = allStyles.filter(s => (meta[s] ?? 0) >= 2);
        if (rising.length > 0) return rising[Math.floor(Math.random() * rising.length)];
      }
      const pool = favoredStyles.length > 0 ? favoredStyles : philosophyStyles;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
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

  let attempts = 0;
  while (pool > 0 && attempts < 500) {
    attempts++;
    const key = weighted[Math.floor(Math.random() * weighted.length)];
    const current = attrs[key];
    if (current >= 25) continue;
    
    const maxAdd = Math.min(pool, 25 - current);
    const add = Math.min(maxAdd, Math.floor(Math.random() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}