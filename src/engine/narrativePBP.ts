import { KO_TEMPLATES } from "./narrativeTemplates";
/**
 * Stable Lords — Canonical Duelmasters PBP (Play-By-Play) Narrative Engine
 *
 * Generates fight narration in the authentic style of Duelmasters/Duel II arena reports.
 * Based on canonical PBP examples from Terrablood archives:
 *   v0.1: joro.txt, bchief.txt, beast.txt, lao.txt, mstroke.txt, ninja.txt, rouge.txt
 *   v0.2: FTF26 Tournament Archive (FURIOUS GEORGE — 17 bouts, 14-3 record)
 *
 * Key narrative patterns preserved:
 * - Pre-bout warrior introductions (height, armor, weapon, style, suitability)
 * - Weapon-specific attack verbs ("slashes with his SCIMITAR!", "bashes with his MAUL!")
 * - Rich defense vocabulary (dodge, parry, block, counterstrike)
 * - Positional movement ("leaps to his left!", "shifts to his right")
 * - Crowd reactions (jeers, cheers, derision, encouragement)
 * - Warrior taunts mid-combat
 * - Minute markers with status assessments
 * - Desperation / bleeding / panic state changes
 * - Damage severity descriptors ("What a massive blow!", "deadly attack!")
 * - Armor deflection mechanics
 * - Kill / KO / stoppage / surrender narration
 * - Stalemate/filler lines for action resets
 */

import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getItemById, getItemByCode } from "@/data/equipment";
import {
  HIT_LOC_VARIANTS as _HIT_LOC_VARIANTS,
  STYLE_PBP_DESC as _STYLE_PBP_DESC,
  ARMOR_INTRO_VERBS,
  WEAPON_INTRO_VERBS,
  HELM_DESCS as _HELM_DESCS,
  BATTLE_OPENERS,
  PARRY_TEMPLATES,
  PARRY_SHIELD_TEMPLATES,
  DODGE_TEMPLATES,
  COUNTERSTRIKE_TEMPLATES,
  HIT_TEMPLATES,
  PARRY_BREAK_TEMPLATES,
  CROWD_REACTIONS_POSITIVE,
  CROWD_REACTIONS_NEGATIVE,
  CROWD_REACTIONS_ENCOURAGE,
  INI_WIN_TEMPLATES,
  INI_KEEP_TEMPLATES
} from "./narrativeTemplates";


// ─── Types ──────────────────────────────────────────────────────────────────

type RNG = () => number;

function pick<T>(rng: RNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Hit Location Display ───────────────────────────────────────────────────

/** Map engine hit locations to rich canonical body part names */
const HIT_LOC_VARIANTS: Record<string, string[]> = {
  "head":      ["HEAD", "JAW", "TEMPLE", "FOREHEAD", "SKULL", "FACE", "THROAT", "NECK", "side of the HEAD"],
  "chest":     ["CHEST", "RIBS", "RIGHT RIBCAGE", "LEFT RIBCAGE", "upper BODY", "BREAST"],
  "abdomen":   ["STOMACH", "ABDOMEN", "PELVIS", "KIDNEYS", "GROIN", "BELLY", "LOWER BODY"],
  "right arm": ["RIGHT ARM", "RIGHT FOREARM", "RIGHT BICEPS", "RIGHT ELBOW", "RIGHT HAND"],
  "left arm":  ["LEFT ARM", "LEFT FOREARM", "LEFT BICEPS", "LEFT ELBOW", "LEFT HAND"],
  "right leg": ["RIGHT LEG", "RIGHT THIGH", "RIGHT KNEE", "RIGHT SHIN", "RIGHT BUTTOCKS"],
  "left leg":  ["LEFT LEG", "LEFT THIGH", "LEFT KNEE", "LEFT SHIN"],
};

export function richHitLocation(rng: RNG, location: string): string {
  const variants = HIT_LOC_VARIANTS[location.toLowerCase()];
  if (!variants) return location.toUpperCase();
  return pick(rng, variants);
}

// ─── Weapon Name Helper ─────────────────────────────────────────────────────

export function getWeaponDisplayName(equipId?: string): string {
  if (!equipId || equipId === "fists" || equipId === "none") return "OPEN HAND";
  // Try by ID first, then by canonical code (e.g. "BS" → "Broadsword")
  const item = getItemById(equipId) ?? getItemByCode(equipId);
  return item?.name?.toUpperCase() ?? "WEAPON";
}

// ─── Style Names for PBP ────────────────────────────────────────────────────

const STYLE_PBP_DESC: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]:      "uses the AIMED BLOW discipline",
  [FightingStyle.BashingAttack]:  "fights using a BASHING attack",
  [FightingStyle.LungingAttack]:  "will fight using the attack style of LUNGING",
  [FightingStyle.ParryLunge]:     "is a devotee of the PARRY-LUNGE style",
  [FightingStyle.ParryRiposte]:   "is a devotee of the PARRY-RIPOSTE style",
  [FightingStyle.ParryStrike]:    "uses the PARRY-STRIKE style",
  [FightingStyle.SlashingAttack]: "uses the SLASHING attack for fighting",
  [FightingStyle.StrikingAttack]: "is dedicated to the STRIKING attack style",
  [FightingStyle.TotalParry]:     "uses the TOTAL PARRY style",
  [FightingStyle.WallOfSteel]:    "is a WALL OF STEEL fighter",
};

