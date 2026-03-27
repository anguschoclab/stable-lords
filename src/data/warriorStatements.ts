/**
 * Stable Lords — Canonical Warrior Statements
 * Wit (good & bad), Quickness, Coordination, and Endurance statements
 * from Terrablood's Duel II archives.
 *
 * Sources:
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/good-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/bad-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/endurance-wit-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/warrior-quickness-statements/
 *   https://terrablood.com/duel-ii-formerly-known-as-duelmasters/coordination-statements/
 */

import type { BaseSkills } from "@/types/game";
import { computeCoordination, computeActivityRating, type CoordinationRating, type ActivityRating } from "./terrabloodCharts";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WarriorOverviewStatements {
  initiative: string;
  riposte: string;
  attack: string;
  parry: string;
  defense: string;
  endurance: string;
  coordination: string;
  quickness: string;
  activity: string;
}

// ─── Good Wit Statements (WT > 7) ──────────────────────────────────────────
// Each category has high-order and low-order variants based on base skill value.
// Threshold determines which statement text to use.

type StatementEntry = { minBase: number; text: string };

function pickStatement(entries: StatementEntry[], baseValue: number): string {
  for (const e of entries) {
    if (baseValue >= e.minBase) return e.text;
  }
  return entries[entries.length - 1].text;
}

// GOOD WIT: INITIATIVE (1st statement)
const GOOD_INI_HIGH: StatementEntry[] = [ // base >= 13
  { minBase: 28, text: "Drowns his opponent in a relentless tide of crushing aggression" },
  { minBase: 27, text: "Forces a suffocating, lethal rhythm onto the blood-soaked sands" },
  { minBase: 26, text: "Unleashes an avalanche of strikes that shatters all defensive lines" },
  { minBase: 26, text: "Bends the chaos of the pit to his will, forcing foes to fight on his terms" },
  { minBase: 25, text: "Dominates the arena with an overwhelming wave of terrifying pressure" },
  { minBase: 25, text: "A terrifying maestro of battle tempo, dictating every bloody exchange" },
  { minBase: 24, text: "Crushes his enemy's resolve with a relentless, brutal cadence" },
  { minBase: 24, text: "Summons a storm of steel that leaves no room to breathe" },
  { minBase: 23, text: "Traps their prey in a vicious, unbreakable cycle of parry and retreat" },
  { minBase: 23, text: "Relentlessly forces his enemies into deadly, suffocating corners" },
  { minBase: 22, text: "A predator in the pit, suffocating their prey with relentless advances" },
  { minBase: 21, text: "Brilliant at keeping his foes off balance" },
  { minBase: 20, text: "Commands the slaughter with grim, unwavering authority" },
  { minBase: 20, text: "Seizes the momentum with bone-breaking certainty" },
  { minBase: 19, text: "Orchestrates the slaughter with predatory anticipation" },
  { minBase: 18, text: "Dictates a savage pace that leaves foes gasping for survival" },
  { minBase: 17, text: "Nothing short of a genius at keeping his foes at swords point" },
  { minBase: 16, text: "Pushes the pace of combat with vicious, unyielding pressure" },
  { minBase: 15, text: "Steals the center of the pit and refuses to yield a single step" },
  { minBase: 15, text: "Nothing short of a genius at keeping his foes off balance and in trouble" },
  { minBase: 14, text: "Smothers enemy momentum before it can even spark" },
  { minBase: 13, text: "Has learned very well how to keep his foe in trouble" },
  { minBase: 12, text: "Pushes forward with the grim certainty of an executioner" },
  { minBase: 0, text: "Has learned how to keep his foe in trouble" },
];
const GOOD_INI_LOW: StatementEntry[] = [ // base 8-12
  { minBase: 26, text: "Commands the flow of carnage before his opponent can even raise their steel" },
  { minBase: 25, text: "Explodes into action, leaving ruined flesh in his wake" },
  { minBase: 24, text: "Seizes the bloody initiative with horrifying speed" },
  { minBase: 23, text: "Moves with the cold purpose of an executioner" },
  { minBase: 22, text: "Forces a deadly tempo the moment steel is drawn" },
  { minBase: 21, text: "Never wastes a moment or is indecisive" },
  { minBase: 20, text: "Is an absolute terror in setting the pace of carnage" },
  { minBase: 19, text: "Seizes the lethal opening before the crowd even breathes" },
  { minBase: 18, text: "Pounces on weakness like a starved wolf" },
  { minBase: 18, text: "Never hesitates to press the advantage when blood is drawn" },
  { minBase: 17, text: "Seldom hesitates, moves instantly if given an opportunity" },
  { minBase: 16, text: "Steps firmly into the bloody rhythm of the arena" },
  { minBase: 15, text: "With a very aggressive and clever fighting style" },
  { minBase: 14, text: "A brutal opportunist who never lingers on the defensive" },
  { minBase: 13, text: "Has learned to be a decisive and quick fighter" },
  { minBase: 12, text: "Rushes the gap with vicious, undeniable intent" },
  { minBase: 11, text: "Claims the center of the pit like a ravenous beast" },
  { minBase: 10, text: "Presses the attack with cold, calculating brutality" },
  { minBase: 9, text: "Steals the breath from his foe before the first strike lands" },
  { minBase: 8, text: "Advances with an unnatural, predatory swiftness" },
  { minBase: 0, text: "Has learned how to be decisive and quick" },
];

