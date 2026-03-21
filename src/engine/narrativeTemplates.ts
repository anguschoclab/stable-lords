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
  "A brutal cheer rises as the combatants face each other.",
  "The scent of old blood fills the air as the bout commences.",
  "Anticipation grips the arena as the duel gets underway.",
];

export const PARRY_TEMPLATES = [
  "deflects the blow with his %W.",
  "parries with a twist of his %W.",
  "knocks the incoming strike aside with his %W.",
  "blocks the attack effortlessly.",
  "sweeps the attack away using his %W.",
  "catches the vicious swing on the flat of his %W.",
  "turns the strike aside with a screech of steel against his %W.",
];

export const PARRY_SHIELD_TEMPLATES = [
  "catches the blow on his SHIELD.",
  "blocks the strike with a raised SHIELD.",
  "interposes his SHIELD.",
  "angles his SHIELD to deflect the attack.",
  "absorbs the impact entirely with his SHIELD.",
  "raises his SHIELD just in time to catch the blow.",
];

export const DODGE_TEMPLATES = [
  "dodges quickly.",
  "steps away from the attack.",
  "leaps back from the swing.",
  "ducks beneath the blow.",
  "evades the attack smoothly.",
  "shifts aside, avoiding the strike.",
  "twists his body, the strike missing by a hair's breadth.",
  "slips beneath the attack with surprising agility.",
];

export const COUNTERSTRIKE_TEMPLATES = [
  "%N twists inside the attack and launches a COUNTERSTRIKE!",
  "%N parries and IMMEDIATELY strikes back!",
  "A sudden opening—%N exploits it with a COUNTERSTRIKE!",
  "Exploiting the overextension, %N delivers a rapid COUNTERSTRIKE!",
  "%N bats the attack aside, leaving his foe open for a COUNTERSTRIKE!",
];

export const HIT_TEMPLATES = [
  "a solid strike connects with",
  "lands a heavy blow to",
  "strikes cleanly against",
  "finds its mark on",
  "slams into",
  "crashes devastatingly into",
  "bites deep into",
  "leaves a brutal wound on",
  "tears flesh from",
  "smashes sickeningly into",
  "draws a terrifying amount of blood from",
  "gouges a ragged furrow across",
  "impacts with bone-jarring force against",
  "delivers a sickening crunch to",
  "punishes the exposed flesh of",
];

export const PARRY_BREAK_TEMPLATES = [
  "%A brings %W crashing through the parry!",
  "%A's force overwhelms the block!",
  "The block is SHATTERED by %A's %W!",
  "%A's %W smashes through the desperate defense!",
  "The raw power of %A's %W forces its way past the guard!",
  "A deafening CLANG echoes as %A's %W violently bypasses the block!",
  "The hasty defense crumples instantly under the sheer weight of %A's %W!",
  "Sparks fly as %A drives %W straight through a crumbling parry!",
  "%A ignores the block entirely, bludgeoning past it with %W!",
  "With brutal momentum, %A breaks the guard using their %W!",
];

export const CROWD_REACTIONS_POSITIVE = [
  "The crowd ROARS in approval!",
  "Cheers erupt from the stands!",
  "The audience leaps to their feet!",
  "A thunderous cheer sweeps the arena!",
  "The crowd howls for more blood!",
];

export const CROWD_REACTIONS_NEGATIVE = [
  "Boos and jeers echo from the arena walls.",
  "The crowd murmurs in disappointment.",
  "Derisive laughter from the high seats.",
  "The audience groans at the clumsy display.",
  "Insults rain down from the disappointed onlookers.",
];

export const CROWD_REACTIONS_ENCOURAGE = [
  "Chants of encouragement begin to build.",
  "The crowd urges the warriors on.",
  "Shouts of support ring out from the pit edge.",
];

export const INI_WIN_TEMPLATES = [
  "%N seizes the initiative!",
  "%N gains the upper hand.",
  "A sudden burst of speed puts %N on the offensive.",
  "%N presses the attack.",
  "%N dictates the deadly tempo of the fight.",
  "%N steals the momentum!",
];

export const INI_KEEP_TEMPLATES = [
  "%N maintains the assault.",
  "%N continues to press the advantage.",
  "Relentless, %N strikes again.",
  "%N refuses to yield the offensive.",
  "Giving his foe no quarter, %N presses on.",
];