// ─── Pre-Bout Intro Block ───────────────────────────────────────────────────

export interface WarriorIntroData {
  name: string;
  style: FightingStyle;
  weaponId?: string;
  armorId?: string;
  helmId?: string;
  height?: number; // SZ-derived approximate height in inches
}

function szToHeight(sz: number): string {
  // Approximate DM-style heights from SZ attribute
  const inches = 58 + Math.max(0, sz - 3) * 1.2;
  const ft = Math.floor(inches / 12);
  const inch = Math.round(inches % 12);
  return inch > 0 ? `${ft}' ${inch}"` : `${ft}'`;
}





const HELM_DESCS: Record<string, string[]> = {
  "leather_cap": ["LEATHER CAP"],
  "steel_cap":   ["STEEL CAP", "etched STEEL CAP"],
  "helm":        ["HELM", "spectacular HELM"],
  "full_helm":   ["FULL HELM", "fearsome FULL HELM"],
};

export function generateWarriorIntro(rng: RNG, data: WarriorIntroData, sz?: number): string[] {
  const lines: string[] = [];
  const n = data.name;

  // Height
  if (sz) {
    lines.push(`${n} is ${szToHeight(sz)}.`);
  }

  // Handedness (random flavor)
  const hand = rng() < 0.85 ? "right handed" : rng() < 0.5 ? "left handed" : "ambidextrous";
  lines.push(`${n} is ${hand}.`);

  // Armor
  const armorItem = data.armorId ? getItemById(data.armorId) : null;
  if (armorItem && armorItem.id !== "none_armor") {
    lines.push(`${n} ${pick(rng, ARMOR_INTRO_VERBS)} ${armorItem.name.toUpperCase()} armor.`);
  } else {
    lines.push(`${n} has chosen to fight without body armor.`);
  }

  // Helm
  const helmItem = data.helmId ? getItemById(data.helmId) : null;
  if (helmItem && helmItem.id !== "none_helm") {
    const helmNames = HELM_DESCS[helmItem.id] ?? [helmItem.name.toUpperCase()];
    lines.push(`And will wear a ${pick(rng, helmNames)}.`);
  }

  // Weapon
  const weaponName = getWeaponDisplayName(data.weaponId);
  if (weaponName === "OPEN HAND") {
    lines.push(`${n} will fight using his OPEN HAND.`);
  } else {
    lines.push(pick(rng, WEAPON_INTRO_VERBS).replace("%W", weaponName) + ".");
    // Capitalize first char
    lines[lines.length - 1] = n + " " + lines[lines.length - 1];
  }

  // Style
  lines.push(`${n} ${STYLE_PBP_DESC[data.style] ?? `uses the ${STYLE_DISPLAY_NAMES[data.style]} style`}.`);

  // Suitability (always positive in DM PBP)
  lines.push(`${n} is well suited to ${rng() < 0.5 ? "his" : "the"} weapon${rng() < 0.3 ? "s selected" : ""}.`);

  return lines;
}

// ─── Battle Openers ─────────────────────────────────────────────────────────



export function battleOpener(rng: RNG): string {
  return pick(rng, BATTLE_OPENERS);
}

// ─── Attack Narration (Weapon-Specific) ─────────────────────────────────────

