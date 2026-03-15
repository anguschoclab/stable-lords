/**
 * AI Rival Stables — generates and manages the full 24-stable world.
 *
 * Large-world target:
 *   23 AI stables × ~10 warriors = ~230 rostered AI warriors
 *   3-4 trainers per stable = 72-96 trainers
 *   80-120 orphanage/recruit pool
 *
 * Each stable has a unique identity: name, motto, origin, owner personality,
 * coaching philosophy, preferred styles, attribute bias, and themed warrior names.
 */
import { FightingStyle, type Warrior, type Owner, type OwnerPersonality, type MetaAdaptation, type RivalStableData } from "@/types/game";
import { computeWarriorStats } from "./skillCalc";

// ─── Stable Template ──────────────────────────────────────────────────────

export interface StableTemplate {
  stableName: string;
  motto: string;
  origin: string;
  ownerName: string;
  personality: OwnerPersonality;
  philosophy: "Brute Force" | "Speed Kills" | "Iron Defense" | "Balanced" | "Spectacle" | "Cunning" | "Endurance" | "Specialist";
  preferredStyles: FightingStyle[];
  attrBias: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>>;
  warriorNames: string[];
  fameRange: [number, number];
  rosterRange: [number, number];
  tier: "Minor" | "Established" | "Major" | "Legendary";
  trainerRange: [number, number];
  /** How this owner reacts to meta shifts */
  metaAdaptation: MetaAdaptation;
}

// ─── 24 Stable Templates ─────────────────────────────────────────────────

