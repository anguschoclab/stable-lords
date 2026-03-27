/**
 * Thematic random name generators for Stable Lords.
 * Arena-flavored, gritty, fantasy gladiatorial names.
 */

const WARRIOR_NAMES = [

  // Brutal & powerful
  "KRAGOS", "GORLAK", "THUNDRAK", "BREKKA", "MORGUL", "SKARN", "GARVOK",
  "DRAXUS", "KORGAN", "BRUTAG", "IRONJAW", "GROTHAK", "WULFGAR", "BOLVERK",
  "MACEWARD", "HACKER", "BONEBREAKER", "SKULLSMASHER", "GUTRENDER", "FLESHPOUNDER",
  "MARROWCRUNCHER", "GOREFIST", "IRONHIDE", "THUNDERSTOMP", "BEASTJAW", "BLOODCHASER",
  // Agile & cunning
  "SILVANE", "VEXIA", "ASHARA", "THORNE", "DUSKBANE", "FERRIK", "VYREN",
  "KAELIS", "SYRAH", "NYX", "TALYN", "LYSARA", "MIRAEL", "ZEPHYRA",
  "SLIVER", "RAZORDANCE", "QUICKSILVER", "GHOSTSTEP", "VENOMSPIT", "SHADOWDART",
  "SILENTBLADE", "NIGHTSHIV", "CROWSBEAK", "VIPERSWIFT", "BLADEDANCER", "SWIFTCURSE",
  // Dark & mysterious
  "WRAITH", "MORKA", "SHADE", "OBERON", "VHAEL", "RAZIEL", "NOCTIS",
  "REVENANT", "MALAKAI", "SEREN", "GHAEL", "VELKOR", "EREBUS", "ORPHEUS",
  "DEATHBRINGER", "GRAVEWALKER", "SOULRIPPER", "NIGHTTERROR", "DOOMBRINGER", "HELLSPAWN",
  "BONEWEAVER", "SHADOWFIEND", "GRIMVISAGE", "HOLLOWEYE", "DUSKWALKER", "CARRIONBIRD",
  // Arena legends
  "VICTUS", "MAXIMAR", "GLADIUS", "CENTURAX", "SPARTOK", "TYRANNUS",
  "AURELIAN", "PRIMUS", "DECIMUS", "SEVERAK", "CASSIAN", "VALORIAN",
  "CHAMPION", "IMMORTAL", "UNBEATEN", "BLOODLORD", "IRONMASTER", "WARBRINGER",
  "INVINCITUS", "DOMINUS", "SLAUGHTERKING", "ARENAMASTER", "GOLDENHELM", "THE UNDEFEATED",
  // Beast-like
  "FANGMAW", "CLAWREN", "STORMFANG", "BLOODHOWL", "ASHCLAW", "DIREWOLF",
  "SCORPIUS", "VIPERTOOTH", "RAVENMOOR", "HAWKSTEEL", "BEARJAW", "LYNXBLADE",
  "MANTICORE", "GRIFFON", "DRAGONBLOOD", "WOLFHEART", "SERPENTSTRIKE", "TIGERCLAW",
  // Expanded
  "GOREFANG", "DUSKREAPER", "BLOODSPILL", "ASHENWAKE", "GRIMSCAR", "NIGHTSLASH",
  "OATHBREAKER", "CINDERSTRIKE", "TOMBSTONE", "SKULLSPLIT", "GUTSPILLER", "FLESHRENDER",
  "BONECHILL", "DOOMBRASS", "SLAGHEART", "RUSTBLADE", "WARGUT", "IRONCLAW",
  "GRAVEBORN", "DEATHWATCH", "VENOMFANG", "SOULSNARE", "BLOODCRAZED", "PITFIEND",
  // New Additions
  "BLOODSPITE", "IRONFANG", "GRAVEMAKER", "DOOMSCYTHE", "CARRION",
  "SLAKEMAW", "MARROWSTEALER", "GORETIDE", "GRIMTIDE", "SKULLSMASHER", "BONECARVER",
  "MEATHOOK", "GORESPLITTER", "ROTJAW", "SPINECRACKER", "BLIGHTFIST", "MUCKRENDER",
  "GRISTLE", "VILEBLOOD", "HATEFORGED", "HELLTOOTH",
  // Procedural Chronicle Additions
  "GRAVEFEEDER", "BLOODWROUGHT", "ASHSPAWN", "DEATHRATTLE", "IRONHEART",
  "SCARFACE", "GOREBORN", "PLAGUEBRINGER", "NIGHTSTALKER", "WRAITHBONE",
  "CORPSEGRINDER", "HELLBANE", "DUSKBLADE", "SOULEATER", "FLESHWEAVER",
  "BONECHILLER", "SKULLCLEAVER", "VENOMBLOOD", "MUDCRAWLER", "SLUICEGUT",
  // Procedural Chronicle Additions v2
  "ASHBRINGER", "GOREHOUND", "DUSKRENDER", "SKULLDRINKER", "BLOODRUST",
  "DEATHSTROKE", "GRAVESPAWN", "HELLFORGED", "SLAGMOUTH", "FLESHCRAWL",
  "MUDDRINKER", "SPINELESS", "GUTWRENCH", "MEATGRINDER", "SLUICEBLOOD",
  "VENOMSPAWN", "ROTWEAVER",
  // Procedural Chronicle Additions v3
  "GOREWAKE", "GRIMBONE", "ASHENMAW", "BLOODCRAWL", "IRONJAW",
  "SLAGBORN", "GRAVESTONE", "FLESHCHOP", "MUCKSWINE", "BONEGRIND",
  "DEATHMACE", "SHADOWFANG", "SCARRING", "HELLSPIT", "PLAGUEJAW",
  "GUTWOUND", "SLUICEBORN", "VENOMCLAW", "ROTBREATH", "SKULLCLEAVER",
  // Procedural Chronicle Additions v4
  "ASHRENDER", "GOREFANG", "DUSKWEAVER", "SKULLSPLITTER", "BLOODCRAZE",
  "DEATHBRING", "GRAVETIDE", "HELLSPAWN", "SLAGHEART", "FLESHRIPPER",
  "MUDSTOMPER", "SPINEBREAKER", "GUTSPILL", "MEATHAMMER", "SLUICEGORE",
  "VENOMSTRIKE", "ROTBRINGER", "GRIMVISAGE", "BONECHOPPER", "IRONHIDE"
];

