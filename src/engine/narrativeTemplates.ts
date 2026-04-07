/**
 * Stable Lords — Narrative Templates
 * Imported by narrativePBP.ts for in-fight commentary.
 *
 * Placeholders:
 *   %N / %A = named actor (attacker / winner)
 *   %D       = defender / loser
 *   %W       = weapon display name
 */

// ─── Intro ───────────────────────────────────────────────────────────────────

export const ARMOR_INTRO_VERBS = [
  "will wear a fine, well-oiled suit of",
  "will wear",
  "has been given a suit of",
  "has chosen to wear finely crafted",
  "is checking the straps of his",
  "has drawn on a suit of",
  "has put on a suit of",
  "is clad in",
  "strides out armored in",
  "enters the arena dressed in",
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
  "holds a %W loosely at his side",
  "spins a %W in lazy arcs",
  "plants a %W point-first in the sand and waits",
  "kisses the flat of his %W before raising it",
];

// ─── Battle Openers ──────────────────────────────────────────────────────────

export const BATTLE_OPENERS = [
  "The stench of old blood rises as the fighters step onto the sand.",
  "The crowd bays for blood as the combatants lock eyes.",
  "Steel is drawn, and the roar of the coliseum becomes deafening!",
  "The battle begins amid the crowd's approval.",
  "Those in the stands shift their attention to the warriors.",
  "The audience falls silent as the dueling begins.",
  "The audience rises as the fighting begins.",
  "The warriors advance on each other.",
  "The time for the fight has come.",
  "The signal is given for the duel to begin.",
  "The battle begins.",
  "The crowd watches intently as the warriors square off.",
  "A brutal cheer rises as the combatants face each other.",
  "The scent of old blood fills the air as the bout commences.",
  "Anticipation grips the arena as the duel gets underway.",
  "The LORD PROTECTORS signal the start — the crowd explodes.",
  "A hush falls. Then the ARENAMASTER drops his hand, and steel is drawn.",
  "The sand is still. The air is not. The crowd's roar swells.",
  "Drums. A single horn. The two warriors begin.",
  "The fighters circle once — then steel meets steel.",
  "The crowd has been waiting for this. So have the fighters.",
  "The arena holds its breath as the warriors close the distance.",
  "Every eye is on the sand as the bout begins.",
];

// ─── Defense ─────────────────────────────────────────────────────────────────

export const PARRY_TEMPLATES = [
  "deflects the blow with his %W.",
  "parries with a twist of his %W.",
  "knocks the incoming strike aside with his %W.",
  "blocks the attack effortlessly.",
  "sweeps the attack away using his %W.",
  "catches the vicious swing on the flat of his %W.",
  "turns the strike aside with a screech of steel on his %W.",
  "barely gets his %W up in time — the block holds.",
  "bats the strike aside with his %W, stepping off the line.",
  "traps the blade against his %W and redirects it away.",
  "parries cleanly, his %W firm and unwavering.",
  "pivots and uses his %W to guide the blow past his body.",
  "absorbs the strike on his %W with his whole forearm behind it.",
  "dips his %W under the attack and flicks it wide.",
  "turns the blow aside with a sharp rotation of his %W.",
  "beats the incoming weapon away with a sharp tap of his %W.",
];

export const PARRY_SHIELD_TEMPLATES = [
  "catches the blow on his SHIELD.",
  "blocks the strike with a raised SHIELD.",
  "interposes his SHIELD.",
  "angles his SHIELD to deflect the attack.",
  "absorbs the impact entirely with his SHIELD.",
  "raises his SHIELD just in time to catch the blow.",
  "plants his SHIELD and takes the strike on its face.",
  "rolls the blow off the rim of his SHIELD.",
  "hunches behind his SHIELD and lets it take the punishment.",
  "steps into the strike and catches it dead-center on his SHIELD.",
  "uses his SHIELD like a wall, stopping the blow cold.",
  "punches his SHIELD forward to intercept the attack mid-arc.",
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
  "weaves out of range at the last possible moment.",
  "fades back — the weapon grazes air.",
  "drops his shoulder and dips under the arc.",
  "sidesteps cleanly, letting the blow pass.",
  "rolls his hips away from the swing — barely in time.",
  "backs out of range with a quick shuffle of his feet.",
  "pivots on his back foot and lets the weapon whistle past.",
  "sways just far enough that steel finds only air.",
  "ducks and spins away from the attack, circling back to position.",
  "reads the attack early and is already moving before the blow lands.",
];