const STABLE_TEMPLATES: StableTemplate[] = [
  // ═══ LEGENDARY (1) ═══
  {
    stableName: "The Eternal Colosseum",
    motto: "We were here before the sand, we will be here after.",
    origin: "The oldest fighting stable in recorded history. Backed by ancient wealth and generational knowledge, they have produced more champions than any other house.",
    ownerName: "Aurelius Dominus",
    personality: "Methodical",
    philosophy: "Balanced",
    preferredStyles: [FightingStyle.ParryRiposte, FightingStyle.WallOfSteel, FightingStyle.StrikingAttack, FightingStyle.AimedBlow],
    attrBias: { ST: 2, CN: 2, WT: 2, WL: 2, SP: 1, DF: 1 },
    warriorNames: ["IMPERATOR", "DOMINUS", "PRAETOR", "CENTURION", "MAXIMUS", "AURELIUS", "LEGATUS", "TRIBUNE", "CONSUL", "DECANUS", "CAESAR", "NERO"],
    fameRange: [6, 10],
    rosterRange: [8, 12],
    tier: "Legendary",
    trainerRange: [4, 5],
    metaAdaptation: "Traditionalist", // Ancient house, sticks to proven methods
  },

  // ═══ MAJOR (5) ═══
  {
    stableName: "The Iron Wolves",
    motto: "Through iron, victory.",
    origin: "Founded in the forge-cities of the northern reaches. The Iron Wolves have dominated arena combat for decades with brutal, no-nonsense fighting.",
    ownerName: "Ragnar Stormborn",
    personality: "Aggressive",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    attrBias: { ST: 3, CN: 2, SZ: 2, WL: 1 },
    warriorNames: ["GROND", "BRUK", "THORVALD", "KRAGOS", "FENRIR", "URSAK", "DROGBA", "IRONJAW", "HAMMERFALL", "BALDUR", "WULFGAR", "KORRIN"],
    fameRange: [4, 7],
    rosterRange: [8, 11],
    tier: "Major",
    trainerRange: [3, 5],
    metaAdaptation: "Traditionalist", // Stubbornly brute force
  },
  {
    stableName: "House of Blades",
    motto: "A thousand cuts, one death.",
    origin: "An aristocratic fighting academy that treats swordsmanship as high art. Technically brilliant and devastatingly precise.",
    ownerName: "Sera Blackthorn",
    personality: "Methodical",
    philosophy: "Cunning",
    preferredStyles: [FightingStyle.AimedBlow, FightingStyle.SlashingAttack, FightingStyle.ParryRiposte],
    attrBias: { WT: 3, DF: 3, SP: 2 },
    warriorNames: ["AZURA", "WHISPER", "SILKBLADE", "RAPIER", "STILETTO", "IRIS", "NEEDLE", "LANCET", "SABRE", "FOIL", "EPEE", "SCALPEL"],
    fameRange: [4, 8],
    rosterRange: [8, 11],
    tier: "Major",
    trainerRange: [3, 5],
    metaAdaptation: "Innovator", // Always seeking new techniques
  },
  {
    stableName: "The Blood Ravens",
    motto: "We feast on the fallen.",
    origin: "A savage consortium from the eastern wastes. They train warriors in kill-or-be-killed conditions, producing terrifyingly aggressive fighters.",
    ownerName: "Cassandra Vex",
    personality: "Aggressive",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.LungingAttack, FightingStyle.BashingAttack, FightingStyle.SlashingAttack],
    attrBias: { ST: 2, SP: 3, WL: 2, DF: 1 },
    warriorNames: ["REAPER", "RAVOK", "BLOODFANG", "CARRION", "TALON", "SCORCH", "HAVOC", "CRIMSON", "MAULER", "DIRGE", "SHRIEK", "CARNAGE"],
    fameRange: [3, 6],
    rosterRange: [8, 11],
    tier: "Major",
    trainerRange: [3, 4],
    metaAdaptation: "MetaChaser", // Chases whatever kills best
  },
  {
    stableName: "Crimson Tide",
    motto: "The sand turns red for us.",
    origin: "A gladiatorial bloodline stretching back generations. Their warriors are raised from childhood to fight and die in the arena.",
    ownerName: "Marcus Vael",
    personality: "Showman",
    philosophy: "Balanced",
    preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.BashingAttack, FightingStyle.ParryRiposte],
    attrBias: { ST: 1, CN: 1, WT: 1, SP: 1, DF: 1, WL: 1 },
    warriorNames: ["TITAN", "MAGNUS", "BRUTUS", "DRAKE", "COLOSSUS", "GLADIUS", "VALKA", "PRIMUS", "ACHILLES", "HECTOR", "AJAX", "PARIS"],
    fameRange: [3, 6],
    rosterRange: [8, 11],
    tier: "Major",
    trainerRange: [3, 5],
    metaAdaptation: "Opportunist", // Flexible, reads the room
  },
  {
    stableName: "The Warlords",
    motto: "War is all we know.",
    origin: "Veterans of a dozen campaigns who brought military discipline to the arena. Every warrior fights as part of a greater strategy.",
    ownerName: "General Tarkus Morn",
    personality: "Tactician",
    philosophy: "Cunning",
    preferredStyles: [FightingStyle.ParryStrike, FightingStyle.ParryLunge, FightingStyle.StrikingAttack],
    attrBias: { WT: 3, WL: 2, CN: 2, ST: 1 },
    warriorNames: ["MARSHAL", "CAPTAIN", "SERGEANT", "VANGUARD", "SCOUT", "RANGER", "ARCHER", "BANNER", "SHIELD", "LANCE", "CADET", "COMMANDER"],
    fameRange: [3, 7],
    rosterRange: [8, 11],
    tier: "Major",
    trainerRange: [3, 5],
    metaAdaptation: "MetaChaser", // Military intelligence — adapts to what works
  },

  // ═══ ESTABLISHED (9) ═══
  {
    stableName: "Golden Lions",
    motto: "Glory above all.",
    origin: "Backed by merchant wealth, the Golden Lions recruit promising orphans and train them in spectacle fighting. Their bouts draw the largest crowds.",
    ownerName: "Helena Cross",
    personality: "Showman",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.LungingAttack],
    attrBias: { SP: 2, DF: 2, WL: 2, WT: 1 },
    warriorNames: ["BLAZE", "TEMPEST", "PHOENIX", "FLASH", "GLORY", "DAZZLE", "REGAL", "CROWN", "LION", "PRIDE", "MANE", "ROAR"],
    fameRange: [2, 5],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Opportunist", // Follows the crowd's taste
  },
  {
    stableName: "Steel Serpents",
    motto: "Strike when they blink.",
    origin: "A secretive guild of counter-fighters. The Serpents excel at reading opponents and punishing mistakes with lethal precision.",
    ownerName: "Theron Darkhollow",
    personality: "Tactician",
    philosophy: "Cunning",
    preferredStyles: [FightingStyle.ParryRiposte, FightingStyle.ParryLunge, FightingStyle.AimedBlow],
    attrBias: { WT: 3, DF: 2, SP: 2, WL: 1 },
    warriorNames: ["PHANTOM", "VENOM", "COIL", "FANG", "MAMBA", "ADDER", "STRIKE", "AMBUSH", "SLEEK", "COBRA", "PYTHON", "KRAIT"],
    fameRange: [2, 5],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Innovator", // Counter-meta specialists
  },
  {
    stableName: "Ash Reapers",
    motto: "From ashes, we rise to reap.",
    origin: "Born from a mining collapse that killed hundreds, the survivors turned to arena combat. Unnaturally tough and fight with desperate ferocity.",
    ownerName: "Borin Ironhand",
    personality: "Pragmatic",
    philosophy: "Endurance",
    preferredStyles: [FightingStyle.TotalParry, FightingStyle.WallOfSteel, FightingStyle.ParryStrike],
    attrBias: { CN: 3, WL: 3, SZ: 1, ST: 1 },
    warriorNames: ["CINDER", "SLAG", "EMBER", "COAL", "FURNACE", "SOOT", "ANVIL", "BELLOWS", "FORGE", "SMELT", "CHAR", "CRUCIBLE"],
    fameRange: [1, 4],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Opportunist", // Will adapt to survive
  },
  {
    stableName: "Storm Breakers",
    motto: "Unstoppable fury.",
    origin: "Coastal raiders turned arena entrepreneurs. Their warriors fight with the reckless abandon of men who've survived the open sea.",
    ownerName: "Yara Nightsong",
    personality: "Aggressive",
    philosophy: "Speed Kills",
    preferredStyles: [FightingStyle.LungingAttack, FightingStyle.SlashingAttack, FightingStyle.StrikingAttack],
    attrBias: { SP: 3, DF: 2, ST: 1, WL: 1 },
    warriorNames: ["BOLT", "STORM", "SURGE", "GALE", "TSUNAMI", "SQUALL", "RIPTIDE", "THUNDER", "WAVE", "CYCLONE", "TYPHOON", "MONSOON"],
    fameRange: [1, 4],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [2, 4],
    metaAdaptation: "MetaChaser", // Aggressive trend followers
  },
  {
    stableName: "The Night Watch",
    motto: "We guard the line between life and death.",
    origin: "Former city guardsmen who protect the streets by day and fight in the arena by night. Disciplined, defensive, and relentless.",
    ownerName: "Captain Orvald Trent",
    personality: "Methodical",
    philosophy: "Iron Defense",
    preferredStyles: [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
    attrBias: { CN: 3, WL: 2, DF: 2, SZ: 1 },
    warriorNames: ["SENTINEL", "WARDEN", "PATROL", "BEACON", "VIGIL", "LOOKOUT", "RAMPART", "BASTION", "BULWARK", "GATEGUARD", "WATCH", "POST"],
    fameRange: [2, 4],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Traditionalist", // Disciplined, never changes
  },
  {
    stableName: "Thunder Guard",
    motto: "Hear us and tremble.",
    origin: "Mountain warriors who train at high altitude. Their endurance and lung capacity give them a decisive edge in long bouts.",
    ownerName: "Korvin Stonereach",
    personality: "Pragmatic",
    philosophy: "Endurance",
    preferredStyles: [FightingStyle.WallOfSteel, FightingStyle.StrikingAttack, FightingStyle.BashingAttack],
    attrBias: { CN: 3, WL: 3, ST: 2 },
    warriorNames: ["RUMBLE", "QUAKE", "TREMOR", "ROAR", "CRACK", "BOOM", "ECHO", "CLAP", "CRASH", "ROLL", "PEAL", "VOLT"],
    fameRange: [2, 5],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Opportunist", // Pragmatic, will shift if needed
  },
  {
    stableName: "The Bone Crushers",
    motto: "Break them first. Break them again.",
    origin: "Pit fighters from the slums who specialize in overwhelming force. Crude but effective — they never stop swinging.",
    ownerName: "Gretta Hardfist",
    personality: "Aggressive",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.LungingAttack],
    attrBias: { ST: 4, SZ: 3, CN: 1 },
    warriorNames: ["CRUSH", "SMASH", "BLUDGEON", "WRECK", "MAUL", "DEMOLISH", "SHATTER", "PUMMEL", "POUND", "RAM", "BATTER", "IMPACT"],
    fameRange: [1, 4],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [2, 4],
    metaAdaptation: "MetaChaser", // Wants whatever kills fastest
  },
  {
    stableName: "Scarlet Masquerade",
    motto: "Behind every mask, a killer.",
    origin: "Theatrical fighters who blend performance art with lethal combat. They fight in ornate masks, and no one knows their true faces.",
    ownerName: "Madame Isolde Vane",
    personality: "Showman",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.ParryRiposte, FightingStyle.SlashingAttack, FightingStyle.AimedBlow],
    attrBias: { DF: 3, SP: 2, WT: 2, WL: 1 },
    warriorNames: ["MASQUE", "JESTER", "HARLEQUIN", "MIMIC", "PUPPET", "JEST", "RUSE", "GUISE", "FARCE", "PLOY", "FEINT", "ACT"],
    fameRange: [2, 5],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "Innovator", // Always reinventing their act
  },
  {
    stableName: "Blackwater Company",
    motto: "Everyone has a price. Ours is blood.",
    origin: "A mercenary outfit that moved into arena fighting for the purse money. Pragmatic, ruthless, and well-organized.",
    ownerName: "Darius Kord",
    personality: "Pragmatic",
    philosophy: "Specialist",
    preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.ParryStrike, FightingStyle.AimedBlow],
    attrBias: { ST: 2, WT: 2, DF: 2, WL: 1 },
    warriorNames: ["MERC", "BOUNTY", "HIRE", "CONTRACT", "MARK", "TARGET", "ASSET", "HANDLER", "BROKER", "LEDGER", "COIN", "DEBT"],
    fameRange: [1, 4],
    rosterRange: [7, 10],
    tier: "Established",
    trainerRange: [3, 4],
    metaAdaptation: "MetaChaser", // Follows the money / what wins
  },

  // ═══ MINOR (8) ═══
  {
    stableName: "Obsidian Fang",
    motto: "One bite is all it takes.",
    origin: "A new stable run by a former champion. Small but dangerous — every warrior is hand-picked for killer instinct.",
    ownerName: "Rook Ashvale",
    personality: "Pragmatic",
    philosophy: "Specialist",
    preferredStyles: [FightingStyle.StrikingAttack, FightingStyle.AimedBlow, FightingStyle.ParryStrike],
    attrBias: { ST: 2, WT: 2, DF: 2, WL: 1 },
    warriorNames: ["ONYX", "RAZOR", "CLAW", "SHARD", "OBSIDIAN", "FLINT", "JET", "BASALT", "SLATE", "GRANITE", "PUMICE", "AGATE"],
    fameRange: [0, 3],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Opportunist", // Former champion reads the field
  },
  {
    stableName: "Dawn Hammers",
    motto: "We break what cannot be broken.",
    origin: "Religious zealots who believe combat is divine communion. Their warriors fight with fanatical determination and refuse to yield.",
    ownerName: "Aldric Wolfsbane",
    personality: "Methodical",
    philosophy: "Iron Defense",
    preferredStyles: [FightingStyle.WallOfSteel, FightingStyle.TotalParry, FightingStyle.ParryStrike],
    attrBias: { CN: 3, WL: 3, SZ: 2 },
    warriorNames: ["PIKE", "PHALANX", "AEGIS", "TOWER", "MONOLITH", "PILLAR", "FORTRESS", "CITADEL", "KEEP", "WALL", "GATE", "MOAT"],
    fameRange: [0, 2],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Traditionalist", // Zealots never change
  },
  {
    stableName: "Shadow Company",
    motto: "You won't see us coming.",
    origin: "Former assassins and thieves who found the arena more profitable. Fast, dirty, and unpredictable.",
    ownerName: "Livia Ashford",
    personality: "Tactician",
    philosophy: "Speed Kills",
    preferredStyles: [FightingStyle.AimedBlow, FightingStyle.ParryLunge, FightingStyle.LungingAttack],
    attrBias: { SP: 3, DF: 3, WT: 2 },
    warriorNames: ["GHOST", "WRAITH", "MIRAGE", "SHADE", "DUSK", "GLOOM", "HAZE", "SPECTRE", "BLINK", "VOID", "MURK", "PALL"],
    fameRange: [0, 2],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Innovator", // Assassins adapt and counter
  },
  {
    stableName: "Frost Giants",
    motto: "Cold is the grave we dig for you.",
    origin: "Mountain warriors from the frozen north. Enormous and terrifyingly strong, they rely on raw power and size to overwhelm.",
    ownerName: "Petra Steelheart",
    personality: "Pragmatic",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel],
    attrBias: { SZ: 4, ST: 3, CN: 2 },
    warriorNames: ["GLACIER", "MAMMOTH", "TUNDRA", "PERMAFROST", "AVALANCHE", "ICECAP", "YETI", "FJORD", "BERG", "HAIL", "FLOE", "SLEET"],
    fameRange: [0, 3],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Innovator", // Big and constantly trying weird builds
  },
  {
    stableName: "Red Dust Wanderers",
    motto: "The desert teaches patience. And killing.",
    origin: "Nomadic desert fighters who drift from arena to arena. Lean, sun-hardened, and impossible to tire out.",
    ownerName: "Hakim Sandwalker",
    personality: "Methodical",
    philosophy: "Endurance",
    preferredStyles: [FightingStyle.TotalParry, FightingStyle.ParryRiposte, FightingStyle.WallOfSteel],
    attrBias: { WL: 3, CN: 3, SP: 1, DF: 1 },
    warriorNames: ["DUNE", "MIRAGE", "OASIS", "SCIMITAR", "SANDSTORM", "SCORPION", "SIROCCO", "DUST", "MESA", "CACTUS", "ARID", "NOMAD"],
    fameRange: [0, 2],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Opportunist", // Scavenges what works
  },
  {
    stableName: "The Hollow Men",
    motto: "We have nothing left to lose.",
    origin: "Death-row convicts given a second chance through combat. They fight with nothing to lose and everything to prove.",
    ownerName: "Warden Jax Corvin",
    personality: "Aggressive",
    philosophy: "Brute Force",
    preferredStyles: [FightingStyle.BashingAttack, FightingStyle.LungingAttack, FightingStyle.StrikingAttack],
    attrBias: { ST: 3, WL: 3, CN: 1 },
    warriorNames: ["CONVICT", "CHAIN", "SHACKLE", "LOCKJAW", "GALLOWS", "FELON", "PAROLE", "CELL", "BARS", "BRAND", "EXILE", "OUTCAST"],
    fameRange: [0, 2],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "MetaChaser", // Desperate — will try anything that works
  },
  {
    stableName: "Gilded Thorns",
    motto: "Beautiful and deadly.",
    origin: "An elite stable funded by noble patrons who want to see artistry in combat. Their warriors train in both dance and swordsmanship.",
    ownerName: "Lord Vesper Aureline",
    personality: "Showman",
    philosophy: "Spectacle",
    preferredStyles: [FightingStyle.SlashingAttack, FightingStyle.ParryRiposte, FightingStyle.AimedBlow],
    attrBias: { DF: 3, SP: 3, WT: 1, WL: 1 },
    warriorNames: ["PETAL", "BRIAR", "THORN", "BLOOM", "ORCHID", "NETTLE", "THISTLE", "ROSE", "VINE", "IVY", "LAUREL", "BLOSSOM"],
    fameRange: [0, 3],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Innovator", // Artistic experimentation
  },
  {
    stableName: "Ironback Syndicate",
    motto: "Business is war. War is business.",
    origin: "A criminal syndicate that uses arena fighting as a front. Their warriors are well-funded, well-equipped, and expendable.",
    ownerName: "Don Salvatore Brex",
    personality: "Pragmatic",
    philosophy: "Balanced",
    preferredStyles: [FightingStyle.ParryStrike, FightingStyle.StrikingAttack, FightingStyle.WallOfSteel],
    attrBias: { ST: 1, CN: 2, WT: 2, WL: 1, DF: 1 },
    warriorNames: ["BOSS", "MUSCLE", "GOON", "THUG", "FIXER", "HEAVY", "BRUTE", "KNUCKLE", "CLEAVER", "ENFORCER", "RACKET", "HOOD"],
    fameRange: [1, 3],
    rosterRange: [6, 9],
    tier: "Minor",
    trainerRange: [2, 3],
    metaAdaptation: "Opportunist", // Crime boss follows the money
  },
];

