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
  "bursts a blood vessel in",
  "rips a gruesome tear across",
  "splinters the armor guarding",
  "sends a shockwave of pain through",
  "cleaves viciously into",
  "mangles the unprotected meat of",
  // Procedural Chronicle Additions v3
  "shears agonizingly through the flesh of",
  "batters the bruised, failing guard of",
  "drives deeply into the trembling body of",
  "carves a fresh, bleeding channel across",
  "impacts with a hollow, sickening thud against",
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
  "%A's %W rips the blocking weapon clean out of position!",
  "A terrifying impact from %A's %W shatters the defensive line!",
  "%D's wrists nearly break as %A's %W crushes their parry attempt!",
  "There is no stopping the momentum of %A's %W as it smashes aside the block!",
  // Procedural Chronicle Additions v3
  "The desperate parry crumbles like parchment under %A's %W!",
  "%A's %W simply ignores the fragile block, driving straight through!",
  "A violent clash of steel leaves %D's defense completely open to %A's %W!",
  "%A batters down the weak guard with a brutal sweep of their %W!",
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
  "Utterly exhausted, %D can do nothing as %A violently crushes their skull with a %W!",
  "A horrifying crunch echoes as %A's %W bludgeons the helpless, gasping %D to death!",
  "%A hooks their %W past %D's drooping guard, spilling their life onto the arena floor!",
  "%D collapses, utterly spent, just in time for %A to deliver a merciless coup de grace with their %W!",
  "The heavy, blunt impact of %A's %W shatters %D's ribcage, bringing a gruesome end to the bout!",
  "With %D paralyzed by exhaustion, %A unleashes a savage, dismembering strike with their %W!",
  // Procedural Chronicle Additions v2
  "%D's legs give out from sheer exhaustion, allowing %A to strike down their final defense with a single, sickening blow from their %W!",
  "Sloppy with fatigue, %D drops their guard, and %A ruthlessly ends their life with a sweeping %W strike!",
  "With %D gasping for breath, %A mercilessly obliterates their resistance with a massive swing of their %W!",
  "%A exploits %D's tired, desperate parry, driving their %W deep into %D's exposed vitals!",
  "Unable to lift their weapon any longer, %D is violently put down by %A's relentless %W!",
  "%D's final, exhausted misstep is punished instantly as %A brings them to the ground with a fatal %W blow!",
  "The sheer weight of fatigue breaks %D, and %A ruthlessly ruins their remaining defenses with a %W!",
  "%A extinguishes %D's faltering hope, ending the bout with a brutal, life-ending %W strike!",
  "Too slow to react, %D watches in horror as %A's %W obliterates their remaining defense!",
  "A ragged breath is %D's last, as %A's %W violently tears the life from them!",
  "%A hooks their %W past a drooping guard, spilling %D's life across the arena floor!",
  "With ruthless precision, %A capitalizes on %D's exhaustion, delivering a catastrophic finish with their %W!",
  "%D's armor fails under the relentless punishment, and %A butchers them with a merciless %W!",
  "Fatigue betrays %D entirely, leaving them perfectly exposed for %A's sickening, fatal %W!",
  "%A ends the slaughter, violently destroying %D's body with a perfectly timed %W!",
  "With a sickening, final impact, %A's %W extinguishes %D's life!",
  "%D completely collapses from exhaustion, giving %A the perfect moment to execute them with a %W!",
  "%A's %W finds a gaping seam in %D's tired defense, ending the bout instantly and gruesomely!",
  "Bleeding and unable to move, %D is finally put out of their misery by %A's savage %W!",
  "The crowd falls silent as %A delivers a horrifically brutal execution with their %W upon the exhausted %D!",
  // Procedural Chronicle Additions v3
  "The life drains from %D as %A mercilessly twists their %W into the gaping wound!",
  "%A capitalizes on %D's faltering stance, delivering a bone-shattering finish with their %W!",
  "A spray of crimson paints the sand as %A obliterates %D with a final, massive swing of their %W!",
  "%D gasps their final breath before %A's %W ends their suffering entirely!",
  "Exploiting %D's shattered defense, %A carves out a grisly death with their %W!",
  // Procedural Chronicle Additions v4
  "%A brings their %W down in a grisly arc, completely destroying %D's life!",
  "With %D helpless on the bloody sand, %A delivers a ruthless, life-ending blow with a %W!",
  "%D screams in agony as %A's %W brutally snuffs out their existence!",
  "Exploiting a fatal misstep, %A uses their %W to sheer through %D's faltering defense, securing a gruesome kill!",
  "The life drains from %D as %A mercilessly executes them with a devastating swing of a %W!",
  "A deafening silence falls as %A violently ends the bout by driving their %W straight into %D's vitals!",
  "%A shatters what remains of %D's armor, carving out a bloody finish with their %W!",
  "Utterly exhausted, %D can only watch as %A's %W brings their gruesome end!",
  "%D collapses to their knees just as %A unleashes a merciless, fatal strike with a %W!",
  "A horrifying crunch echoes through the arena as %A crushes %D's life entirely with a brutal %W!"
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
  "A pathetic wheeze escapes %N as their overtaxed heart forces them to the ground.",
  "The overwhelming weight of battle finally breaks %N, dropping them like a stone.",
  "%N throws up blood and bile before surrendering to complete muscular failure.",
  "Legs turning to jelly, %N spirals downward into the dirt, utterly defeated by fatigue.",
  "Weapons clatter as %N's grip fails, their body folding into a limp, exhausted pile.",
  // Procedural Chronicle Additions
  "%N drops their weapon, completely paralyzed by sheer exhaustion.",
  "Lungs screaming and muscles failing, %N crumbles to the bloodstained sand.",
  "The crushing weight of their armor finally drags the exhausted %N into the dirt.",
  "%N's heart gives out from the relentless pace, collapsing them like a puppet with cut strings.",
  "Too fatigued to stand, let alone fight, %N pitches forward onto their face.",
  // Procedural Chronicle Additions v3
  "%N staggers, their arms hanging completely useless from exhaustion.",
  "Utterly spent, %N's knees buckle, bringing them helplessly to the sand.",
  "The weight of the slaughter finally drags %N into total bodily failure.",
  "Choking on dust and their own blood, %N collapses from severe fatigue.",
  // Procedural Chronicle Additions v4
  "%N staggers blindly, totally consumed by the unbearable weight of sheer fatigue.",
  "Choking on dust and exhaustion, %N drops to the bloodstained sand.",
  "Their lungs screaming for air, %N crumbles in a heap of useless armor.",
  "Unable to lift their weapon an inch further, %N spirals into total exhaustion.",
  "The brutal slaughter finally breaks %N, dragging them down into complete unconsciousness."
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
  "drags the razor edge of his %W across the air toward",
  "lashes out with a dismembering swing of his %W at",
  "attempts to open a gaping wound with his %W against",
  // Procedural Chronicle Additions
  "attempts to sever a limb with a sweeping arc of his %W toward",
  "tries to cleanly decapitate",
  "lashes out, hoping to shear through the flesh of",
  "whips his %W in a brutal horizontal slice intended to disembowel",
  "draws his %W across the air, eager to open the throat of",
  // Procedural Chronicle Additions v3
  "attempts to slice %D completely in twain with a brutal sweep of his %W,",
  "lashes out with his %W in a fast, tearing arc hoping to maim",
  "swings a vicious, flesh-parting slash of his %W straight toward",
  // Procedural Chronicle Additions v4
  "swings a wide, dismembering arc of their %W attempting to sever the limbs of",
  "lashes out with their %W in a vicious attempt to open the throat of",
  "draws the razor edge of their %W across the air, hoping to slice open",
  "attempts to shear right through the unarmored flesh of",
  "whips their %W in a brutal, flesh-parting slash aimed straight at"
];