// GOOD WIT: RIPOSTE (2nd statement)
const GOOD_RIP_HIGH: StatementEntry[] = [ // base >= 13
  { minBase: 26, text: "Turns every desperate block into a sudden, gruesome counter-stroke" },
  { minBase: 25, text: "Punishes every misstep with swift, crippling retribution" },
  { minBase: 24, text: "Punishes overextension with dismembering precision" },
  { minBase: 23, text: "Turns the opponent's momentum into their own gruesome demise" },
  { minBase: 22, text: "Punishes a missed strike with sickening, surgical vengeance" },
  { minBase: 21, text: "Is always alert for any clue to a foe's weakness" },
  { minBase: 20, text: "A master of the deadly art of answering steel with slaughter" },
  { minBase: 19, text: "Weaves through attacks to deliver punishing counter-strokes" },
  { minBase: 18, text: "Catches the blade and returns it covered in gore" },
  { minBase: 17, text: "Is a very crafty fighter" },
  { minBase: 16, text: "Lures the enemy into fatal overextensions" },
  { minBase: 15, text: "Makes the most of his enemy's mistakes" },
  { minBase: 14, text: "Calculates the perfect moment to reverse the slaughter" },
  { minBase: 13, text: "Makes good dueling decisions" },
  { minBase: 12, text: "Leaves foes crippled the moment they dare to strike" },
  { minBase: 0, text: "Makes good dueling decisions" },
];
const GOOD_RIP_LOW: StatementEntry[] = [ // base 10-12
  { minBase: 23, text: "Twists an enemy's assault into a sudden, bloody end" },
  { minBase: 21, text: "Is an extremely crafty fighter" },
  { minBase: 19, text: "Exploits defensive gaps with cruel efficiency" },
  { minBase: 18, text: "Slices through overextensions with a merciless counter-stroke" },
  { minBase: 17, text: "Does a lot of little things well" },
  { minBase: 16, text: "Punishes sloppy form with precise retaliation" },
  { minBase: 15, text: "Does a lot of little things well" },
  { minBase: 14, text: "Reads the flow of blood and steel expertly" },
  { minBase: 13, text: "Cleverly controls his foes' actions" },
  { minBase: 12, text: "Meets an attack with a brutal, spiteful reprisal" },
  { minBase: 11, text: "Twists past the strike to deliver a sickening riposte" },
  { minBase: 10, text: "Retaliates with the swiftness of a striking viper" },
  { minBase: 0, text: "Cleverly controls his foe's actions" },
];