type WeaponType = "slash" | "bash" | "thrust" | "fist" | "generic";

function getWeaponType(weaponId?: string): WeaponType {
  if (!weaponId || weaponId === "fists" || weaponId === "none") return "fist";
  const slashWeapons = ["scimitar", "broadsword", "greatsword", "longsword", "short_sword", "hatchet", "battle_axe", "great_axe"];
  const bashWeapons = ["mace", "war_hammer", "morning_star", "maul", "war_flail"];
  const thrustWeapons = ["epee", "dagger", "short_spear", "long_spear", "halberd", "quarterstaff"];
  if (slashWeapons.includes(weaponId)) return "slash";
  if (bashWeapons.includes(weaponId)) return "bash";
  if (thrustWeapons.includes(weaponId)) return "thrust";
  return "generic";
}

const ATTACK_TEMPLATES: Record<WeaponType, string[]> = {
  slash: [
    "%N slashes with his %W!",
    "%N slashes an arcing attack with his %W!",
    "%N whips his %W blade back and forth as if to slash his foe to ribbons!",
    "%N makes a slashing attack wielding a %W!",
    "%N makes a slashing attack using his %W!",
    "%N ducks low, his %W slicing suddenly upwards!",
    "%N makes a brilliant twisting thrust with his %W!",
    "%N times a devilish cunning attack, %W leaping with deadly force!",
    "%N's %W lunges with awesome cutting power!",
    "%N strikes using his %W!",
    "%N lunges forward wielding a %W!",
    "%N lunges with his %W!",
    "%N whirls and strikes backhandedly with his %W!",
    "%N drives his %W in a forward slash!",
    "%N leaps into the air taking a furious slash with his %W!",
    "%N leaps forward, swinging his %W into a veritable wall of blades!",
    "%N's %W flashes as he takes a sudden vicious slash at his foe!",
  ],
  bash: [
    "%N bashes with his %W!",
    "%N smashes with his %W!",
    "%N smashes downward with his %W!",
    "%N takes a swipe with his %W!",
    "%N bats murderously at his foe with his %W!",
    "%N strikes using his %W!",
    "%N throws his full weight behind his %W in an all-out assault!",
    "%N attacks, whirling the %W with tremendous force!",
    "%N attempts to smash his opponent with his %W!",
    "%N cleverly tries to break his foe's defense with his %W!",
    "%N swings his %W with deadly intent at the target!",
    "%N whips his %W downward in a vicious power smash!",
  ],
  thrust: [
    "%N lunges wielding an %W!",
    "%N thrusts with his %W!",
    "%N lunges with his %W!",
    "%N lunges forward with his %W!",
    "%N stabs powerfully upward with his %W!",
    "%N uses his %W to make a deadly jab at his foe!",
    "%N unleashes his %W in a piercingly accurate thrust!",
    "%N strikes forward with his %W, all his weight behind the blow!",
    "%N thrusts his %W forward with an unbelievably deadly force!",
    "%N feints, then springs viciously forward with his %W!",
    "%N catapults forward, %W stabbing cruelly at his foe!",
    "%N leaps into an incredible flesh-splitting lunge with his %W!",
    "%N catapults forward, %W flashing in a deadly assault!",
    "%N lunges forward, %W thrusting with incredible speed and accuracy!",
    "%N dives forward, %W stabbing repeatedly with his charge!",
    "%N makes a lunging attack with his %W!",
  ],
  fist: [
    "%N PUNCHES from the waist with unbelievable quickness!",
    "%N throws a rock-fisted PUNCH of incredible felling power!",
    "%N hammers down with a ferocious FOREARM smash!",
    "%N focuses all of his power into a devastating KICK!",
    "%N's HANDS flash forward jabbing fiercely at his surprised foe!",
    "%N attacks, FISTS punching with piston-like horse felling power!",
    "%N throws a piston-like SIDE KICK at his opponent!",
    "%N dives forward, FISTS driving at his opponent with menacing fury!",
    "%N attacks his foe with a pinpoint-accurate ELBOW!",
  ],
  generic: [
    "%N strikes using his %W!",
    "%N makes an attack with his %W!",
    "%N strikes forward with his %W!",
    "%N lashes out with his %W!",
  ],
};

