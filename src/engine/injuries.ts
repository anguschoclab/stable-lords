/**
 * Injury System — combat can cause injuries with mechanical effects.
 * 
 * Injuries have:
 * - A name/description
 * - Stat penalties (applied during fights)
 * - Recovery time in weeks
 * - Severity level
 */
import type { Warrior, FightOutcome, InjuryData, InjurySeverity } from "@/types/game";

const INJURY_TABLE: Omit<InjuryData, "id" | "weeksRemaining">[] = [
  // Minor (1-3 weeks)
  { name: "Bruised Ribs", description: "Painful but manageable.", severity: "Minor", penalties: { CN: -1 } },
  { name: "Sprained Wrist", description: "Weapon control slightly impaired.", severity: "Minor", penalties: { ATT: -1, DF: -1 } },
  { name: "Black Eye", description: "Vision slightly obscured.", severity: "Minor", penalties: { DEF: -1 } },
  { name: "Strained Shoulder", description: "Swings lack full power.", severity: "Minor", penalties: { ST: -1 } },
  { name: "Twisted Ankle", description: "Footwork compromised.", severity: "Minor", penalties: { SP: -1 } },
  // Moderate (3-6 weeks)
  { name: "Broken Nose", description: "Hard to breathe during exertion.", severity: "Moderate", penalties: { CN: -2, SP: -1 } },
  { name: "Cracked Ribs", description: "Every blow sends agony.", severity: "Moderate", penalties: { CN: -2, ST: -1 } },
  { name: "Concussion", description: "Reactions slowed, judgment impaired.", severity: "Moderate", penalties: { SP: -2, DF: -1, DEF: -1 } },
  { name: "Deep Laceration", description: "A wound that weakens with every movement.", severity: "Moderate", penalties: { ST: -1, CN: -2 } },
  { name: "Dislocated Shoulder", description: "Arm can barely hold a weapon.", severity: "Moderate", penalties: { ST: -2, ATT: -2 } },
  // Severe (6-12 weeks)
  { name: "Broken Arm", description: "Arm in a sling. Fighting ability devastated.", severity: "Severe", penalties: { ST: -3, ATT: -3, PAR: -2 } },
  { name: "Shattered Kneecap", description: "Mobility severely restricted.", severity: "Severe", penalties: { SP: -4, DEF: -3 } },
  { name: "Skull Fracture", description: "Lucky to be alive. Everything is slower.", severity: "Severe", penalties: { SP: -3, DF: -3, CN: -2 } },
  { name: "Severed Tendon", description: "A career-threatening wound.", severity: "Severe", penalties: { ST: -3, SP: -2, ATT: -2 } },
];

const SEVERITY_WEEKS: Record<InjurySeverity, [number, number]> = {
  Minor: [1, 3],
  Moderate: [3, 6],
  Severe: [6, 12],
  Critical: [12, 24],
  Permanent: [999, 999],
};

/** Roll for a possible injury after a fight. Returns an Injury or null. */
export function rollForInjury(
  warrior: Warrior,
  outcome: FightOutcome,
  side: "A" | "D"
): InjuryData | null {
  const wasHit = side === "A" ? (outcome.post?.hitsD ?? 0) : (outcome.post?.hitsA ?? 0);
  const lost = outcome.winner !== side && outcome.winner !== null;
  const wasKilled = (side === "A" && outcome.post?.gotKillD) || (side === "D" && outcome.post?.gotKillA);
  
  if (wasKilled) return null; // dead warriors don't get injured, they're dead

  // Base injury chance: 5% per hit taken, +15% if lost, +10% if KO'd
  let chance = wasHit * 0.05;
  if (lost) chance += 0.15;
  if (lost && outcome.by === "KO") chance += 0.10;

  // CN reduces injury chance
  const cnBonus = (warrior.attributes.CN - 10) * 0.01;
  chance = Math.max(0.02, chance - cnBonus);

  if (Math.random() >= chance) return null;

  // Determine severity based on damage taken
  let severityRoll = Math.random();
  if (outcome.by === "KO" && lost) severityRoll += 0.2;
  
  let severity: InjurySeverity;
  if (severityRoll > 0.85) severity = "Severe";
  else if (severityRoll > 0.5) severity = "Moderate";
  else severity = "Minor";

  // Pick a random injury of the right severity
  const candidates = INJURY_TABLE.filter((i) => i.severity === severity);
  const template = candidates[Math.floor(Math.random() * candidates.length)];
  
  const [minWeeks, maxWeeks] = SEVERITY_WEEKS[severity];
  const weeks = minWeeks + Math.floor(Math.random() * (maxWeeks - minWeeks + 1));

  return {
    ...template,
    id: crypto.randomUUID(),
    weeksRemaining: weeks,
  };
}

/** Tick all injuries down by 1 week, remove healed ones. Returns updated injuries array and healed names. */
export function tickInjuries(injuries: InjuryData[]): { active: InjuryData[]; healed: string[] } {
  const healed: string[] = [];
  const active: InjuryData[] = [];

  for (const inj of injuries) {
    const remaining = inj.weeksRemaining - 1;
    if (remaining <= 0) {
      healed.push(inj.name);
    } else {
      active.push({ ...inj, weeksRemaining: remaining });
    }
  }

  return { active, healed };
}

/** Get total stat penalties from active injuries */
export function getInjuryPenalties(injuries: InjuryData[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const inj of injuries) {
    for (const [stat, penalty] of Object.entries(inj.penalties)) {
      totals[stat] = (totals[stat] ?? 0) + (penalty ?? 0);
    }
  }
  return totals;
}

/** Check if a warrior is too injured to fight */
export function isTooInjuredToFight(injuries: InjuryData[]): boolean {
  return injuries.some((i) => i.severity === "Severe" && i.weeksRemaining > 2);
}