export const EXECUTION_TEMPLATES = [
  "%A delivers a brutal execution stroke!",
  "%A shows no mercy, finishing the bout!",
  "The final blow is devastating.",
  "Exploiting %D's exhaustion, %A delivers a fatal, devastating blow with his %W!",
  "With %D's defenses utterly broken, %A executes a horrific attack with his %W!",
  "%D collapses from blood loss as %A lands the final, lethal strike with his %W!",
  "Taking advantage of %D's crippled legs, %A finishes him off with his %W!",
  "%A drives his %W deep into %D's unguarded vitals, ending it instantly!",
  "With a merciless, overwhelming strike from his %W, %A snuffs out %D's life!",
  "%A expertly guides his %W into a lethal opening, ending %D!",
  "%D's armor fails entirely against %A's masterful finish with his %W!",
  "Exhaustion finally breaks %D, and %A ruthlessly capitalizes with their %W!",
  "A sloppy, desperate parry from %D leaves them wide open for %A's final, sickening strike!",
  "%A steps into the failing guard of %D, delivering a merciless death-blow with their %W!",
  "Too tired to dodge, %D takes the full, lethal impact of %A's %W!",
  "With a sickening crunch, %A shatters %D's remaining defense and ends their life!",
  "%A shows no hesitation, using their %W to inflict a catastrophic, fatal wound on %D!",
  "%D's eyes widen in terror as %A's %W claims their life in a spray of crimson!",
  "Fatigue betrays %D, their weapon drooping just long enough for %A to strike the killing blow!",
  "The crowd erupts as %A brutally claims %D's life with a horrific arc of their %W!",
  "Utterly outmatched at the end, %D is violently put down by %A's %W!",
  "With %D's weapon heavy from exhaustion, %A delivers a crushing, fatal blow with their %W!",
  "%D drops their guard, too tired to block, and %A butchers them with a %W!",
  "The relentless assault drains %D completely, leaving them open for %A's lethal %W strike!",
  "Gasping for breath, %D watches helplessly as %A ends it all with a brutal %W swing!",
  "%D's arms fail under the fatigue, and %A ruthlessly caves them in with a %W!",
  "Exhaustion robs %D of their footing, ensuring a horrific death from %A's %W!",
  "Bleeding and completely spent, %D takes the final, obliterating hit from %A's %W!",
];

export const KO_TEMPLATES = [
  "%D collapses, unconscious.",
  "%D goes down hard and doesn't move.",
  "The strike knocks %D senseless.",
  "%D's eyes roll back as he slumps to the blood-soaked sand.",
  "Unable to bear the punishment, %D crumples into darkness.",
];

export const SURRENDER_TEMPLATES = [
  "%D yields to %A.",
  "%D signals surrender.",
  "Unable to continue, %D throws down his weapon.",
  "Bleeding and broken, %D begs for mercy from %A.",
  "%D raises a trembling hand, conceding the bout to %A.",
];

export const FATIGUE_COLLAPSE_TEMPLATES = [
  "%N collapses from sheer exhaustion.",
  "His endurance spent, %N falls to the sand.",
  "Gasping for air, %N's legs give out completely.",
  "%N drops to his knees, utterly drained of energy.",
  "%N's chest heaves violently before they stagger and collapse.",
  "Unable to lift their weapon another inch, %N slumps to the bloodstained floor.",
  "The heavy armor and relentless pace finally drag %N down into unconsciousness.",
  "%N stumbles blindly, completely spent, before crashing face-first into the dirt.",
  "With a final, desperate gasp, %N succumbs to total bodily failure.",
  "Lungs burning and muscles screaming, %N can no longer stand.",
  "%N's vision blurs as exhaustion claims them, sending them face-down in the gore.",
  "Too tired to even bleed, %N collapses in a heap of useless armor.",
  "Every ounce of fight drained, %N drops motionless onto the crimson sand.",
  "Lungs burning and muscles failing, %N crumbles in utter defeat.",
  "Unable to support their own weight, %N folds into unconsciousness.",
  "%N staggers blindly before a total system failure sends them crashing to the floor.",
];

export const TAUNT_TEMPLATES = [
  '"Is that all you have?" sneers %N.',
  '%N laughs. "You fight like a child!"',
  '"Prepare to die," %N hisses.',
  '"I will wear your entrails as a necklace!" %N roars.',
  '"Your stablemaster will weep today!" %N mocks.',
  '"You look tired. Let me end it," %N chuckles.',
];

export const STALEMATE_TEMPLATES = [
  "The warriors circle cautiously.",
  "A moment's pause as both catch their breath.",
  "They trade feints, looking for an opening.",
  "The pace slows as the fighters evaluate the carnage.",
  "Footsteps crunch on the sand as the combatants reassess their strategies.",
];

export const SLASH_ATTACK_TEMPLATES = [
  "slashes his %W at",
  "swings a wide arc at",
  "cuts fiercely at",
  "carves a deadly path with his %W toward",
  "whips his %W in a brutal horizontal slice at",
  "attempts to sever flesh with a vicious slash of his %W toward",
  "sweeps his %W in a lethal, tearing arc toward",
];

export const BASH_ATTACK_TEMPLATES = [
  "bashes heavily with his %W toward",
  "swings a crushing blow at",
  "hammers down on",
  "brings his %W down with bone-shattering force upon",
  "delivers a bludgeoning smash toward",
  "strikes to crush ribs and armor alike with his %W at",
  "hurls the heavy weight of his %W in a devastating, blunt arc at",
];

export const THRUST_ATTACK_TEMPLATES = [
  "thrusts his %W directly at",
  "lunges forward, aiming at",
  "stabs toward",
  "drives his %W forward with lethal intent toward",
  "pierces the distance, lunging his %W at",
];

export const FIST_ATTACK_TEMPLATES = [
  "throws a savage punch at",
  "strikes out with an OPEN HAND at",
  "jabs quickly at",
  "delivers a brutal haymaker toward",
  "drives a crushing fist into",
];

export const GENERIC_ATTACK_TEMPLATES = [
  "attacks with his %W targeting",
  "strikes out at",
  "lashes out with his %W against",
  "unleashes a vicious assault upon",
];