// ─── RNG ──────────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// ─── Attribute Generation ─────────────────────────────────────────────────

function biasedAttrs(
  rng: () => number,
  bias: Partial<Record<"ST" | "CN" | "SZ" | "WT" | "WL" | "SP" | "DF", number>>
): { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number } {
  const attrs = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
  let pool = 70 - 21;
  const keys: (keyof typeof attrs)[] = ["ST", "CN", "SZ", "WT", "WL", "SP", "DF"];

  const weightedKeys: (keyof typeof attrs)[] = [];
  for (const k of keys) {
    const w = (bias[k] ?? 1);
    for (let i = 0; i < w; i++) weightedKeys.push(k);
  }

  while (pool > 0) {
    const key = weightedKeys[Math.floor(rng() * weightedKeys.length)];
    const max = Math.min(pool, 25 - attrs[key]);
    if (max <= 0) continue;
    const add = Math.min(max, Math.floor(rng() * 4) + 1);
    attrs[key] += add;
    pool -= add;
  }
  return attrs;
}

// ─── Trainer Generation ───────────────────────────────────────────────────

interface StableTrainer {
  id: string;
  name: string;
  tier: "Novice" | "Seasoned" | "Master";
  focus: "Aggression" | "Defense" | "Endurance" | "Mind" | "Healing";
  fame: number;
  contractWeeksLeft: number;
  stableId: string;
}