const OWNER_FIRST = [
  "Aldric", "Balthazar", "Cassian", "Draven", "Edric",
  "Fenwick", "Gareth", "Hadrian", "Isolde", "Jareth",
  "Kestrel", "Lucian", "Magnus", "Nyx", "Orion",
  "Percival", "Quillan", "Raeburn", "Sigmund", "Theron",
  "Ulric", "Valeria", "Wren", "Xander", "Ysolde",
  "Zephyr", "Alaric", "Brynna", "Corwin", "Dahlia",
  "Elowen", "Florian", "Gwendal", "Helena", "Ingrid",
  "Josian", "Tiberius", "Vespasian", "Lucretia", "Octavian",
  "Domitian", "Agrippa", "Severus", "Aurelia", "Flavius",
  "Pompey", "Crassus", "Sulla", "Vortigern", "Morwenna",
  "Titus", "Galba", "Vane", "Malagar", "Roderick",
  "Gellart", "Thaddeus", "Vesper", "Silas", "Caius",
  "Mordecai", "Darius", "Oric", "Bran", "Kael",
  "Lorcan", "Thalric", "Vergil", "Rurik", "Ignis",
  "Kian", "Morven", "Corvus", "Bram", "Torvald",
  "Ulfric", "Jorah", "Malakor", "Vael", "Thane",
  "Kaelar"
];

const OWNER_LAST = [
  "Blackthorn", "Ironhand", "Ashford", "Stormcrest", "Duskwalker",
  "Grimshaw", "Wolfsblood", "Ravensmoor", "Steelhart", "Goleli",
  "Thornwell", "Darkmore", "Brightforge", "Coldstone", "Wyrmwood",
  "Nighthollow", "Embervale", "Frostborn", "Greymane", "Silverbane",
  "Hawkridge", "Bonecrest", "Firebrand", "Shadowmere", "Bladewell",
  "Bloodworth", "Deathridge", "Gorehound", "Skullcrusher", "Marrowbone",
  "Ironclad", "Steelborn", "Bronzebeard", "Coppervein", "Silverleaf",
  "Graveward", "Grimbane", "Sorrowbring", "Cinderfall", "Rotwood",
  "Blightford", "Grimhollow", "Vileblood", "Slagmore", "Gravewarden",
  "Bloodspiller", "Nightshade", "Ironfoot", "Crow", "Deathweaver",
  "Ashfall", "Hollow", "Vane", "Blackwood", "Bitterstone",
  "Ironblood", "Gravewalker", "Grimscar", "Bloodthorn", "Skullbreaker",
  "Goreblood", "Ironjaw"
];