/**
 * Generates a colorful and dramatic play-by-play narrative for an attack attempt.
 * Contextualizes the weapon, style, and phase of combat.
 *
 * @param att - The attacking warrior.
 * @param def - The defending warrior.
 * @param attTactic - The specific offensive tactic being used.
 * @param style - The fighting style of the attacker.
 * @param phase - The current phase of the fight.
 * @param rng - A pseudo-random number generator for text selection.
 * @param wpBonus - Any weapon bonuses applied to the attack.
 * @returns A string describing the attack attempt.
 */
export function narrateAttack(rng: RNG, attackerName: string, weaponId?: string): string {
  const wType = getWeaponType(weaponId);
  const wName = getWeaponDisplayName(weaponId);
  const template = pick(rng, ATTACK_TEMPLATES[wType]);
  return template.replace(/%N/g, attackerName).replace(/%W/g, wName);
}

// ─── Parry/Block Narration ──────────────────────────────────────────────────





/**
 * Generates narrative text for a successful parry by the defender.
 *
 * @param att - The attacking warrior.
 * @param def - The defending warrior.
 * @param defTactic - The specific defensive tactic used.
 * @param style - The fighting style of the defender.
 * @param isPerfect - Indicates whether the parry was perfectly executed.
 * @param rng - A pseudo-random number generator for text selection.
 * @returns A string describing the successful defense.
 */
export function narrateParry(rng: RNG, defenderName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  const isShield = weaponId && ["small_shield", "medium_shield", "large_shield"].includes(weaponId);
  const templates = isShield ? PARRY_SHIELD_TEMPLATES : PARRY_TEMPLATES;
  return pick(rng, templates).replace(/%D/g, defenderName).replace(/%W/g, wName);
}

// ─── Dodge Narration ────────────────────────────────────────────────────────



/**
 * Generates narrative text describing a successful dodge or evasion.
 *
 * @param att - The attacking warrior.
 * @param def - The defending warrior.
 * @param defTactic - The specific defensive tactic used.
 * @param rng - A pseudo-random number generator for text selection.
 * @returns A string describing the evasion.
 */
export function narrateDodge(rng: RNG, defenderName: string): string {
  return pick(rng, DODGE_TEMPLATES).replace(/%D/g, defenderName);
}

// ─── Riposte / Counterstrike Narration ──────────────────────────────────────



export function narrateCounterstrike(rng: RNG, name: string): string {
  return pick(rng, COUNTERSTRIKE_TEMPLATES).replace(/%D/g, name);
}

// ─── Hit Narration ──────────────────────────────────────────────────────────





/**
 * Generates narrative text for a successful hit on a target location.
 * Provides flavor text based on the weapon, hit location, and damage dealt.
 *
 * @param att - The attacking warrior.
 * @param def - The defending warrior.
 * @param loc - The body part that was hit.
 * @param dmg - The calculated damage amount.
 * @param phase - The current phase of the fight.
 * @param rng - A pseudo-random number generator for text selection.
 * @returns A string describing the successful hit.
 */
export function narrateHit(rng: RNG, defenderName: string, location: string): string {
  const richLoc = richHitLocation(rng, location);
  return pick(rng, HIT_TEMPLATES).replace(/%D/g, defenderName).replace(/%L/g, richLoc);
}

export function narrateParryBreak(rng: RNG, attackerName: string, weaponId?: string): string {
  const wName = getWeaponDisplayName(weaponId);
  return pick(rng, PARRY_BREAK_TEMPLATES).replace(/%A/g, attackerName).replace(/%W/g, wName);
}

// ─── Damage Severity Descriptors ────────────────────────────────────────────

export function damageSeverityLine(rng: RNG, damage: number, maxHp: number): string | null {
  const ratio = damage / maxHp;
  if (ratio >= 0.35) return pick(rng, [
    "It was a deadly attack!",
    "What a massive blow!",
    "What a devastating attack!",
    "Spectators cringe as the horrific power of the blow strikes home!",
  ]);
  if (ratio >= 0.25) return pick(rng, [
    "It was an incredible blow!",
    "It is a terrific blow!",
    "It was an awesome blow.",
  ]);
  if (ratio >= 0.15) return pick(rng, [
    "It is a tremendous blow!",
    "It was a powerful blow!",
  ]);
  if (ratio <= 0.05) return pick(rng, [
    "The attack is a glancing blow only.",
    "The stroke lands ineffectively.",
    "The assault fails to do much damage.",
  ]);
  return null;
}