// GOOD WIT: ATTACK (3rd statement)
const GOOD_ATT_HIGH: StatementEntry[] = [ // base >= 10
  { minBase: 26, text: "Mutilates his targets with the cold, measured precision of an anatomist" },
  { minBase: 25, text: "Dismantles opponents with terrifying, surgical butchery" },
  { minBase: 24, text: "Severs muscle and bone with the cold precision of an executioner" },
  { minBase: 23, text: "Strikes with the ruthless precision of a master torturer" },
  { minBase: 22, text: "Finds the seams in armor to deliver gruesome, bleeding wounds" },
  { minBase: 22, text: "Paints the sands with masterful, agonizing strokes of the blade" },
  { minBase: 21, text: "Knows every weak and sensitive location to be struck on the human body" },
  { minBase: 19, text: "Targets vital organs with a chilling, practiced ease" },
  { minBase: 17, text: "Uses an unusual fighting style, deadly to slower, less active foes" },
  { minBase: 16, text: "Delivers horrific wounds that bleed out the strongest champions" },
  { minBase: 15, text: "Makes very clever attacks" },
  { minBase: 14, text: "Excels at crippling enemies before the final blow" },
  { minBase: 13, text: "Landing blows on vital areas" },
  { minBase: 10, text: "Carves through defenses like they are mere parchment" },
  { minBase: 5,  text: "His strikes consistently find the unarmored meat" },
  { minBase: 0,  text: "He lands blows on less protected areas" },
];
const GOOD_ATT_LOW: StatementEntry[] = [ // base 7-9
  { minBase: 26, text: "Transforms every meager opening into a harrowing bloodbath" },
  { minBase: 25, text: "Creates massacres out of seemingly simple feints" },
  { minBase: 23, text: "Brings a grim, creative malice to every offensive exchange" },
  { minBase: 21, text: "Is always thinking of feints and ploys to be used in attacks" },
  { minBase: 19, text: "Uses misdirection to carve open unguarded flesh" },
  { minBase: 18, text: "Feints beautifully before delivering a crippling strike" },
  { minBase: 17, text: "Has a very clever fighting style" },
  { minBase: 16, text: "Pulls defenses apart with cruel, deceptive strikes" },
  { minBase: 15, text: "Has an unusual fighting style that confuses many opponents" },
  { minBase: 14, text: "Dissects standard defenses with brutal creativity" },
  { minBase: 13, text: "Makes clever attacks" },
  { minBase: 0,  text: "Makes clever attacks" },
];

// GOOD WIT: PARRY (4th statement)
const GOOD_PAR_HIGH: StatementEntry[] = [ // base >= 10
  { minBase: 25, text: "An impenetrable wall of iron, turning aside the deadliest steel" },
  { minBase: 23, text: "Deflects incoming death with almost supernatural calm" },
  { minBase: 21, text: "Has made parrying an art form" },
  { minBase: 20, text: "Bats away fatal blows with a grim, iron discipline" },
  { minBase: 19, text: "Consistently shatters enemy rhythm with perfect blocks" },
  { minBase: 17, text: "Seldom makes mistakes" },
  { minBase: 16, text: "Maintains a flawless guard amidst the chaos of the pit" },
  { minBase: 15, text: "Parrys very intelligently" },
  { minBase: 14, text: "Meets every strike with calculated, grinding resistance" },
  { minBase: 13, text: "Is gifted at parrying" },
  { minBase: 0,  text: "Is gifted at parrying" },
];
const GOOD_PAR_LOW: StatementEntry[] = [ // base 6-9
  { minBase: 23, text: "Denies the killing stroke with grim, practiced resolve" },
  { minBase: 21, text: "Seldom makes a mistake" },
  { minBase: 19, text: "Turns violent onslaughts into harmless sparks" },
  { minBase: 18, text: "Catches the deadliest steel on the edge of his blade" },
  { minBase: 17, text: "Has learned the finer points of parrying" },
  { minBase: 16, text: "Relies on a sturdy, disciplined guard to survive" },
  { minBase: 15, text: "Rarely makes mistakes" },
  { minBase: 14, text: "Protects his vitals with desperate but effective blocks" },
  { minBase: 13, text: "Parrys intelligently" },
  { minBase: 0,  text: "Parrys intelligently" },
];

// GOOD WIT: DEFENSE (5th statement)
const GOOD_DEF_HIGH: StatementEntry[] = [ // base >= 7
  { minBase: 25, text: "Dances through slaughter entirely untouched" },
  { minBase: 23, text: "Anticipates the fatal blow and simply isn't there" },
  { minBase: 21, text: "He's always thinking a few steps ahead of his foes" },
  { minBase: 20, text: "Slips beneath the executioner's blade with chilling calm" },
  { minBase: 19, text: "Evades death with an almost arrogant fluid grace" },
  { minBase: 17, text: "Has turned avoiding blows into an art form" },
  { minBase: 16, text: "Frustrates killers by sliding just out of their reach" },
  { minBase: 15, text: "Is always thinking ahead" },
  { minBase: 14, text: "Leaves opponents swinging furiously at empty air" },
  { minBase: 13, text: "Is gifted at avoiding blows" },
  { minBase: 10, text: "Weaves through the bloodiest of exchanges unscathed" },
  { minBase: 5,  text: "Shows a preternatural calm when ducking under heavy blows" },
  { minBase: 0,  text: "Is gifted at avoiding a blow" },
];
const GOOD_DEF_LOW: StatementEntry[] = [ // base 3-6
  { minBase: 23, text: "Weaves through the carnage with grim efficiency" },
  { minBase: 21, text: "Is always where he should be" },
  { minBase: 19, text: "Never offers an easy target for the executioner" },
  { minBase: 18, text: "Dances out of the bloody arc of his enemy's swing" },
  { minBase: 17, text: "Avoids blows well" },
  { minBase: 16, text: "Keeps his distance when the steel gets too close" },
  { minBase: 15, text: "Avoids blows well" },
  { minBase: 14, text: "Survives by knowing exactly when to retreat" },
  { minBase: 13, text: "Makes few mistakes" },
  { minBase: 0,  text: "Makes few mistakes" },
];