const TRAINER_FIRST_NAMES = [
  "Aldric", "Brenna", "Caius", "Dara", "Eryx", "Fenna", "Galthor", "Hessa",
  "Ivor", "Jelena", "Korvin", "Lysa", "Maegor", "Nira", "Orvald", "Petra",
  "Quintus", "Rhea", "Soren", "Thessa", "Ulric", "Vala", "Wyrd", "Xara",
  "Balthus", "Calla", "Dorin", "Elara", "Finn", "Gwynn", "Hugo", "Ingrid",
  "Jasper", "Kira", "Lars", "Marta", "Niall", "Olwen", "Percival", "Rowena",
  "Sigurd", "Talia", "Urien", "Vidar", "Wynn", "Ysolde", "Zara", "Brann",
  "Cedric", "Dagny", "Emeric", "Freya", "Gareth", "Helga", "Idris", "Jorah",
  "Kellan", "Lona", "Merrick", "Nessa", "Otto", "Priya", "Ragna", "Sable",
];

const PHILOSOPHY_TO_FOCUS: Record<string, ("Aggression" | "Defense" | "Endurance" | "Mind" | "Healing")[]> = {
  "Brute Force": ["Aggression", "Aggression", "Endurance"],
  "Speed Kills": ["Aggression", "Mind", "Endurance"],
  "Iron Defense": ["Defense", "Defense", "Endurance"],
  "Balanced": ["Aggression", "Defense", "Mind", "Endurance"],
  "Spectacle": ["Aggression", "Mind", "Healing"],
  "Cunning": ["Mind", "Mind", "Defense"],
  "Endurance": ["Endurance", "Endurance", "Healing"],
  "Specialist": ["Aggression", "Defense", "Mind"],
};