// ─── Warrior State Changes ──────────────────────────────────────────────────

export function stateChangeLine(rng: RNG, name: string, hpRatio: number, prevHpRatio: number): string | null {
  // Only trigger on transitions
  if (hpRatio <= 0.2 && prevHpRatio > 0.2) {
    return pick(rng, [
      `${name} is on the verge of shock!!`,
      `${name} is severely hurt!!`,
      `${name} is dangerously stunned!`,
      `${name} is badly hurt!`,
    ]);
  }
  if (hpRatio <= 0.4 && prevHpRatio > 0.4) {
    return pick(rng, [
      `${name} appears DESPERATE!`,
      `${name} appears desperate!`,
      `${name} appears to be getting DESPERATE!`,
      `${name}'s eyes flame with DESPERATION!`,
      `Our ${name} fights with DESPERATION!`,
      `${name} begins to panic and fights desperately!`,
      `${name} is becoming frantic!!!`,
      `${name} is becoming frantically careless!!!`,
    ]);
  }
  if (hpRatio <= 0.6 && prevHpRatio > 0.6) {
    return pick(rng, [
      `${name} has sustained serious wounds!`,
      `${name} has been sorely wounded!`,
      `${name} whitens with the pain of his wounds.`,
      `${name} whitens with the pain of the wounds.`,
      `${name} falls back, eyes flaring with renewed determination!`,
      `${name} loses composure, and cries out in pain!`,
      `${name} gasps, 'Gods!! Please give me the strength to finish this fight!'`,
      `${name} winces and smiles feebly.`,
      `${name} is bleeding badly!`,
      `${name} falls back, unable to take the punishment.`,
      `${name} retreats, his features distorted in a terrible grimace.`,
    ]);
  }
  return null;
}

// ─── Fatigue / Endurance Lines ──────────────────────────────────────────────

export function fatigueLine(rng: RNG, name: string, endRatio: number): string | null {
  if (endRatio <= 0.15) return pick(rng, [
    `${name} is tired and barely able to defend himself!`,
    `${name} seems to be running out of energy.`,
  ]);
  if (endRatio <= 0.3) return pick(rng, [
    `${name} is breathing heavily.`,
    `${name} is still wearing with exhaustion!`,
    `${name} pauses to regain his strength.`,
    `There is a lull in the action, as both warriors pause to catch their breath.`,
  ]);
  if (endRatio <= 0.5) return pick(rng, [
    `${name} slows his pace to conserve energy.`,
    `${name} forgoes the offensive to save his strength.`,
  ]);
  return null;
}

// ─── Crowd Reactions ────────────────────────────────────────────────────────







/**
 * Generates a crowd reaction narrative line based on the severity of action.
 * Typically called after massive hits or significant moments.
 *
 * @param rng - A pseudo-random number generator for text selection.
 * @param isHuge - Boolean indicating if the event was extraordinary.
 * @returns A string representing the crowd's reaction.
 */
export function crowdReaction(rng: RNG, loserName: string, winnerName: string, hpRatio: number): string | null {
  if (rng() > 0.25) return null; // Only trigger ~25% of the time
  
  if (hpRatio <= 0.3) {
    return pick(rng, CROWD_REACTIONS_ENCOURAGE).replace(/%N/g, loserName);
  }
  if (rng() < 0.5) {
    return pick(rng, CROWD_REACTIONS_NEGATIVE).replace(/%N/g, loserName);
  }
  return pick(rng, CROWD_REACTIONS_POSITIVE);
}

// ─── Initiative Narration ───────────────────────────────────────────────────



const INI_FEINT_TEMPLATES = [
  "%N feints an attack, freezing his opponent's initiative!",
  "%N feints an attack, hindering his opponent's initiative!",
  "%N feints an attack, trying to disrupt the rhythm of the fight!",
];

/**
 * Narrates the start of a combat minute and who seizes initiative.
 * Sets the tone for the upcoming series of exchanges.
 *
 * @param p - The warrior who won the initiative.
 * @param p2 - The warrior who lost the initiative.
 * @param rng - A pseudo-random number generator for text selection.
 * @returns A string describing the shift in momentum.
 */