// GOOD WIT: ENDURANCE (6th statement)
const GOOD_END_HIGH: StatementEntry[] = [
  { minBase: 25, text: "Possesses a monstrous, unyielding stamina that breaks men" },
  { minBase: 23, text: "Outlasts the most grueling bloodbaths without drawing a heavy breath" },
  { minBase: 21, text: "Will not over-extend himself" },
  { minBase: 20, text: "Breathes easily even as the sands turn red and slick" },
  { minBase: 19, text: "Thrives in the deep waters of a long, agonizing bout" },
  { minBase: 17, text: "Has the wisdom to wait out his foes" },
  { minBase: 16, text: "Lets his opponents exhaust themselves on his measured defense" },
  { minBase: 15, text: "Rarely wastes his endurance needlessly" },
  { minBase: 14, text: "Paces the butchery to outlive his rival" },
  { minBase: 13, text: "Conserves his endurance past what one might normally expect" },
  { minBase: 0,  text: "Can conserve his endurance past what might normally be expected" },
];
const GOOD_END_LOW: StatementEntry[] = [
  { minBase: 23, text: "A grim survivor who refuses to empty his lungs early" },
  { minBase: 21, text: "Never wastes his endurance needlessly" },
  { minBase: 19, text: "Maintains a suffocating, steady rhythm in the sands" },
  { minBase: 18, text: "Husbands his strength like a miser hoarding gold" },
  { minBase: 17, text: "Conserves his endurance well" },
  { minBase: 16, text: "Budgets his strength for the final, bloody minutes" },
  { minBase: 15, text: "He plans out every move he makes, seldom wasting any effort" },
  { minBase: 14, text: "Knows that exhaustion is just another form of death" },
  { minBase: 13, text: "Seldom wastes his endurance needlessly" },
  { minBase: 0,  text: "Seldom wastes his endurance needlessly" },
];

// ─── Bad Wit Statements (WT <= 7) ──────────────────────────────────────────

const BAD_INI_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Freezes under pressure, surrendering all momentum to the slaughter" },
  { minBase: 15, text: "Plunges forward with blind, uncontrollable aggression" },
  { minBase: 12, text: "Charges into danger with no thought for the consequences" },
  { minBase: 10, text: "Relies entirely on brute force to seize control" },
  { minBase: 9, text: "Stares dumbly as the initiative slips through his fingers" },
  { minBase: 8, text: "Let's the enemy dictate how and when he dies" },
  { minBase: 7, text: "He is unconcerned with controlling the fight" },
  { minBase: 5, text: "Responding to the actions of his foes rather than controlling the fight" },
  { minBase: 2, text: "Is easily manipulated into disastrously poor positioning" },
  { minBase: 0, text: "He needs time to think things through before he can act" },
];
const BAD_INI_LOW: StatementEntry[] = [
  { minBase: 17, text: "Wanders the arena without a plan, waiting to be gutted" },
  { minBase: 16, text: "Invites absolute ruin by standing completely still when the slaughter begins" },
  { minBase: 15, text: "Often stumbles blindly into his enemy's trap" },
  { minBase: 14, text: "Looks entirely lost, allowing the enemy to prepare a gruesome death blow" },
  { minBase: 12, text: "Has the tactical foresight of a cornered beast" },
  { minBase: 11, text: "Surrenders the bloody initiative with embarrassing hesitation" },
  { minBase: 10, text: "Surrenders the pace of the fight out of sheer ignorance" },
  { minBase: 8, text: "Yields every lethal opportunity right back to the enemy" },
  { minBase: 7, text: "Rarely considers how to gain the initiative" },
  { minBase: 6, text: "Makes no effort to dictate the pace of his own demise" },
  { minBase: 5, text: "He often needs time to think things through, losing the chance to act" },
  { minBase: 2, text: "Simply waits to be butchered" },
  { minBase: 1, text: "Basically hands the initiative to his foe on a silver platter" },
  { minBase: 0, text: "He stands around slack-jawed" },
];