function generateStableTrainers(
  rng: () => number,
  stableId: string,
  philosophy: string,
  count: number,
  usedNames: Set<string>,
  tier: string
): StableTrainer[] {
  const trainers: StableTrainer[] = [];
  const focusPool = PHILOSOPHY_TO_FOCUS[philosophy] ?? ["Aggression", "Defense", "Mind"];

  for (let i = 0; i < count; i++) {
    let firstName: string;
    let attempts = 0;
    do {
      firstName = TRAINER_FIRST_NAMES[Math.floor(rng() * TRAINER_FIRST_NAMES.length)];
      attempts++;
    } while (usedNames.has(firstName) && attempts < 100);
    usedNames.add(firstName);

    const focus = focusPool[Math.floor(rng() * focusPool.length)];
    const tierRoll = rng();
    const trainerTier: "Novice" | "Seasoned" | "Master" =
      tier === "Legendary" ? (tierRoll < 0.3 ? "Master" : "Seasoned") :
      tier === "Major" ? (tierRoll < 0.2 ? "Master" : tierRoll < 0.6 ? "Seasoned" : "Novice") :
      tier === "Established" ? (tierRoll < 0.1 ? "Master" : tierRoll < 0.5 ? "Seasoned" : "Novice") :
      tierRoll < 0.4 ? "Seasoned" : "Novice";

    const focusTitles: Record<string, string[]> = {
      Aggression: ["the Fierce", "Blade-Breaker", "the Relentless"],
      Defense: ["Shield-Born", "the Unyielding", "Iron Wall"],
      Endurance: ["the Tireless", "Long-Wind", "Stone-Heart"],
      Mind: ["the Cunning", "Keen-Eye", "the Strategist"],
      Healing: ["the Mender", "Bone-Setter", "Salve-Hand"],
    };
    const titles = focusTitles[focus] ?? ["the Unknown"];
    const title = titles[Math.floor(rng() * titles.length)];

    trainers.push({
      id: `trainer_${stableId}_${i}`,
      name: `${firstName} ${title}`,
      tier: trainerTier,
      focus,
      fame: trainerTier === "Master" ? 5 : trainerTier === "Seasoned" ? 3 : 1,
      contractWeeksLeft: 52,
      stableId,
    });
  }
  return trainers;
}