export const COUNTERSTRIKE_TEMPLATES = [
  "%N twists inside the attack and launches a COUNTERSTRIKE!",
  "%N parries and IMMEDIATELY strikes back!",
  "A sudden opening — %N exploits it with a COUNTERSTRIKE!",
  "Exploiting the overextension, %N delivers a rapid COUNTERSTRIKE!",
  "%N bats the attack aside, leaving his foe open for a COUNTERSTRIKE!",
  "%N flows around the strike and answers with a sharp COUNTERSTRIKE!",
  "The attack opens a gap — %N does not hesitate to punish it!",
  "A textbook RIPOSTE from %N — the crowd can feel it!",
  "%N retreats just enough, then drives straight back in with a COUNTERSTRIKE!",
  "Using his foe's momentum against him, %N launches a COUNTERSTRIKE!",
  "%N deflects and retaliates before his opponent can recover!",
  "The missed strike costs dearly — %N answers with a punishing COUNTER!",
];

// ─── Initiative ───────────────────────────────────────────────────────────────

export const INI_WIN_TEMPLATES = [
  "%N seizes the initiative!",
  "%N gains the upper hand.",
  "A sudden burst of speed puts %N on the offensive.",
  "%N presses the attack.",
  "%N dictates the deadly tempo of the fight.",
  "%N steals the momentum!",
  "%N gets inside his opponent's timing!",
  "%N surges forward — his foe is caught flat-footed!",
  "%N takes control of the exchange!",
  "%N's read of the fight is razor sharp — he moves first.",
  "The initiative is %N's — he wastes no time using it.",
  "%N finds the rhythm and takes over.",
  "First to move, %N claims the advantage.",
  "%N crowds his opponent and takes charge.",
  "%N's footwork brings him inside before his foe can set.",
];

// ─── Hits ────────────────────────────────────────────────────────────────────

export const HIT_TEMPLATES = [
  "tears a ghastly gouge across %D's %L",
  "leaves a sickening, pulsing wound on %D's %L",
  "shatters armor and bone alike, devastating %D's %L",
  "impacts with the sickening sound of snapping bone on %D's %L",
  "carves a spray of crimson from %D's %L",
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
  "rips a gruesome tear across",
  "sends a shockwave of pain through",
  "cleaves viciously into",
  "shears agonizingly through the flesh of",
  "drives deeply into the trembling body of",
  "carves a fresh bleeding channel across",
  "impacts with a hollow thud against",
  "rends bone and sinew from",
  "punishes the exhausted frame of",
  "carves a jagged bleeding ruin out of",
  "leaves a horrifying gushing wound on",
  "crushes the fragile bone structure of",
  "carves a gruesome fatal-looking tear across",
  "bites horrifyingly deep into the flesh of",
  "lays open a savage cut across",
  "hammers a punishing blow into",
  "opens a bleeding gash along",
  "catches cleanly on the exposed side of",
  "scores a direct hit on",
  "snaps into the unguarded",
  "finds the gap and drives home against",
  "rattles bone and flesh on",
  "leaves a mark that will be felt for days on",
  "drives the breath from",
  "flattens the guard and crashes into",
  "connects with a wet sickening sound on",
  "opens up a nasty cut on",
  "thunders into",
  "delivers a horrifying, bone-splintering impact to",
  "paints the arena sand red with a brutal strike to",
  "makes a sickening crunch as %W bites into",
  "shears clean through the armor, punishing the exposed",
];

// ─── Parry Breaks ────────────────────────────────────────────────────────────