const BAD_RIP_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Responds to his opponent's missteps with complete paralysis" },
  { minBase: 15, text: "Swings wildly after a block, hitting nothing but air" },
  { minBase: 12, text: "His clumsy counterattacks leave him completely exposed" },
  { minBase: 10, text: "Lacks the cunning to punish a struggling foe" },
  { minBase: 9, text: "Forgets to strike back when the enemy leaves their throat bare" },
  { minBase: 8, text: "Never realizes the opening is there until the moment has passed" },
  { minBase: 7, text: "The more subtle points of the riposte simply escape him" },
  { minBase: 5, text: "He often fails to make use of his foes mistakes" },
  { minBase: 2, text: "Repeatedly misses the chance for an easy kill" },
  { minBase: 0, text: "He makes a lot of mistakes" },
];
const BAD_RIP_LOW: StatementEntry[] = [
  { minBase: 17, text: "Stares dumbly at exposed throats without raising his blade" },
  { minBase: 15, text: "Never realizes when his opponent is vulnerable" },
  { minBase: 12, text: "Lets golden opportunities for slaughter slip away" },
  { minBase: 10, text: "Is completely blind to the rhythm of the duel" },
  { minBase: 8, text: "Forgives his enemy's worst mistakes by doing absolutely nothing" },
  { minBase: 7, text: "He makes bad dueling decisions" },
  { minBase: 5, text: "He makes mistakes" },
  { minBase: 2, text: "Fails to grasp the concept of retaliation" },
  { minBase: 0, text: "He is too dense to respond to his opponent's mistakes" },
];

const BAD_ATT_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Wastes his lethal potential on the most obvious, blockable swings" },
  { minBase: 16, text: "Telegraphs every killing stroke, turning lethal force into wasted effort" },
  { minBase: 15, text: "Throws chaotic, predictable haymakers that are easily punished" },
  { minBase: 13, text: "Swings with brutal strength but zero regard for the enemy's guard" },
  { minBase: 12, text: "Hacks blindly, hoping the steel finds meat instead of shield" },
  { minBase: 12, text: "Relies entirely on savage, thoughtless swinging" },
  { minBase: 11, text: "Focuses only on the enemy's shield, leaving flesh untouched" },
  { minBase: 10, text: "His attacks are as blunt and stupid as a rock" },
  { minBase: 9, text: "His clumsy thrusts leave him hopelessly exposed to counterattacks" },
  { minBase: 8, text: "Fails to grasp the concept of an exposed throat or unarmored limb" },
  { minBase: 7, text: "He makes bad dueling decisions" },
  { minBase: 5, text: "Makes feints that fool no one" },
  { minBase: 2, text: "Strikes harmlessly at heavily armored sections" },
  { minBase: 0, text: "He makes a lot of mistakes" }
];
const BAD_ATT_LOW: StatementEntry[] = [
  { minBase: 17, text: "Swings his steel with all the grace of a blind butcher" },
  { minBase: 16, text: "Flails his weapon in wild arcs that threaten only himself" },
  { minBase: 15, text: "Hacks clumsily without any plan or precision" },
  { minBase: 13, text: "Attempts complicated feints that look more like spasms" },
  { minBase: 12, text: "His strikes are desperately wild and mostly ineffective" },
  { minBase: 11, text: "Chops uselessly at armor instead of finding the weak points" },
  { minBase: 10, text: "Shows no creativity, just repeating the same dull attack" },
  { minBase: 9, text: "A predictable brawler whose swings are easily avoided" },
  { minBase: 8, text: "Throws his weapon around hoping it hits flesh, but mostly catching shield" },
  { minBase: 7, text: "He makes costly mistakes" },
  { minBase: 6, text: "Practically begs the enemy to block his slow, pathetic strikes" },
  { minBase: 5, text: "He makes incredibly stupid attacks" },
  { minBase: 2, text: "Practically hands his weapon to his enemy" },
  { minBase: 1, text: "His weapon handling is an insult to the arena" },
  { minBase: 0, text: "He makes stupid feints that fool no one" }
];