// ─── Public Interface ─────────────────────────────────────────────────────

export interface RivalStable {
  owner: Owner;
  roster: Warrior[];
  template: StableTemplate;
  trainers: StableTrainer[];
}

export function getStableTemplates(): StableTemplate[] {
  return [...STABLE_TEMPLATES];
}

/**
 * Generate rival stables from templates.
 * @param count Number of stables (max 23 AI stables)
 * @param seed Deterministic seed
 */
export function generateRivalStables(count: number, seed: number): RivalStable[] {
  const rng = seededRng(seed);
  const usedWarriorNames = new Set<string>();
  const usedTrainerNames = new Set<string>();
  const rivals: RivalStable[] = [];

  // Shuffle templates
  const shuffled = [...STABLE_TEMPLATES].sort(() => rng() - 0.5);

  // Tier-balanced selection: all Legendary first, then Majors, Established, Minor
  const legendary = shuffled.filter(t => t.tier === "Legendary");
  const majors = shuffled.filter(t => t.tier === "Major");
  const established = shuffled.filter(t => t.tier === "Established");
  const minors = shuffled.filter(t => t.tier === "Minor");

  const picked: StableTemplate[] = [];
  for (const t of legendary) { if (picked.length < count) picked.push(t); }
  for (const t of majors) { if (picked.length < count) picked.push(t); }
  for (const t of established) { if (picked.length < count) picked.push(t); }
  for (const t of minors) { if (picked.length < count) picked.push(t); }

  for (let i = 0; i < Math.min(count, picked.length); i++) {
    const tmpl = picked[i];
    const stableId = `rival_${i}`;

    const owner: Owner = {
      id: stableId,
      name: tmpl.ownerName,
      stableName: tmpl.stableName,
      fame: tmpl.fameRange[0] + Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)),
      renown: tmpl.tier === "Legendary" ? 5 : tmpl.tier === "Major" ? 2 : 0,
      titles: tmpl.tier === "Legendary" ? 2 + Math.floor(rng() * 3) : tmpl.tier === "Major" ? Math.floor(rng() * 3) : 0,
      personality: tmpl.personality,
      metaAdaptation: tmpl.metaAdaptation,
      favoredStyles: tmpl.preferredStyles,
    };

    // Generate warriors — target ~10 per stable
    const [minR, maxR] = tmpl.rosterRange;
    const warriorCount = minR + Math.floor(rng() * (maxR - minR + 1));
    const warriors: Warrior[] = [];
    const namePool = [...tmpl.warriorNames].sort(() => rng() - 0.5);

    for (let j = 0; j < warriorCount; j++) {
      let wName: string | undefined;
      for (const n of namePool) {
        if (!usedWarriorNames.has(n)) { wName = n; break; }
      }
      if (!wName) wName = `${tmpl.stableName.split(" ").pop()?.toUpperCase()}_${j}`;
      usedWarriorNames.add(wName);

      // 70% chance of preferred style
      let style: FightingStyle;
      if (rng() < 0.7 && tmpl.preferredStyles.length > 0) {
        style = tmpl.preferredStyles[Math.floor(rng() * tmpl.preferredStyles.length)];
      } else {
        const styles = Object.values(FightingStyle);
        style = styles[Math.floor(rng() * styles.length)];
      }

      const attrs = biasedAttrs(rng, tmpl.attrBias);
      const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);

      const startingWins = tmpl.tier === "Legendary" ? 3 + Math.floor(rng() * 8) :
                           tmpl.tier === "Major" ? Math.floor(rng() * 6) :
                           tmpl.tier === "Established" ? Math.floor(rng() * 3) : 0;
      const startingLosses = tmpl.tier === "Legendary" ? Math.floor(rng() * 4) :
                              tmpl.tier === "Major" ? Math.floor(rng() * 3) :
                              tmpl.tier === "Established" ? Math.floor(rng() * 2) : 0;
      const startingKills = tmpl.tier === "Legendary" && rng() > 0.5 ? 1 + Math.floor(rng() * 2) :
                             tmpl.tier === "Major" && rng() > 0.7 ? 1 : 0;

      warriors.push({
        id: `rival_w_${i}_${j}`,
        name: wName,
        style,
        attributes: attrs,
        baseSkills,
        derivedStats,
        fame: Math.floor(rng() * (tmpl.fameRange[1] - tmpl.fameRange[0] + 1)) + tmpl.fameRange[0],
        popularity: Math.floor(rng() * 5),
        titles: [],
        injuries: [],
        flair: [],
        career: { wins: startingWins, losses: startingLosses, kills: startingKills },
        champion: false,
        status: "Active",
        age: 17 + Math.floor(rng() * 10),
        stableId,
      });
    }

    // Generate trainers
    const [minT, maxT] = tmpl.trainerRange;
    const trainerCount = minT + Math.floor(rng() * (maxT - minT + 1));
    const trainers = generateStableTrainers(rng, stableId, tmpl.philosophy, trainerCount, usedTrainerNames, tmpl.tier);

    rivals.push({ owner, roster: warriors, template: tmpl, trainers });
  }

  return rivals;
}

/** Pick a random eligible rival warrior for matchmaking (works with serialized RivalStableData) */
export function pickRivalOpponent(
  rivals: RivalStableData[],
  excludeNames: Set<string>
): { rival: RivalStableData; warrior: Warrior } | null {
  const eligible: { rival: RivalStableData; warrior: Warrior }[] = [];
  for (const r of rivals) {
    for (const w of r.roster) {
      if (w.status === "Active" && !excludeNames.has(w.name) && !excludeNames.has(w.id)) {
        eligible.push({ rival: r, warrior: w });
      }
    }
  }
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}
