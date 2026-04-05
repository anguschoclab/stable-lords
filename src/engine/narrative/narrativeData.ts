import { FightingStyle } from "@/types/game";

/**
 * Stable Lords — Canonical Narrative Data
 */

export const HIT_LOC_VARIANTS: Record<string, string[]> = {
  "head":      ["HEAD", "JAW", "TEMPLE", "FOREHEAD", "SKULL", "FACE", "THROAT", "NECK", "side of the HEAD", "CHEEK", "BROW"],
  "chest":     ["CHEST", "RIBS", "RIGHT RIBCAGE", "LEFT RIBCAGE", "upper BODY", "BREAST", "STERNUM", "COLLARBONE"],
  "abdomen":   ["STOMACH", "ABDOMEN", "PELVIS", "KIDNEYS", "GROIN", "BELLY", "LOWER BODY", "SOLAR PLEXUS", "MIDSECTION"],
  "right arm": ["RIGHT ARM", "RIGHT FOREARM", "RIGHT BICEPS", "RIGHT ELBOW", "RIGHT HAND", "RIGHT WRIST", "RIGHT SHOULDER"],
  "left arm":  ["LEFT ARM", "LEFT FOREARM", "LEFT BICEPS", "LEFT ELBOW", "LEFT HAND", "LEFT WRIST", "LEFT SHOULDER"],
  "right leg": ["RIGHT LEG", "RIGHT THIGH", "RIGHT KNEE", "RIGHT SHIN", "RIGHT BUTTOCKS", "RIGHT HIP", "RIGHT CALF"],
  "left leg":  ["LEFT LEG", "LEFT THIGH", "LEFT KNEE", "LEFT SHIN", "LEFT HIP", "LEFT CALF"],
};

export const STYLE_PBP_DESC: Record<FightingStyle, string> = {
  [FightingStyle.AimedBlow]:      "fights with cold, surgical precision — a devotee of the AIMED BLOW",
  [FightingStyle.BashingAttack]:  "relies on raw crushing power, built for the BASHING ATTACK",
  [FightingStyle.LungingAttack]:  "is an aggressive charger, committed to the LUNGING ATTACK",
  [FightingStyle.ParryLunge]:     "is a patient counter-fighter who favors the PARRY-LUNGE",
  [FightingStyle.ParryRiposte]:   "lives and dies by the blade's edge — a master of PARRY-RIPOSTE",
  [FightingStyle.ParryStrike]:    "uses a disciplined defensive game, striking through openings — PARRY-STRIKE",
  [FightingStyle.SlashingAttack]: "fights in a wide, sweeping style — the fearsome SLASHING ATTACK",
  [FightingStyle.StrikingAttack]: "brings heavy, direct power to bear with the STRIKING ATTACK",
  [FightingStyle.TotalParry]:     "presents an iron fortress of defense, committed to TOTAL PARRY",
  [FightingStyle.WallOfSteel]:    "never stops pressing — the relentless, overwhelming WALL OF STEEL",
};

export const HELM_DESCS: Record<string, string[]> = {
  "leather_cap": ["LEATHER CAP", "battered LEATHER CAP"],
  "steel_cap":   ["STEEL CAP", "etched STEEL CAP", "dented STEEL CAP"],
  "helm":        ["HELM", "spectacular HELM", "visored HELM", "scarred HELM"],
  "full_helm":   ["FULL HELM", "fearsome FULL HELM", "imposing FULL HELM"],
};

export type WeaponType = "slash" | "bash" | "thrust" | "fist" | "generic";