const BAD_PAR_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Leaves his vital organs entirely exposed while guarding empty space" },
  { minBase: 16, text: "Relies on his armor to catch blows that his clumsy parries miss" },
  { minBase: 15, text: "Often raises his guard too late to stop the bleeding" },
  { minBase: 14, text: "Tries to block the heaviest swings with laughable frailty" },
  { minBase: 13, text: "His guard is rigid, slow, and easily battered aside" },
  { minBase: 12, text: "Relies on his armor to catch blows he fails to block" },
  { minBase: 11, text: "Leaves his head exposed while desperately guarding his chest" },
  { minBase: 10, text: "His parries are stiff, predictable, and easily broken" },
  { minBase: 9, text: "Bites on every feint, constantly exposing his vital organs" },
  { minBase: 8, text: "Gives up the center line constantly, begging for a sudden demise" },
  { minBase: 7, text: "Fails to parry in situations where he could do so" },
  { minBase: 5, text: "Is nearly always fooled by a feint" },
  { minBase: 2, text: "Takes fatal blows to the head while protecting his knees" },
  { minBase: 0, text: "Isn't bright enough to parry in most circumstances" }
];
const BAD_PAR_LOW: StatementEntry[] = [
  { minBase: 17, text: "Attempts to block heavy blows with flimsy wrist movements" },
  { minBase: 16, text: "Tries to block heavy slashes with fragile wrists" },
  { minBase: 15, text: "Clumsily attempts blocks that usually miss the incoming steel" },
  { minBase: 13, text: "Raises his guard so late the blade is already cutting bone" },
  { minBase: 12, text: "Treats his weapon as a club, forgetting it can deflect" },
  { minBase: 11, text: "Treats his blade like a club, useless for deflecting strikes" },
  { minBase: 10, text: "Often flinches instead of raising a proper guard" },
  { minBase: 9, text: "Closes his eyes and hopes the shield finds the incoming blow" },
  { minBase: 8, text: "Barely moves his weapon until the blade is already cutting his flesh" },
  { minBase: 7, text: "Carelessly taking blows that he could avoid" },
  { minBase: 6, text: "Dances around incoming attacks but forgets to raise his weapon" },
  { minBase: 5, text: "Is often fooled by a feint" },
  { minBase: 4, text: "Tries to catch the blade with his face" },
  { minBase: 3, text: "Has the defensive instincts of a slaughtered pig" },
  { minBase: 2, text: "Is easily tricked into opening his own throat" },
  { minBase: 1, text: "Has the defensive reflexes of a corpse" },
  { minBase: 0, text: "He is usually fooled by a feint" }
];

const BAD_DEF_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Lurches into the path of fatal thrusts like a blind man on a battlefield" },
  { minBase: 16, text: "Steps right into the path of devastating thrusts" },
  { minBase: 15, text: "Stumbles around the arena like a drunken brute" },
  { minBase: 14, text: "Offers his flesh willingly to the butcher's blade" },
  { minBase: 14, text: "Stands like a statue, eagerly awaiting the butcher's block" },
  { minBase: 13, text: "His footwork is tangled, slow, and invites sudden death" },
  { minBase: 12, text: "Prefers to absorb blows rather than step out of the way" },
  { minBase: 11, text: "Lumbers blindly into strikes that a child could dodge" },
  { minBase: 11, text: "Stands like an anvil, absorbing blows he should be dodging" },
  { minBase: 10, text: "His footwork is dangerously uncoordinated and slow" },
  { minBase: 9, text: "Turns his back on the enemy far too often for a sane fighter" },
  { minBase: 8, text: "Turns his unarmored back to the enemy far too often" },
  { minBase: 7, text: "Carelessly takes blows that he could avoid" },
  { minBase: 5, text: "Is often fooled by a feint" },
  { minBase: 2, text: "Constantly trips over his own feet" },
  { minBase: 0, text: "He is constantly making mistakes" }
];
const BAD_DEF_LOW: StatementEntry[] = [
  { minBase: 17, text: "Makes no effort to move from the inevitable path of execution" },
  { minBase: 16, text: "Makes no effort to move, standing firm like a slab of meat" },
  { minBase: 15, text: "Presents a massive, unmoving target for butchery" },
  { minBase: 13, text: "Lumbers around the pit, a massive and unmissable target" },
  { minBase: 12, text: "Rarely attempts to dodge, inviting severe wounds" },
  { minBase: 11, text: "Invites severe wounds by refusing to retreat a single step" },
  { minBase: 10, text: "Simply walks into his opponent's deadliest strikes" },
  { minBase: 9, text: "Crowds the enemy, perfectly exposing his throat to short blades" },
  { minBase: 8, text: "Lacks any sense of spacing, letting foes press right up to his throat" },
  { minBase: 7, text: "Stands around making himself a target" },
  { minBase: 6, text: "His spatial awareness is lethally poor" },
  { minBase: 5, text: "He makes mistakes" },
  { minBase: 2, text: "Seems almost eager to be slaughtered" },
  { minBase: 1, text: "Simply doesn't care if he is hacked to pieces" },
  { minBase: 0, text: "He just doesn't care if he gets hurt or not" }
];