export const PARRY_BREAK_TEMPLATES = [
  "%A brings %W crashing through the parry!",
  "%A's force overwhelms the block!",
  "The block is SHATTERED by %A's %W!",
  "%A's %W smashes through the desperate defense!",
  "The raw power of %A's %W forces its way past the guard!",
  "A deafening CLANG echoes as %A's %W violently bypasses the block!",
  "The hasty defense crumples under the sheer weight of %A's %W!",
  "Sparks fly as %A drives %W straight through a crumbling parry!",
  "%A ignores the block entirely, bludgeoning past it with %W!",
  "With brutal momentum, %A breaks the guard using %W!",
  "%A's %W rips the blocking weapon clean out of position!",
  "A terrifying impact from %A's %W shatters the defensive line!",
  "There is no stopping the momentum of %A's %W — it smashes aside the block!",
  "The desperate parry crumbles like parchment under %A's %W!",
  "%A's %W simply ignores the fragile block, driving straight through!",
  "%A batters down the weak guard with a brutal sweep of %W!",
  "Sparks shower the sand as %A violently clears the guard with %W!",
  "%A forces the blade aside with sheer terrifying strength using %W!",
  "A horrifying crunch resounds as %A's %W breaks through the parry!",
  "The desperate parry is obliterated by the terrifying weight behind %A's %W!",
  "A deafening crash of steel on steel as %A's %W ruthlessly batters down the failing guard!",
  "%A hammers through the block — the defense never stood a chance against %W!",
  "The parry folds. %A's %W passes through as if the guard were not there.",
  "%A finds the angle and levers %W past the desperate block!",
  "The block is late. %A's %W is not.",
  "A groan of bending steel as %A's %W overwhelms the parry!",
  "%A's %W plows straight through the middle of the defense!",
  "The guard buckles under %A's relentless pressure with %W!",
  "Too little, too late — %A's %W punches past the raised defense!",
  "%A twists %W at the last moment and threads it past the parry!",
  "The strength behind %A's %W is simply too much to contain!",
  "A shocking display of raw force! %A shatters the defense with %W!",
  "%A's %W bites straight through the desperate parry!",
  "The parry crumbles under a devastating blow from %A's %W!",
];

// ─── Crowd ────────────────────────────────────────────────────────────────────

export const CROWD_REACTIONS_POSITIVE = [
  "The crowd ROARS in approval!",
  "Cheers erupt from the stands!",
  "The audience leaps to their feet!",
  "A thunderous cheer sweeps the arena!",
  "The crowd howls for more blood!",
  "The arena shakes with approval!",
  "A wave of noise rolls through the crowd!",
  "The spectators go wild!",
  "PANDEMONIUM in the stands!",
  "The crowd is on their feet and screaming!",
  "A mighty roar from ten thousand throats!",
  "The whole arena erupts at once!",
  "Ecstatic screaming from the upper tiers!",
  "The pit crowd surges forward — they loved that!",
  "Whistles, stamps, and roaring approval fill the air!",
  "The mob screams for blood, electrified by the display!",
  "A deafening roar of pure adrenaline shakes the coliseum!",
];

export const CROWD_REACTIONS_NEGATIVE = [
  "Boos and jeers echo from the arena walls.",
  "The crowd murmurs in disappointment.",
  "Derisive laughter from the high seats.",
  "The audience groans at the clumsy display.",
  "Insults rain down from the disappointed onlookers.",
  "A chorus of boos rolls around the arena.",
  "The crowd is not impressed.",
  "Scattered laughter and catcalls from the stands.",
  "The audience has seen better. They make sure everyone knows it.",
  "A wave of disdain from the crowd — they expected more.",
  "The stands go cold. This is not what they came to see.",
  "Slow, sarcastic clapping from the upper rows.",
  "A groan of disappointment ripples through the crowd.",
];

export const CROWD_REACTIONS_ENCOURAGE = [
  "Chants of encouragement begin to build.",
  "The crowd urges the warriors on.",
  "Shouts of support ring out from the pit edge.",
  "The crowd finds a fallen favorite and roars them forward!",
  "A section of the crowd begins to chant a warrior's name.",
  "The whole arena is willing that warrior to survive!",
  "Stomping feet. Clapping hands. The crowd pushes them on.",
  "The roar of the crowd becomes a lifeline.",
  "A wave of noise from the crowd — pure encouragement.",
  "They are not ready to see this warrior fall. The crowd shows it.",
  "The crowd's chant fills the arena: DON'T — GIVE — UP!",
  "The spectators are screaming for a comeback!",
];

// ─── Bout-End Templates ───────────────────────────────────────────────────────

export const KO_TEMPLATES = [
  "%D collapses, unconscious.",
  "%D goes down hard and doesn't move.",
  "The strike knocks %D senseless.",
  "%D's eyes roll back as he slumps to the blood-soaked sand.",
  "Unable to bear the punishment, %D crumples into darkness.",
  "%D's legs go out from under him and he crashes to the sand, out cold.",
  "The blow turns out %D's lights — he hits the ground and stays there.",
  "%D is out before he lands.",
  "A hollow crack — %D drops like a felled tree.",
  "The sand catches %D as he folds into unconsciousness.",
  "%D sways, then collapses. The crowd knows he won't rise.",
  "%D's body shuts down. He is down and he is done.",
  "One clean shot. %D never saw it coming. He is finished.",
  "%D tips forward and hits the sand face-first, out cold.",
  "%D crumbles in stages — first the knees, then the rest.",
];