export const ATTACK_TEMPLATES: Record<WeaponType, string[]> = {
  slash: [
    "%N slashes with his %W!",
    "%N slashes an arcing attack with his %W!",
    "%N whips his %W blade back and forth as if to slash his foe to ribbons!",
    "%N makes a slashing attack using his %W!",
    "%N ducks low, his %W slicing suddenly upwards!",
    "%N makes a brilliant twisting slash with his %W!",
    "%N times a cunning attack, %W leaping with deadly force!",
    "%N's %W lunges with awesome cutting power!",
    "%N whirls and strikes backhandedly with his %W!",
    "%N drives his %W in a forward slash!",
    "%N leaps into the air, taking a furious slash with his %W!",
    "%N leaps forward, swinging his %W into a veritable wall of blades!",
    "%N's %W flashes as he takes a sudden vicious slash at his foe!",
    "%N snaps a fast, horizontal cut with his %W!",
    "%N feints, then whips his %W in a vicious diagonal!",
    "%N throws a rising slash with his %W, low to high!",
    "%N pivots on his heel, driving his %W in a tight, brutal backhand!",
    "%N commits to a wide sweeping arc with his %W!",
    "%N steps inside and rips his %W across at close range!",
    "%N drops his shoulder and drives a savage upward cut with his %W!",
  ],
  bash: [
    "%N bashes with his %W!",
    "%N smashes downward with his %W!",
    "%N takes a swipe with his %W!",
    "%N bats murderously at his foe with his %W!",
    "%N throws his full weight behind his %W in an all-out assault!",
    "%N attacks, whirling the %W with tremendous force!",
    "%N cleverly tries to break his foe's defense with his %W!",
    "%N swings his %W with deadly intent at the target!",
    "%N whips his %W downward in a vicious power smash!",
    "%N steps in and brings his %W crashing down with both hands!",
    "%N winds up and unleashes a thunderous swing with his %W!",
    "%N drives his %W forward in a short, crushing punch!",
    "%N hammers a savage overhand blow with his %W!",
    "%N crashes his %W in from the side, aiming for the ribs!",
    "%N heaves his %W in a wild, momentum-heavy arc!",
  ],
  thrust: [
    "%N lunges wielding an %W!",
    "%N thrusts with his %W!",
    "%N lunges forward with his %W!",
    "%N stabs powerfully upward with his %W!",
    "%N uses his %W to make a deadly jab at his foe!",
    "%N unleashes his %W in a piercingly accurate thrust!",
    "%N strikes forward with his %W, all his weight behind the blow!",
    "%N thrusts his %W forward with an unbelievably deadly force!",
    "%N feints, then springs viciously forward with his %W!",
    "%N catapults forward, %W stabbing cruelly at his foe!",
    "%N leaps into an incredible flesh-splitting lunge with his %W!",
    "%N lunges forward, %W thrusting with incredible speed and accuracy!",
    "%N dives forward, %W stabbing repeatedly with his charge!",
    "%N snaps his arm straight, driving his %W at the gap in his foe's guard!",
    "%N shifts his weight and explodes forward with his %W!",
    "%N launches a controlled, perfectly balanced lunge with his %W!",
    "%N spins his wrist and drives his %W in a twisting thrust!",
    "%N drops into a low crouch and rockets his %W upward!",
  ],
  fist: [
    "%N PUNCHES from the waist with unbelievable quickness!",
    "%N throws a rock-fisted PUNCH of incredible felling power!",
    "%N hammers down with a ferocious FOREARM smash!",
    "%N focuses all of his power into a devastating KICK!",
    "%N's HANDS flash forward jabbing fiercely at his surprised foe!",
    "%N attacks, FISTS punching with piston-like horse-felling power!",
    "%N throws a piston-like SIDE KICK at his opponent!",
    "%N dives forward, FISTS driving at his opponent with menacing fury!",
    "%N attacks his foe with a pinpoint-accurate ELBOW!",
    "%N snaps a wicked HEADBUTT at his reeling foe!",
    "%N dips and drives a rising UPPERCUT from the floor!",
    "%N spins and delivers a savage HEEL KICK at his opponent!",
    "%N launches a rapid COMBINATION — jab, cross, body shot!",
  ],
  generic: [
    "%N strikes using his %W!",
    "%N makes an attack with his %W!",
    "%N strikes forward with his %W!",
    "%N lashes out with his %W!",
    "%N presses with his %W!",
    "%N unleashes a fierce strike with his %W!",
  ],
};

// ─── Mastery & Soul-Bond Templates ──────────────────────────────────────────