const BAD_END_HIGH: StatementEntry[] = [
  { minBase: 17, text: "Thrashes like a dying beast until his lungs bleed" },
  { minBase: 16, text: "Burns out in a chaotic flash of exhausting, mindless rage" },
  { minBase: 15, text: "Burns out in a flash of mindless, exhausting rage" },
  { minBase: 14, text: "Gurgles for breath before the true carnage even begins" },
  { minBase: 13, text: "Gasping for breath before the crowd has even settled" },
  { minBase: 12, text: "Exhausts himself swinging wildly at the air" },
  { minBase: 11, text: "Throws away his late-bout chances with overly wild early swings" },
  { minBase: 10, text: "Pushes his body past the breaking point out of pure ignorance" },
  { minBase: 9, text: "Pushes his lungs past their limits without dealing any damage" },
  { minBase: 8, text: "Completely ruins his own late-bout chances by flailing early" },
  { minBase: 7, text: "And he doesn't conserve his endurance" },
  { minBase: 5, text: "He doesn't think about resting as much as he should" },
  { minBase: 2, text: "Spends all his energy on useless, panicked movements" },
  { minBase: 0, text: "Often wastes his endurance thoughtlessly" }
];
const BAD_END_LOW: StatementEntry[] = [
  { minBase: 17, text: "A guaranteed casualty if the bout extends past the early exchanges" },
  { minBase: 16, text: "Heaves for air like a slaughtered beast after a few simple exchanges" },
  { minBase: 15, text: "Collapses from fatigue after throwing too many clumsy strikes" },
  { minBase: 14, text: "Heaves for air like a dying beast before the first drop of blood is spilled" },
  { minBase: 13, text: "Dooms himself to an exhausted, humiliating death if the fight drags on" },
  { minBase: 12, text: "Gasps for air while completely ignoring the pace of the duel" },
  { minBase: 11, text: "Has no concept of pacing, completely destroying his own endurance" },
  { minBase: 10, text: "Has no concept of pacing, ensuring an early collapse" },
  { minBase: 9, text: "Tires himself out wildly swinging at the empty air" },
  { minBase: 8, text: "Dooms himself to an exhausted, humiliating slaughter" },
  { minBase: 7, text: "He fails to husband strength when tired" },
  { minBase: 6, text: "Begs to be put out of his misery by sheer fatigue" },
  { minBase: 5, text: "Often wastes his endurance thoughtlessly" },
  { minBase: 4, text: "Tires himself out swinging wildly at empty air" },
  { minBase: 3, text: "Begs to be put out of his misery by sheer exhaustion" },
  { minBase: 2, text: "Will literally work himself to death for no reason" },
  { minBase: 1, text: "Will literally work himself to death for no good reason" },
  { minBase: 0, text: "And he doesn't have the smarts to understand when he should rest" }
];

// ─── Quickness Statements ──────────────────────────────────────────────────
// Based on DEF base and PAR base (WT > 7 only)