export function narrateInitiative(rng: RNG, winnerName: string, isFeint: boolean): string {
  if (isFeint) return pick(rng, INI_FEINT_TEMPLATES).replace(/%N/g, winnerName);
  return pick(rng, INI_WIN_TEMPLATES).replace(/%N/g, winnerName);
}

// ─── Minute Marker Status Lines ─────────────────────────────────────────────

const EVEN_STATUS = [
  "The warriors appear equal in skill.",
  "The battle is too close to tell.",
  "The warriors appear evenly matched.",
  "There is no decisive victor here yet.",
];

export function minuteStatusLine(rng: RNG, minute: number, nameA: string, nameD: string, hitsA: number, hitsD: number): string {
  if (hitsA > hitsD + 3) return `${nameA} is beating his opponent!`;
  if (hitsD > hitsA + 3) return `${nameD} is beating his opponent!`;
  if (hitsA > hitsD + 1) return `${nameA}, so far, is ahead of his formidable opponent!`;
  if (hitsD > hitsA + 1) return `${nameD}, so far, is ahead of his formidable opponent!`;
  return pick(rng, EVEN_STATUS);
}

// ─── Bout End Narration ─────────────────────────────────────────────────────

const KILL_TEMPLATES = [
  "%D is gravely injured!\n%A delivers the killing blow!",
  "%D crumples to the ground, lifeless.\n%A's strike was unerring and final.",
  "%D falls to the arena floor. The wound is mortal.\nSilence grips the crowd.",
  "%D stumbles to the ground!!!\n%D is slain!",
];
const KO_TEMPLATES = [
  "%D is knocked unconscious!\n%A stands victorious over their fallen foe.",
  "%D collapses to the ground, out cold!\n%A raises a fist in triumph.",
  "A devastating blow sends %D sprawling!\n%A wins by knockout!",
];

const STOPPAGE_TEMPLATES = [
  "%D motions to the other LORD PROTECTORS that he cannot continue!\n%A is the victor of the match!",
  "%D is stopped by an outcry from the LORD PROTECTORS!\n%A has won the duel!",
  "%D accepts his loss, jaw clenched to keep from admitting his pain!\n%A is the victor of the match!",
  "%D compliments his victorious foe on a good fight.\n%A has won the duel!",
  "%D surrenders, and offers his hand to his foe.\n%A is the victor of the match!",
];

const EXHAUSTION_TEMPLATES = [
  "%D can no longer keep fighting. Both warriors are spent.\n%A is awarded the bout on points.",
  "Neither warrior can continue! The Arenamaster awards the bout to %A.",
];

export function narrateBoutEnd(rng: RNG, by: string, winnerName: string, loserName: string): string[] {
  let templates: string[];
  switch (by) {
    case "Kill": templates = KILL_TEMPLATES; break;
    case "KO": templates = KO_TEMPLATES; break;
    case "Stoppage": templates = STOPPAGE_TEMPLATES; break;
    case "Exhaustion": templates = EXHAUSTION_TEMPLATES; break;
    default: return [`${winnerName} is the victor of the match!`];
  }
  const template = pick(rng, templates);
  return template.replace(/%A/g, winnerName).replace(/%D/g, loserName).split("\n");
}

// ─── Post-Bout Narration ────────────────────────────────────────────────────

const POPULARITY_TEMPLATES = {
  great:    "%N's popularity has greatly increased!",
  normal:   "%N's popularity has increased.",
  marginal: "%N's popularity has marginally increased.",
};

export function popularityLine(name: string, popDelta: number): string | null {
  if (popDelta >= 3) return POPULARITY_TEMPLATES.great.replace(/%N/g, name);
  if (popDelta >= 1) return POPULARITY_TEMPLATES.normal.replace(/%N/g, name);
  if (popDelta > 0) return POPULARITY_TEMPLATES.marginal.replace(/%N/g, name);
  return null;
}

const SKILL_LEARNS = [
  "%N learned an ATTACK skill.",
  "%N learned a PARRY skill.",
  "%N learned a DEFENSIVE action.",
  "%N learned an INITIATIVE routine.",
  "%N learned a RIPOSTE technique.",
  "%N learned a DECISIVENESS concept.",
];

export function skillLearnLine(rng: RNG, name: string): string {
  return pick(rng, SKILL_LEARNS).replace(/%N/g, name);
}

