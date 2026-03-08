/**
 * Thematic random name generators for Stable Lords.
 * Arena-flavored, gritty, fantasy gladiatorial names.
 */

const WARRIOR_NAMES = [
  // Brutal & powerful
  "KRAGOS", "GORLAK", "THUNDRAK", "BREKKA", "MORGUL", "SKARN", "GARVOK",
  "DRAXUS", "KORGAN", "BRUTAG", "IRONJAW", "GROTHAK", "WULFGAR", "BOLVERK",
  // Agile & cunning
  "SILVANE", "VEXIA", "ASHARA", "THORNE", "DUSKBANE", "FERRIK", "VYREN",
  "KAELIS", "SYRAH", "NYX", "TALYN", "LYSARA", "MIRAEL", "ZEPHYRA",
  // Dark & mysterious
  "WRAITH", "MORKA", "SHADE", "OBERON", "VHAEL", "RAZIEL", "NOCTIS",
  "REVENANT", "MALAKAI", "SEREN", "GHAEL", "VELKOR", "EREBUS", "ORPHEUS",
  // Arena legends
  "VICTUS", "MAXIMAR", "GLADIUS", "CENTURAX", "SPARTOK", "TYRANNUS",
  "AURELIAN", "PRIMUS", "DECIMUS", "SEVERAK", "CASSIAN", "VALORIAN",
  // Beast-like
  "FANGMAW", "CLAWREN", "STORMFANG", "BLOODHOWL", "ASHCLAW", "DIREWOLF",
  "SCORPIUS", "VIPERTOOTH", "RAVENMOOR", "HAWKSTEEL", "BEARJAW", "LYNXBLADE",
];

const OWNER_FIRST = [
  "Aldric", "Balthazar", "Cassian", "Draven", "Edric", "Fenwick",
  "Gareth", "Hadrian", "Isolde", "Jareth", "Kestrel", "Lucian",
  "Magnus", "Nyx", "Orion", "Percival", "Quillan", "Raeburn",
  "Sigmund", "Theron", "Ulric", "Valeria", "Wren", "Xander",
  "Ysolde", "Zephyr", "Alaric", "Brynna", "Corwin", "Dahlia",
  "Elowen", "Florian", "Gwendal", "Helena", "Ingrid", "Josian",
];

const OWNER_LAST = [
  "Blackthorn", "Ironhand", "Ashford", "Stormcrest", "Duskwalker",
  "Grimshaw", "Wolfsblood", "Ravensmoor", "Steelhart", "Goleli",
  "Thornwell", "Darkmore", "Brightforge", "Coldstone", "Wyrmwood",
  "Nighthollow", "Embervale", "Frostborn", "Greymane", "Silverbane",
  "Hawkridge", "Bonecrest", "Firebrand", "Shadowmere", "Bladewell",
];

const STABLE_PREFIXES = [
  "The Iron", "The Blood", "The Shadow", "The Storm", "The Crimson",
  "The Ashen", "The Golden", "The Black", "The Silver", "The Burning",
  "The Steel", "The Dark", "The Scarlet", "The Savage", "The Fallen",
  "The Pale", "The Raging", "The Obsidian", "The Thorned", "The Hollow",
];

const STABLE_SUFFIXES = [
  "Wolves", "Fang", "Legion", "Blades", "Talons",
  "Wardens", "Reapers", "Lions", "Hawks", "Pit",
  "Company", "Guard", "Horde", "Serpents", "Ravens",
  "Forge", "Phalanx", "Jackals", "Vipers", "Shields",
];

const STABLE_ALT = [
  "House of Blades", "The Colosseum Elite", "Arena Immortals",
  "Order of the Crimson Sand", "The Bone Collectors",
  "Gladiators of the Ashen Gate", "The Sanguine Brotherhood",
  "Circle of Steel", "The Pitborn", "Scions of the Arena",
  "The Deathless Company", "Lords of the Red Sand",
  "The Unbroken", "Warlords of Dusk", "The Chainbound",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomWarriorName(): string {
  return pick(WARRIOR_NAMES);
}

export function randomOwnerName(): string {
  return `${pick(OWNER_FIRST)} ${pick(OWNER_LAST)}`;
}

export function randomStableName(): string {
  // 40% chance of alt-style name, 60% prefix+suffix
  if (Math.random() < 0.4) {
    return pick(STABLE_ALT);
  }
  return `${pick(STABLE_PREFIXES)} ${pick(STABLE_SUFFIXES)}`;
}