function getQuicknessStatement(defBase: number, parBase: number, wt: number): string {
  if (wt <= 7) {
    // Bad wit warriors get simplified quickness
    if (defBase >= 15) return "Is quick on his feet";
    if (defBase >= 5) return "";
    if (defBase >= -10) return "Is slow on his feet";
    return "Is very slow on his feet";
  }

  let speed;
  let qualifier;

  if (defBase >= 35) {
    speed = "is incredibly quick and elusive on his feet";
    qualifier = parBase >= 30
      ? "making even dangerous opponents look harmless"
      : parBase <= 0 ? "relying on speed to stay out of danger" : "";
  } else if (defBase >= 25) {
    speed = "is very quick on his feet";
    qualifier = parBase >= 30
      ? "often avoiding seemingly hopeless situations"
      : parBase <= 0 ? "avoiding rather than trading blows" : "";
  } else if (defBase >= 15) {
    speed = "is quick on his feet";
    qualifier = parBase >= 30
      ? "and is well able to protect himself"
      : parBase <= 0 ? "avoiding blows rather than parrying" : "";
  } else if (defBase >= 5) {
    return ""; // No quickness statement
  } else if (defBase >= -10) {
    speed = "is slow on his feet";
    qualifier = parBase >= 30
      ? "finding it hard to avoid a blow he doesn't parry"
      : parBase <= 0 ? "with a marked inability to avoid or parry a blow" : "";
  } else {
    speed = "is very slow on his feet";
    qualifier = parBase >= 30
      ? "attempts to parry rather than dodge attacks"
      : parBase <= 0 ? "absolutely unable to avoid getting hurt" : "";
  }

  return qualifier ? `${speed}, ${qualifier}` : speed;
}

// ─── Statement Generator ───────────────────────────────────────────────────

/**
 * Generate all canonical overview statements for a warrior.
 * Uses Good Wit statements if WT > 7, Bad Wit if WT <= 7.
 */
export function generateWarriorStatements(
  wt: number,
  sp: number,
  df: number,
  skills: BaseSkills,
): WarriorOverviewStatements {
  const isGoodWit = wt > 7;

  // Determine high/low order for each skill
  // Good wit: high-order thresholds vary per skill
  // Bad wit: high-order if base >= threshold, low-order otherwise

  function getWitStatement(
    baseValue: number,
    goodHigh: StatementEntry[], goodLow: StatementEntry[],
    badHigh: StatementEntry[], badLow: StatementEntry[],
    highThreshold: number,
  ): string {
    if (isGoodWit) {
      return pickStatement(baseValue >= highThreshold ? goodHigh : goodLow, wt);
    } else {
      return pickStatement(baseValue >= highThreshold ? badHigh : badLow, wt);
    }
  }

  const initiative = getWitStatement(skills.INI, GOOD_INI_HIGH, GOOD_INI_LOW, BAD_INI_HIGH, BAD_INI_LOW, 13);
  const riposte = getWitStatement(skills.RIP, GOOD_RIP_HIGH, GOOD_RIP_LOW, BAD_RIP_HIGH, BAD_RIP_LOW, 13);
  const attack = getWitStatement(skills.ATT, GOOD_ATT_HIGH, GOOD_ATT_LOW, BAD_ATT_HIGH, BAD_ATT_LOW, 10);
  const parry = getWitStatement(skills.PAR, GOOD_PAR_HIGH, GOOD_PAR_LOW, BAD_PAR_HIGH, BAD_PAR_LOW, 10);
  const defense = getWitStatement(skills.DEF, GOOD_DEF_HIGH, GOOD_DEF_LOW, BAD_DEF_HIGH, BAD_DEF_LOW, 7);

  // Endurance statement uses WT threshold directly (high-order if endurance statement is "good" tier)
  const endurance = getWitStatement(skills.DEC, GOOD_END_HIGH, GOOD_END_LOW, BAD_END_HIGH, BAD_END_LOW, 10);

  const coordination = describeCoordination(computeCoordination(sp, df));
  const quickness = getQuicknessStatement(skills.DEF, skills.PAR, wt);
  const activity = describeActivity(computeActivityRating(skills.INI, skills.RIP));

  return { initiative, riposte, attack, parry, defense, endurance, coordination, quickness, activity };
}

function describeCoordination(rating: CoordinationRating): string {
  switch (rating) {
    case "Marvel of Fighting Coordination": return "Is a marvel of fighting coordination";
    case "Very Highly Coordinated": return "Is very highly coordinated";
    case "Highly Coordinated": return "Is highly coordinated";
    case "Normal": return "";
    case "Slightly Uncoordinated": return "Is slightly uncoordinated";
    case "Clumsy": return "Is clumsy";
  }
}

function describeActivity(rating: ActivityRating): string {
  if (rating === "Normal") return "";
  return `Is ${rating.toLowerCase()}`;
}