export const MASTERY_TEMPLATES: Record<string, string[]> = {
  slash: [
    "%N's blade moves with a soul-bonded precision, a perfect arc of steel!",
    "%N guides his edge with unnatural fluidity — the weapon an extension of his own spirit.",
    "A masterful stroke! %N's %W sings through the air in a perfect rhythmic dance.",
    "%N flows into a mastered slash, the steel flickering like a silver flame.",
    "The %W becomes a part of %N — the cut arrives before the thought.",
    "%N's wrist snaps with the effortless authority of ten thousand practice cuts.",
    "The crowd feels it. Something in the quality of that slash — it belongs to a master.",
  ],
  bash: [
    "%N delivers a crushing blow with the perfect weight of his mastered %W!",
    "The impact is heavy and true — %N wields his %W with the absolute leverage of a master.",
    "%N's %W descends with the rhythmic thunder of a soul-bound strike!",
    "Force and technique collide as %N hammers home a flawless mastered strike.",
    "No wasted motion — %N's %W finds the mark with horrible mechanical certainty.",
    "%N's entire body becomes a battering ram, the %W merely the point of impact.",
    "The weight behind that strike is inhuman — %N's mastery of the %W is complete.",
  ],
  thrust: [
    "%N's %W flickers like a serpent's tongue, a mastered thrust of absolute lethality!",
    "With a master's intuition, %N drives the point of his %W through the smallest gap.",
    "%N's steel finds the rhythm of the soul, a piercing strike of lightning speed!",
    "The %W is a needle in %N's hands, guided by a bond beyond simple training.",
    "%N's thrust arrives not where his foe is — but where his foe will be.",
    "A decade of lunges compressed into one instant — %N's %W strikes with terrifying precision.",
    "The crowd catches its breath. That was not a lucky hit. That was mastery.",
  ],
  fist: [
    "%N's hands move in a mastered blur, the rhythm of a true brawler!",
    "A strike of pure intuition! %N's fists find the mark with soul-bound power.",
    "%N's movements are liquid and lethal, his very body a mastered weapon.",
    "The rhythm of the street and the soul — %N's fists are a blur of perfect technique.",
    "%N hits without telegraphing, without hesitation — the strike simply appears.",
    "There is no wasted motion in %N's hands. Each impact is placed with terrible purpose.",
    "The crowd can barely track his hands. %N has crossed into something beyond training.",
  ]
};

export const SUPER_FLASHY_TEMPLATES: string[] = [
  "✨ A DIVINE STRIKE! %N's soul and steel are one — a golden flicker of absolute mastery! ✨",
  "✨ THE HEAVENS WATCH! %N delivers a legendary blow, his %W pulsing with a golden aura! ✨",
  "✨ UNSTOPPABLE! %N's %W finds the soul-rhythm — a strike that will be sung of for ages! ✨",
  "✨ GOLDEN FURY! %N's mastery is absolute, his %W crushing all before it! ✨",
  "✨ PERFECT FORM! The crowd falls silent, awed by the terrifying beauty of %N's technique! ✨",
  "✨ A STRIKE OUT OF LEGEND! %N transcends the merely skilled — this is art! ✨",
];

export const INI_FEINT_TEMPLATES = [
  "%N feints a high line, drawing his opponent out of position.",
  "%N shows the blade, but it's a clever ruse!",
  "A masterful feint by %N — his opponent bites on the fake!",
  "%N uses a rhythmic twitch to freeze his enemy for a split second.",
  "%N's eyes flick one way, his weapon goes another!",
  "%N shimmers forward then back, forcing an early commitment from his foe.",
  "A false step from %N throws his opponent's timing completely.",
  "%N's hips twist to open the line — his opponent reads it wrong!",
  "%N feints the body, goes high — his foe bought every bit of it.",
  "%N draws back as if to parry, then strikes!",
];

export const EVEN_STATUS = [
  "The warriors appear equal in skill.",
  "The battle is too close to tell.",
  "The warriors appear evenly matched.",
  "There is no decisive victor here yet.",
  "Neither fighter is able to establish a clear advantage.",
  "The sand is stained by both, and neither yields.",
  "The crowd can't call it — the fight hangs perfectly in the balance.",
  "An even exchange — neither warrior gains the upper hand.",
  "Every attack is matched, every blow answered.",
  "The two warriors seem carved from the same hard stone.",
  "The bout could go either way. The crowd senses it.",
  "No quarter given. None taken. The sand says nothing yet.",
  "Both men are bleeding. Neither will admit it matters.",
  "The fighters are locked in step — reading each other, waiting.",
];

export const KILL_TEMPLATES = [
  "%D falls to their knees, their life spilling onto the sands. %A stands victorious!",
  "The match concludes in horrific fashion as %D is butchered by %A!",
  "With no mercy shown, %A ends %D's misery in a spray of crimson!",
  "The Lords of the Arena nod in approval as %A violently ends the life of %D.",
  "%D is gravely injured!\n%A delivers the killing blow!",
  "%D crumples to the ground, lifeless.\n%A's strike was unerring and final.",
  "%D falls to the arena floor. The wound is mortal.\nSilence grips the crowd.",
  "%D stumbles to the ground!!!\n%D is slain!",
  "%D's armor fails entirely beneath %A's merciless execution!",
  "The arena holds its breath as %A violently ends %D's life in the crimson sand!",
  "%D is severed from the mortal coil by a perfectly placed killing stroke from %A!",
  "%A turns the bout into a slaughter, claiming a gruesome and total victory over %D!",
  "With a terrifying display of lethal force, %A leaves %D lifeless and broken!",
  "%D pitches forward into the sand. He will not rise again.\n%A claims the kill.",
  "A final, dreadful silence falls. %A stands. %D does not.",
  "The crowd goes quiet as %D folds to the earth — the blow was absolute.",
  "%D's struggle ends here. %A delivers a death blow with cold finality.",
  "There is no coming back from that. %A has ended %D.",
  "The arena erupts — %A has killed in spectacular and brutal fashion!",
  "The LORD PROTECTORS turn away. %A has won with terrible completeness.",
  "%D makes one final sound — then nothing. %A has done their worst.",
  "The killing blow lands. The crowd's roar drowns out everything else.",
];

