# Stable Lords — Canonical Duelmasters PBP Reference v0.1
Generated: 2026-03-08

This document catalogues the **canonical play-by-play (PBP) narration patterns** from Duelmasters/Duel II, as used by the Stable Lords combat narrative engine.

## Source Material

All patterns extracted from official Terrablood PBP archives:

| File | Warriors | Styles | Key Feature |
|------|----------|--------|-------------|
| [joro.txt](https://www.terrablood.com/dm/examples/joro.txt) | RAM IT DOWN vs JORO | ST vs AB | Open Hand fighting, desperation |
| [bchief.txt](https://www.terrablood.com/dm/examples/bchief.txt) | TEXAS RANGER vs BANDIT CHIEF | TP vs WS | Weapon break, long fight |
| [beast.txt](https://www.terrablood.com/dm/examples/beast.txt) | MALEFICUS vs BEAST | WS vs BA | Shield combat, 4-minute bout |
| [lao.txt](https://www.terrablood.com/dm/examples/lao.txt) | MASTER LAO vs SERENE | AB vs PR | Quick kill, precise targeting |
| [mstroke.txt](https://www.terrablood.com/dm/examples/mstroke.txt) | XENA vs MASTER STROKE | LU vs AB | Open Hand vs Epee |
| [ninja.txt](https://www.terrablood.com/dm/examples/ninja.txt) | NINJA vs DEE DEE | SL vs PR | Dual weapons, 4-minute epic |
| [rouge.txt](https://www.terrablood.com/dm/examples/rouge.txt) | THE BADGER vs RHAJAH ROUGE | LU vs ST | Challenge match |
| [ftf26_fg.htm](https://www.terrablood.com/dm/examples/ftf26_fg.htm) | FURIOUS GEORGE (WS) | WS | Tournament champion profile |

---

## PBP Structure

### 1. Pre-Bout Introduction Block
Each warrior gets 4-7 lines describing:
- Height (derived from SZ)
- Race/origin (flavor)
- Handedness
- Armor description with adjectives ("fine, well-oiled suit of LEATHER armor")
- Helm
- Weapon with action verb ("awaits with a SCIMITAR in hand")
- Fighting style declaration
- Weapon suitability statement

### 2. Battle Opener
Single atmospheric line:
- "The battle begins amid the crowd's approval."
- "Those in the stands shift their attention to the warriors."
- "The audience falls silent as the dueling begins."

### 3. Combat Exchanges
Each exchange follows: Initiative → Attack → Defense → Counter → Hit → Damage → State

**Attack verbs** are weapon-type specific:
- Slash weapons: "slashes with his SCIMITAR!", "slashes an arcing attack"
- Bash weapons: "bashes with his MAUL!", "smashes downward"  
- Thrust weapons: "lunges wielding an EPEE!", "stabs powerfully upward"
- Fists: "PUNCHES from the waist!", "FISTS punching with piston-like power!"

**Defense verbs** vary by type:
- Parry: "parrys with his SCIMITAR", "blocks the blow with his MAUL"
- Dodge: "contorts his body inhumanly as he unbelievably dodges the blow!"
- Shield: "defense is secure as his MEDIUM SHIELD easily parrys the attack!"

**Counterstrike sequences**:
- "pivots around seeking the counterstrike!"
- "steps back, and then rushes forward in a counterstrike!"
- "feints an attack, freezing his opponent's initiative!"

### 4. Hit Location Specificity
Canonical DM uses very specific body part names:
- HEAD: JAW, TEMPLE, THROAT, SKULL, FOREHEAD
- ARMS: RIGHT FOREARM, LEFT BICEPS, RIGHT ELBOW, RIGHT HAND
- LEGS: RIGHT THIGH, LEFT KNEE, RIGHT SHIN
- TORSO: CHEST, RIBS, STOMACH, PELVIS, KIDNEYS, GROIN

### 5. Damage Severity
Increasing severity descriptors:
- "The attack is a glancing blow only."
- "It is a tremendous blow!"
- "It was an awesome blow."
- "It is a terrific blow!"
- "It was an incredible blow!"
- "It was a deadly attack!"
- "Spectators cringe as the horrific power of the blow strikes home!"

### 6. State Changes
Health thresholds trigger state narration:
- 60% HP: "is bleeding badly!", "falls back, unable to take the punishment"
- 40% HP: "appears DESPERATE!", "begins to panic and fights desperately!"
- 20% HP: "is on the verge of shock!!", "is severely hurt!!"

### 7. Fatigue Lines
- "is breathing heavily."
- "seems to be running out of energy."
- "is tired and barely able to defend himself!"

### 8. Crowd Reactions
- Positive: "The audience screams its approval!", "Lightning flashes a sign of approval!"
- Negative: "The crowd jeers 'NAME'.", "There are scattered boo's for NAME."
- Encouragement: "From the stands, a voice screams 'Come on NAME, you can do it!'"

### 9. Minute Markers
Every minute boundary: "MINUTE 2." followed by status assessment:
- "The warriors appear equal in skill."
- "NAME is beating his opponent!"
- "NAME, so far, is ahead of his formidable opponent!"

### 10. Bout End Conditions
- **Kill**: "is gravely injured! delivers the killing blow!"
- **KO**: "crumples to his knees!!! is incapable of further combat!"
- **Stoppage**: "motions to the LORD PROTECTORS that he cannot continue!"
- **Surrender**: "surrenders, and offers his hand to his foe."

### 11. Post-Bout
- Popularity changes: "popularity has greatly increased!" / "marginally increased."
- Skill learns: "learned an ATTACK skill." / "learned a DECISIVENESS concept."
- Record update: "now has a [W-L-K] record and X recognition points."

---

## Implementation

The narrative engine lives in `src/engine/narrativePBP.ts` and exports:
- `generateWarriorIntro()` — pre-bout intro block
- `battleOpener()` — atmospheric opening line
- `narrateAttack()` — weapon-specific attack text
- `narrateParry()` / `narrateDodge()` — defense narration
- `narrateCounterstrike()` — riposte/counter sequences
- `narrateHit()` — hit location with rich body part names
- `damageSeverityLine()` — damage descriptor
- `stateChangeLine()` — HP threshold state changes
- `fatigueLine()` — endurance-based fatigue text
- `crowdReaction()` — crowd interaction lines
- `minuteStatusLine()` — per-minute status assessment
- `narrateBoutEnd()` — kill/KO/stoppage/exhaustion endings
- `tradingBlowsLine()` — filler for exchanges
- `tauntLine()` — warrior quotes

---

END OF DOCUMENT