// ─── Grapple / Trading Blows (Filler) ───────────────────────────────────────

const TRADING_BLOWS = [
  "The two warriors fiercely trade attacks and parrys.",
  "Both attack, weapons strike and rebound, strike and rebound.",
  "Both attack; weapons strike and rebound, strike and rebound.",
  "The warriors attack together, almost grappling with each other.",
  "The weapons lock together in a struggle for supremacy.",
  "The weapons lock together in a test of strength.",
];

export function tradingBlowsLine(rng: RNG): string {
  return pick(rng, TRADING_BLOWS);
}

// ─── Stalemate / Action Reset Lines ─────────────────────────────────────────

const STALEMATE_LINES = [
  "The fighters slowly circle each other, looking for a weakness.",
  "The fighter's slowly circle each other, looking for a weakness.",
  "The fighters step back from each other for a moment.",
  "The action comes to a halt as the warriors reorient themselves.",
  "The warriors stand quietly and study each other.",
];

export function stalemateLine(rng: RNG): string {
  return pick(rng, STALEMATE_LINES);
}

// ─── Taunt / Quote Lines ────────────────────────────────────────────────────

const WINNER_TAUNTS = [
  "%N says, 'Another blow and I'll send you to Ahringol!'",
  "%N says, 'And that is how a real warrior fights. Pay attention next time.'",
  "%N says, 'That was a well fought, and honorable fight.'",
  "%N laughs, 'Oh, this is PRICELESS! Did someone actually tell you you could FIGHT?'",
  "%N growls, 'Are you even human?'",
  "%N grates, 'Try that again, dog!'",
  "%N salutes the audience, then offers a hand to his fallen foe.",
];

const LOSER_TAUNTS = [
  "%N spits 'May maggots partake of your corpse as they have with your ancestors!'",
  "%N exclaims, 'Give it up now, wimp, before I rip your face off!'",
  "%N bellows his frustration.",
  "%N mutters a desperate prayer!",
  "%N reels with the fury of combat!",
  "%N howls like a maddened beast!",
];

export function tauntLine(rng: RNG, name: string, isWinner: boolean): string | null {
  if (rng() > 0.2) return null;
  const templates = isWinner ? WINNER_TAUNTS : LOSER_TAUNTS;
  return pick(rng, templates).replace(/%N/g, name);
}

// ─── Conserving Energy (Low OE) ─────────────────────────────────────────────

export function conservingLine(name: string): string {
  return `${name} is conserving his energy.`;
}

// ─── Pressing / Dominance Lines ─────────────────────────────────────────────

const PRESSING_TEMPLATES = [
  "Our brawny gladiator is pressing his foe to the limit!",
  "%N can't believe that this guy has not surrendered!",
  "%N fights with the cunning of desperation!",
];

export function pressingLine(rng: RNG, name: string): string {
  return pick(rng, PRESSING_TEMPLATES).replace(/%N/g, name);
}

// ─── Insight Narration ──────────────────────────────────────────────────────

const INSIGHT_ST_HINTS = [
  "His parry shatters under your monstrous strength!",
  "Your blade meets staggering resistance, his strength is undeniable.",
  "He carelessly bats away your strike with raw power.",
];

const INSIGHT_SP_HINTS = [
  "His sluggish movements fail to catch your swift strike.",
  "He moves with blinding speed, leaving you swinging at shadows.",
  "Your reflexes seem barely enough to keep up with his pace.",
];

const INSIGHT_DF_HINTS = [
  "He clumsily overextends, leaving himself wide open.",
  "His flawless footwork and deft parry leave you bewildered.",
  "His clumsy defense makes him an easy target.",
];

const INSIGHT_WL_HINTS = [
  "Despite the punishment, his iron will keeps him standing.",
  "He seems to waver, his resolve breaking under your assault.",
];

export function narrateInsightHint(rng: RNG, attribute: string): string | null {
  if (rng() > 0.4) return null; // 40% chance to reveal an insight

  switch(attribute) {
    case 'ST':
      return pick(rng, INSIGHT_ST_HINTS);
    case 'SP':
      return pick(rng, INSIGHT_SP_HINTS);
    case 'DF':
      return pick(rng, INSIGHT_DF_HINTS);
    case 'WL':
      return pick(rng, INSIGHT_WL_HINTS);
    default:
      return null;
  }
}
