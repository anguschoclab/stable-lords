import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getItemById, getItemByCode } from "@/data/equipment";

export const HIT_LOC_VARIANTS: Record<string, string[]> = {
  "head":      ["HEAD", "JAW", "TEMPLE", "FOREHEAD", "SKULL", "FACE", "THROAT", "NECK", "side of the HEAD"],
  "chest":     ["CHEST", "RIBS", "RIGHT RIBCAGE", "LEFT RIBCAGE", "upper BODY", "BREAST"],
  "abdomen":   ["STOMACH", "ABDOMEN", "PELVIS", "KIDNEYS", "GROIN", "BELLY", "LOWER BODY"],
  "right arm": ["RIGHT ARM", "RIGHT FOREARM", "RIGHT BICEPS", "RIGHT ELBOW", "RIGHT HAND"],
  "left arm":  ["LEFT ARM", "LEFT FOREARM", "LEFT BICEPS", "LEFT ELBOW", "LEFT HAND"],
  "right leg": ["RIGHT LEG", "RIGHT THIGH", "RIGHT KNEE", "RIGHT SHIN", "RIGHT BUTTOCKS"],
  "left leg":  ["LEFT LEG", "LEFT THIGH", "LEFT KNEE", "LEFT SHIN"],
};

export const STYLE_PBP_DESC: Record<FightingStyle, string> = {
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

export const ARMOR_INTRO_VERBS = [
  "will wear a fine, well-oiled suit of",
  "will wear",
  "has been given a suit of",
  "has chosen to wear finely crafted",
  "is checking the straps of his",
  "has drawn on a suit of",
  "has put on a suit of",
  "is clad in",
];

export const WEAPON_INTRO_VERBS = [
  "awaits with a %W in hand",
  "is armed with a %W",
  "has selected a %W",
  "stands balancing a %W",
  "walks out, swinging a %W",
  "is swinging a %W",
  "is drawing a %W from its sheath",
  "tests the balance of a %W",
  "grins down his %W at his foe",
  "grins down his %W at her foe",
];

export const HELM_DESCS: Record<string, string[]> = {
  "leather_cap": ["LEATHER CAP"],
  "steel_cap":   ["STEEL CAP", "etched STEEL CAP"],
  "helm":        ["HELM", "spectacular HELM"],
  "full_helm":   ["FULL HELM", "fearsome FULL HELM"],
};

export const BATTLE_OPENERS = [
  "The battle begins amid the crowd's approval.",
  "Those in the stands shift their attention to the warriors.",
  "The audience falls silent as the dueling begins.",
  "The audience rises as the fighting begins.",
  "The warriors advance on each other.",
  "The time for the fight has come.",
  "The signal is given for the duel to begin.",
  "The battle begins",
  "The crowd watches intently as the warriors square off.",
];

export const PARRY_TEMPLATES = [
  "deflects the blow with his %W.",
  "parries with a twist of his %W.",
  "knocks the incoming strike aside with his %W.",
  "blocks the attack effortlessly.",
  "sweeps the attack away using his %W.",
];

export const PARRY_SHIELD_TEMPLATES = [
  "catches the blow on his SHIELD.",
  "blocks the strike with a raised SHIELD.",
  "interposes his SHIELD.",
  "angles his SHIELD to deflect the attack.",
];

export const DODGE_TEMPLATES = [
  "dodges quickly.",
  "steps away from the attack.",
  "leaps back from the swing.",
  "ducks beneath the blow.",
  "evades the attack smoothly.",
  "shifts aside, avoiding the strike.",
];

export const COUNTERSTRIKE_TEMPLATES = [
  "%N twists inside the attack and launches a COUNTERSTRIKE!",
  "%N parries and IMMEDIATELY strikes back!",
  "A sudden opening—%N exploits it with a COUNTERSTRIKE!",
];

export const HIT_TEMPLATES = [
  "a solid strike connects with",
  "lands a heavy blow to",
  "strikes cleanly against",
  "finds its mark on",
  "slams into",
];

export const PARRY_BREAK_TEMPLATES = [
  "%A brings %W crashing through the parry!",
  "%A's force overwhelms the block!",
  "The block is SHATTERED by %A's %W!",
];

export const CROWD_REACTIONS_POSITIVE = [
  "The crowd ROARS in approval!",
  "Cheers erupt from the stands!",
  "The audience leaps to their feet!",
];

export const CROWD_REACTIONS_NEGATIVE = [
  "Boos and jeers echo from the arena walls.",
  "The crowd murmurs in disappointment.",
  "Derisive laughter from the high seats.",
];

export const CROWD_REACTIONS_ENCOURAGE = [
  "Chants of encouragement begin to build.",
  "The crowd urges the warriors on.",
];

export const INI_WIN_TEMPLATES = [
  "%N seizes the initiative!",
  "%N gains the upper hand.",
  "A sudden burst of speed puts %N on the offensive.",
  "%N presses the attack.",
];

export const INI_KEEP_TEMPLATES = [
  "%N maintains the assault.",
  "%N continues to press the advantage.",
  "Relentless, %N strikes again.",
];

export const EXECUTION_TEMPLATES = [
  "%A delivers a brutal execution stroke!",
  "%A shows no mercy, finishing the bout!",
  "The final blow is devastating.",
];

export const KO_TEMPLATES = [
  "%D collapses, unconscious.",
  "%D goes down hard and doesn't move.",
  "The strike knocks %D senseless.",
];

export const SURRENDER_TEMPLATES = [
  "%D yields to %A.",
  "%D signals surrender.",
  "Unable to continue, %D throws down his weapon.",
];

export const FATIGUE_COLLAPSE_TEMPLATES = [
  "%N collapses from sheer exhaustion.",
  "His endurance spent, %N falls to the sand.",
];

export const TAUNT_TEMPLATES = [
  '"Is that all you have?" sneers %N.',
  '%N laughs. "You fight like a child!"',
  '"Prepare to die," %N hisses.',
];

export const STALEMATE_TEMPLATES = [
  "The warriors circle cautiously.",
  "A moment's pause as both catch their breath.",
  "They trade feints, looking for an opening.",
];

export const SLASH_ATTACK_TEMPLATES = [
  "slashes his %W at",
  "swings a wide arc at",
  "cuts fiercely at",
];

export const BASH_ATTACK_TEMPLATES = [
  "bashes heavily with his %W toward",
  "swings a crushing blow at",
  "hammers down on",
];

export const THRUST_ATTACK_TEMPLATES = [
  "thrusts his %W directly at",
  "lunges forward, aiming at",
  "stabs toward",
];

export const FIST_ATTACK_TEMPLATES = [
  "throws a savage punch at",
  "strikes out with an OPEN HAND at",
  "jabs quickly at",
];

export const GENERIC_ATTACK_TEMPLATES = [
  "attacks with his %W targeting",
  "strikes out at",
];