const STABLE_PREFIXES = [

  "The Iron", "The Blood", "The Shadow", "The Storm", "The Crimson",
  "The Ashen", "The Golden", "The Black", "The Silver", "The Burning",
  "The Steel", "The Dark", "The Scarlet", "The Savage", "The Fallen",
  "The Pale", "The Raging", "The Obsidian", "The Thorned", "The Hollow",
  "The Bone", "The Flesh", "The Skull", "The Death", "The Grave",
  "The Doom", "The Hell", "The Vengeful", "The Wrathful", "The Cursed",
  "The Grinding", "The Bleeding", "The Ruined", "The Shattered", "The Forsaken",
  "The Merciless", "The Unforgiving", "The Putrid", "The Rotting", "The Blighted",
  "The Mangled", "The Slagged", "The Severed",
  // Procedural Chronicle Additions
  "The Decayed", "The Ruinous", "The Pestilent", "The Gilded", "The Rusty",
  "The Mangled", "The Searing", "The Weeping", "The Drowned", "The Frozen",
  // Procedural Chronicle Additions v3
  "The Butcher's", "The Bloodsoaked", "The Slaughtered", "The Severed", "The Putrefied",
  // Procedural Chronicle Additions v4
  "The Cursed", "The Bloodstained", "The Ashen", "The Shattered", "The Ironbound"
];

const STABLE_SUFFIXES = [

  "Wolves", "Fang", "Legion", "Blades", "Talons",
  "Wardens", "Reapers", "Lions", "Hawks", "Pit",
  "Company", "Guard", "Horde", "Serpents", "Ravens",
  "Forge", "Phalanx", "Jackals", "Vipers", "Shields",
  "Crushers", "Breakers", "Renders", "Slayers", "Executioners",
  "Butchers", "Flayers", "Mutilators", "Eviscerators", "Decapitators",
  "Manglers", "Gorehounds", "Scavengers", "Defilers", "Despoilers",
  "Marauders", "Annihilators", "Obliterators", "Ravagers", "Plunderers",
  "Carrion", "Screams", "Guts", "Bones",
  // Procedural Chronicle Additions
  "Swarm", "Fiends", "Wights", "Ghosts", "Terrors",
  "Ghouls", "Beasts", "Monsters", "Demons", "Devils",
  // Procedural Chronicle Additions v3
  "Manglers", "Flayers", "Mutilators", "Eviscerators", "Decapitators",
  // Procedural Chronicle Additions v4
  "Legion", "Reapers", "Vanguards", "Butchers", "Desolators"
];

const STABLE_ALT = [

  "House of Blades", "The Colosseum Elite", "Arena Immortals",
  "Order of the Crimson Sand", "The Bone Collectors",
  "Gladiators of the Ashen Gate", "The Sanguine Brotherhood",
  "Circle of Steel", "The Pitborn", "Scions of the Arena",
  "The Deathless Company", "Lords of the Red Sand",
  "The Unbroken", "Warlords of Dusk", "The Chainbound",
  "Masters of the Pit", "Champions of Blood", "The Gore Soaked",
  "The Flesh Tearers", "The Skull Splitters", "The Bone Breakers",
  "The Blood Drinkers", "The Soul Reapers", "The Death Dealers",
  "The Hell Hounds", "The Doom Bringers", "The Grave Diggers",
  "Cult of the Severed Head", "Brotherhood of the Black Sand",
  "Choir of Screams", "The Iron Maiden's Embrace", "The Bloodied Knuckles",
  "Harbingers of the Final Strike", "The Slaughterhouse Syndicate",
  "Disciples of the Meat Grinder", "The Carrion Crows", "The Abattoir Artisans",
  "The Rotting Chorus", "Choir of the Slaughtered", "The Slag Syndicate",
  "Lords of the Meat Hook",
  // Procedural Chronicle Additions
  "The Flesh Markets", "Guild of the Severed", "Sons of the Pit",
  "Daughters of Ash", "The Bone Syndicate", "Bloodied Sands Collective",
  "The Iron Carousel", "Cult of the Red Stain", "The Slaughter Cult",
  // Procedural Chronicle Additions v3
  "The Flesh Hook Combine", "Guild of the Bleeding Hand", "The Bone Collectors Syndicate",
  "The Ashen Brotherhood", "The Gilded Abattoir",
  // Procedural Chronicle Additions v4
  "Brotherhood of Ash", "The Iron Syndicate", "Cult of the Flayed",
  "Lords of the Pit", "The Crimson Circle"
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