export const STOPPAGE_TEMPLATES = [
  "%D motions to the LORD PROTECTORS that he cannot continue!\n%A is the victor of the match!",
  "%D is stopped by an outcry from the LORD PROTECTORS!\n%A has won the duel!",
  "%D accepts his loss, jaw clenched to keep from admitting his pain!\n%A is the victor!",
  "%D compliments his victorious foe on a good fight.\n%A has won the duel!",
  "%D surrenders, and offers his hand to his foe.\n%A is the victor of the match!",
  "The ARENAMASTER steps in. %D cannot continue.\n%A is declared the winner!",
  "%D's seconds throw in the cloth. %A takes the bout!",
  "The fight is waved off — %D has taken too much punishment.\n%A wins!",
  "%D raises a trembling hand. The crowd respects the honesty.\n%A wins the bout.",
  "The ARENAMASTER signals the end. %D is done. %A claims the victory.",
  "%D goes to one knee. He cannot answer the count.\n%A wins!",
  "Bleeding badly, %D shakes his head at the corner. %A is declared victor.",
];

export const EXHAUSTION_TEMPLATES = [
  "%D can no longer keep fighting. Both warriors are spent.\n%A is awarded the bout on points.",
  "Neither warrior can continue! The Arenamaster awards the bout to %A.",
  "Both fighters have given everything. The sand claims them both, but %A had the better of it.",
  "Gasping, arms heavy, %D finally concedes. %A is the winner by exhaustion.",
  "The bout grinds to a halt — neither warrior has anything left. %A edges it on count.",
  "Two empty vessels stand in the sand. The ARENAMASTER points to %A.",
  "Fatigue wins the fight for %A. The bout ends not with a strike, but a surrender to the body.",
  "The crowd is breathless. So are the fighters. %A wins on accumulated punishment.",
  "%D's legs simply stop working. %A, barely upright himself, is called the winner.",
  "It was never going to be pretty. %A just had a little more left than %D.",
];

export const POPULARITY_TEMPLATES = {
  great:    "%N's popularity has greatly increased!",
  normal:   "%N's popularity has increased.",
  marginal: "%N's popularity has marginally increased.",
};

export const SKILL_LEARNS = [
  "%N learned an ATTACK skill.",
  "%N learned a PARRY skill.",
  "%N learned a DEFENSIVE action.",
  "%N learned an INITIATIVE routine.",
  "%N learned a RIPOSTE technique.",
  "%N learned a DECISIVENESS concept.",
  "%N picked up a new ATTACK combination.",
  "%N has developed a sharper PARRY instinct.",
  "%N learned to read an opponent's INITIATIVE better.",
  "%N refined a RIPOSTE timing he hadn't noticed before.",
  "%N internalized a new DEFENSIVE footwork pattern.",
  "%N studies how his last ATTACK landed and adjusts.",
];

export const TRADING_BLOWS = [
  "The two warriors fiercely trade attacks and parry.",
  "Both attack, weapons strike and rebound, strike and rebound.",
  "The warriors attack together, almost grappling with each other.",
  "The weapons lock together in a struggle for supremacy.",
  "The weapons lock together in a test of strength.",
  "A ferocious exchange — blow for blow, neither budging.",
  "Steel meets steel in a furious, close-quarters storm!",
  "The crowd is on their feet as the warriors trade punishing blows!",
  "An ugly brawl in the sand — both warriors land, both warriors feel it.",
  "The fighters batter at each other in a grim war of attrition.",
  "No grace here — just two men trying to outlast each other.",
  "The sound of impact after impact fills the arena. Neither man retreats.",
  "They hammer at each other like rivals who have waited years for this.",
  "A savage exchange at close range — both fighters staggered but upright.",
];

export const STALEMATE_LINES = [
  "The fighters slowly circle each other, looking for a weakness.",
  "The fighters step back from each other for a moment.",
  "The action comes to a halt as the warriors reorient themselves.",
  "The warriors stand quietly and study each other.",
  "A tense pause — both men catching their breath and reading the other.",
  "The crowd murmurs as the fighters circle, neither willing to commit.",
  "A moment of stillness descends on the arena sand.",
  "Both warriors have tested each other. Now they wait.",
  "The fighters feint and probe, neither willing to overcommit.",
  "A long beat of silence before the storm resumes.",
  "Boots scrape sand as both fighters reset their stances.",
  "The arena quiets. Everyone can feel the next exchange coming.",
];