export const BASH_ATTACK_TEMPLATES = [


  "bashes heavily with his %W toward",
  "swings a crushing blow at",
  "hammers down on",
  "brings his %W down with bone-shattering force upon",
  "delivers a bludgeoning smash toward",
  "strikes to crush ribs and armor alike with his %W at",
  "hurls the heavy weight of his %W in a devastating, blunt arc at",
  "swings his %W like a wrecking ball targeting",
  "attempts to pulverize bone with a violent heave of his %W at",
  "drives his %W forward in a heavy, concussive strike toward",
  // Procedural Chronicle Additions
  "swings his %W to completely shatter the defenses of",
  "brings down his %W, seeking to crush the skull of",
  "hurls the immense weight of his %W to pulverize",
  "attempts to shatter the ribcage of",
  "delivers a bone-breaking blow with his %W aimed straight at",
  // Procedural Chronicle Additions v3
  "attempts to shatter the armor and bone beneath with a heavy strike of his %W at",
  "swings his %W with concussive, crushing fury toward",
  "hurls the full, blunt force of his %W attempting to flatten",
  // Procedural Chronicle Additions v4
  "brings down the heavy bulk of their %W aiming to shatter the skull of",
  "swings a concussive, bone-crushing blow with their %W toward",
  "hurls the immense weight of their %W to pulverize the ribcage of",
  "attempts to break every bone in the body of",
  "delivers a bludgeoning, heavy strike of their %W aiming to completely flatten"
];

export const THRUST_ATTACK_TEMPLATES = [


  "thrusts his %W directly at",
  "lunges forward, aiming at",
  "stabs toward",
  "drives his %W forward with lethal intent toward",
  "pierces the distance, lunging his %W at",
  // Procedural Chronicle Additions
  "drives his %W forward to impale",
  "lunges viciously, attempting to spear",
  "thrusts his %W with fatal precision toward the heart of",
  "stabs with lethal intent, hoping to puncture the lung of",
  "drives his %W deep toward the unarmored gaps of",
  // Procedural Chronicle Additions v3
  "aims a deadly, pinpoint thrust of his %W to skewer",
  "lunges violently, attempting to bore his %W through the vitals of",
  "stabs forward with his %W, seeking a fatal puncture on",
  // Procedural Chronicle Additions v4
  "drives their %W forward, aiming a deadly puncture at the heart of",
  "lunges violently, seeking to bore their %W through the exposed vitals of",
  "stabs with lethal intent, hoping to impale",
  "pierces the distance with a pinpoint thrust of their %W toward",
  "drives their %W deep, seeking the vulnerable, unarmored gaps of"
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