export const WINNER_TAUNTS = [
  "%N roars, 'Who else wants to die today?!'",
  "%N wipes the blood from their face and sneers, 'Too easy.'",
  "%N points their weapon at the VIP box and bows deeply.",
  "%N kicks the fallen opponent and laughs maniacally.",
  "%N says, 'Another blow and I'll send you to Ahringol!'",
  "%N says, 'And that is how a real warrior fights. Pay attention next time.'",
  "%N says, 'That was a well fought, and honorable fight.'",
  "%N laughs, 'Oh, this is PRICELESS! Did someone actually tell you you could FIGHT?'",
  "%N growls, 'Are you even human?'",
  "%N grates, 'Try that again, dog!'",
  "%N salutes the audience, then offers a hand to his fallen foe.",
  "%N says nothing. He just looks down at his beaten opponent for a long moment.",
  "%N spits sand and raises his weapon to the roaring crowd.",
  "%N wipes blood from his face and says, 'Not bad. Almost.'",
  "%N addresses the crowd directly, arms wide, soaking in their adulation.",
  "%N steps over his defeated foe and walks to the center of the arena.",
  "%N says, 'Next time, bring someone who can actually hurt me.'",
  "%N sheathes his weapon slowly and deliberately, back already turned.",
  "%N calls out to no one in particular, 'Who else wants to try?'",
  "%N breathes hard for a moment, then straightens and smiles.",
  "%N raises a fist to the crowd, blood still on his knuckles.",
];

export const LOSER_TAUNTS = [
  "%N spits, 'May maggots partake of your corpse as they have with your ancestors!'",
  "%N exclaims, 'Give it up now, wimp, before I rip your face off!'",
  "%N bellows his frustration.",
  "%N mutters a desperate prayer!",
  "%N reels with the fury of combat!",
  "%N howls like a maddened beast!",
  "%N spits blood and refuses to look away.",
  "%N grits his teeth and squares up for another exchange.",
  "%N curses under his breath, circling again.",
  "%N screams in defiance at the crowd.",
  "%N shakes his head and tries to clear the pain from his eyes.",
  "%N roars something wordless at his foe.",
  "%N stumbles but refuses to go down.",
  "%N spits, 'Is that the best you have?'",
];

export const PRESSING_TEMPLATES = [
  "Our brawny gladiator is pressing his foe to the limit!",
  "%N can't believe that this guy has not surrendered!",
  "%N fights with the cunning of desperation!",
  "%N presses the attack relentlessly, giving his foe no room to breathe!",
  "%N smells blood — he presses harder now!",
  "%N has his opponent on the back foot and will not let up!",
  "%N advances, step by relentless step, forcing his foe toward the edge!",
  "%N is relentless — he won't give his opponent a moment to recover!",
];

export const INSIGHT_ST_HINTS = [
  "His parry shatters under your monstrous strength!",
  "Your blade meets staggering resistance — his strength is undeniable.",
  "He carelessly bats away your strike with raw power.",
  "The raw strength in his arms is alarming — your weapon nearly flies free.",
  "He shoves your guard aside like it isn't there. Pure animal strength.",
  "You feel it in your bones — this man is frighteningly powerful.",
];

export const INSIGHT_SP_HINTS = [
  "His sluggish movements fail to catch your swift strike.",
  "He moves with blinding speed, leaving you swinging at shadows.",
  "Your reflexes seem barely enough to keep up with his pace.",
  "He's faster than he looks — the strike comes from nowhere.",
  "A flicker of movement — that's all the warning you get.",
  "You can feel his reactions starting to lag. He's slowing down.",
];

export const INSIGHT_DF_HINTS = [
  "He clumsily overextends, leaving himself wide open.",
  "His flawless footwork and deft parry leave you bewildered.",
  "His clumsy defense makes him an easy target.",
  "There's a nervousness to his guard — he's not comfortable here.",
  "His defense is a wall of steel. You haven't found the crack yet.",
  "He barely moves to avoid you. His reading of your attacks is unsettling.",
];

export const INSIGHT_WL_HINTS = [
  "Despite the punishment, his iron will keeps him standing.",
  "He seems to waver, his resolve breaking under your assault.",
  "There's fear in his eyes now. He knows how this ends.",
  "He is not done. Not yet. That look says everything.",
  "He's bleeding and hurting, but there's something burning in his eyes.",
  "You see the moment he decides — he will not go down without a fight.",
];
