import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookOpen } from 'lucide-react';

export default function Help() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        icon={BookOpen}
        title="Codex · Help"
        subtitle="IMPERIAL · KNOWLEDGE · STRATEGY COMPENDIUM"
      />

      <Accordion
        type="multiple"
        defaultValue={[
          'strategy',
          'styles',
          'attributes',
          'equipment',
          'trainers',
          'combat',
          'moods',
        ]}
      >
        <AccordionItem value="strategy">
          <AccordionTrigger className="font-display text-lg">Strategy Basics</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm">
            <div>
              <Badge variant="outline" className="mr-2">
                OE
              </Badge>
              <strong>Offensive Effort</strong> (1-10): How aggressively your warrior attacks.
              Higher OE means more damage potential but drains endurance faster. Also reduces your
              own defensive skills.
            </div>
            <div>
              <Badge variant="outline" className="mr-2">
                AL
              </Badge>
              <strong>Activity Level</strong> (1-10): Movement and tempo. High AL improves
              initiative but costs stamina. Low AL conserves energy for the late bout.
            </div>
            <div>
              <Badge variant="outline" className="mr-2">
                KD
              </Badge>
              <strong>Kill Desire</strong> (1-10): How ruthlessly your warrior fights when an
              opponent is wounded. High KD increases kill chance but may leave openings. Only
              triggers when the enemy is low on HP and endurance.
            </div>
            <div>
              <Badge variant="outline" className="mr-2">
                Target
              </Badge>
              <strong>Body Target</strong>: Choose Head, Chest, Abdomen, Arms, Legs, or Any. Head
              hits deal 50% more damage, chest 20%, while limb hits deal less but are easier to
              land.
            </div>
            <div>
              <strong>Offensive Tactics</strong>: Lunge, Slash, Bash, or Decisiveness. Matching your
              style (e.g., Bash for Bashers) avoids anti-synergy penalties. Mismatched tactics
              reduce effectiveness.
            </div>
            <div>
              <strong>Defensive Tactics</strong>: Dodge, Parry, Riposte, or Responsiveness. Riposte
              works best for parry styles; Total Parry excels with the Parry tactic.
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="styles">
          <AccordionTrigger className="font-display text-lg">Fighting Styles</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Each warrior has one of 10 fighting styles that determines their combat approach and
              stat bonuses:
            </p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                <strong>Basher (BA)</strong> — Raw power, high ATT and INI seeds. Excels with heavy
                weapons and high OE. Weak against defensive styles.
              </li>
              <li>
                <strong>Lunger (LU)</strong> — Fastest initiative, burst offense with thrusting
                weapons. Great in the opening but tires quickly.
              </li>
              <li>
                <strong>Striker (ST)</strong> — Balanced attacker with solid ATT. Versatile weapon
                choices, good all-around.
              </li>
              <li>
                <strong>Slasher (SL)</strong> — Speed-dependent blade work. High ATT and INI, weak
                parry. Needs SP and DF.
              </li>
              <li>
                <strong>Aimed-Blow (AB)</strong> — Precision targeting, high DEC for kill windows.
                Light weapons only. Needs WT and DF.
              </li>
              <li>
                <strong>Parry-Lunger (PL)</strong> — Balanced offense/defense. Waits for openings
                then counters with lunges. The jack-of-all-trades.
              </li>
              <li>
                <strong>Parry-Riposte (PR)</strong> — Counter-fighting specialist. Highest RIP seed.
                Lets opponents attack then punishes mistakes.
              </li>
              <li>
                <strong>Parry-Striker (PS)</strong> — Balanced parry + offense. Highest PAR seed
                among offensive styles.
              </li>
              <li>
                <strong>Total-Parry (TP)</strong> — Ultimate defense. Highest PAR and DEF seeds.
                Wins by exhausting opponents. Low damage output.
              </li>
              <li>
                <strong>Wall of Steel (WS)</strong> — Defensive all-rounder. Good DEF and RIP,
                constant blade motion. Beats most styles by attrition.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Style Matchups</strong>: Each style has advantages and disadvantages against
              others. Offensive styles beat other offensives but struggle against defensive styles.
              Total Parry and Wall of Steel counter most attackers but lose to each other.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="attributes">
          <AccordionTrigger className="font-display text-lg">Attributes & Skills</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>7 attributes, total = 70 points, range 3–25 each:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>ST (Strength)</strong> — Damage output and carry capacity. Primary for
                Bashers.
              </li>
              <li>
                <strong>CN (Constitution)</strong> — Hit points and endurance base. Essential for
                longevity.
              </li>
              <li>
                <strong>SZ (Size)</strong> — Weight class. Adds to HP and damage but reduces carry
                efficiency.
              </li>
              <li>
                <strong>WT (Wit)</strong> — Primary skill driver. Affects ATT, PAR, INI, RIP, and
                DEC. The most important attribute.
              </li>
              <li>
                <strong>WL (Will)</strong> — Endurance capacity and determination. Helps PAR and
                DEC. Second most important.
              </li>
              <li>
                <strong>SP (Speed)</strong> — Initiative and defense. Critical for Lungers and
                Slashers.
              </li>
              <li>
                <strong>DF (Deftness)</strong> — Accuracy and riposte capability. Key for Aimed-Blow
                and Parry-Riposte.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Breakpoint Bonuses</strong>: Stats at 9, 13, 17, and 21 provide increasing
              skill bonuses (+1, +2, +3, +4). Plan your warrior's stats around these breakpoints.
            </p>
            <p className="mt-2">
              <strong>Derived Stats</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>HP</strong> = f(CN, SZ, WL) — How much damage before going down
              </li>
              <li>
                <strong>Endurance</strong> = f(CN, WL, ST) — How long before exhaustion
              </li>
              <li>
                <strong>Damage</strong> = f(ST, SZ) — Little → Normal → Good → Great → Tremendous
              </li>
              <li>
                <strong>Carry Cap</strong> = f(ST, CN, SZ) — Max equipment weight before penalties
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="equipment">
          <AccordionTrigger className="font-display text-lg">
            Equipment & Encumbrance
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>Equipment affects combat stats and must fit within your warrior's carry capacity:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Weapons</strong>: Light weapons (wt 1-2) grant +1 INI. Heavy weapons (wt 5+)
                grant +1 damage. Two-handed weapons block shield use.
              </li>
              <li>
                <strong>Shields</strong>: Buckler (+1 PAR), Small (+1 PAR/DEF), Medium (+2 DEF),
                Large (+3 DEF, -1 ATT). Restricted for some styles.
              </li>
              <li>
                <strong>Armor</strong>: Heavier armor protects but costs endurance. Chain mail and
                above drain stamina faster.
              </li>
              <li>
                <strong>Helms</strong>: Full Helm gives great head protection but -1 INI. Aimed-Blow
                warriors can't use it.
              </li>
            </ul>
            <p className="mt-2">
              <strong>Over-Encumbered</strong>: Exceeding carry capacity penalizes INI, DEF, and
              endurance. Keep total weight at or below your Carry Cap.
            </p>
            <p className="mt-2">
              <strong>Style Restrictions</strong>: Some items are restricted by style (e.g.,
              Aimed-Blow can't use heavy weapons or full helms, Lungers can't use medium/large
              shields).
            </p>
            <p className="mt-2">
              <strong>Preferred Weapons</strong>: Weapons marked with ⭐ are thematically suited to
              your style. Use them for optimal performance.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="trainers">
          <AccordionTrigger className="font-display text-lg">Trainers</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>Hire up to 5 trainers to boost your stable's capabilities:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Aggression</strong> ⚔️ — Boosts ATT skill in combat
              </li>
              <li>
                <strong>Defense</strong> 🛡️ — Boosts PAR and DEF skills
              </li>
              <li>
                <strong>Endurance</strong> 💪 — Increases stamina pool
              </li>
              <li>
                <strong>Mind</strong> 🧠 — Boosts INI and DEC for better initiative and kill windows
              </li>
              <li>
                <strong>Healing</strong> 💊 — Reduces the chance of your warriors being killed in
                combat
              </li>
            </ul>
            <p className="mt-2">
              <strong>Tiers</strong>: Novice (+1), Seasoned (+2), Master (+3) — higher tiers give
              stronger bonuses.
            </p>
            <p className="mt-2">
              <strong>Retired Warriors</strong>: Retired warriors can be converted into trainers.
              Their tier is based on career wins, and they provide a style-specific bonus for
              warriors of their same style.
            </p>
            <p className="mt-2">
              <strong>Contracts</strong>: Trainers serve 52-week contracts. When expired, they leave
              automatically.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="combat">
          <AccordionTrigger className="font-display text-lg">Combat Resolution</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>Each exchange follows the canonical resolution chain:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>Initiative (INI)</strong> — Determines who attacks first. Modified by AL and
                style matchup.
              </li>
              <li>
                <strong>Attack (ATT)</strong> — Roll to hit. Modified by OE and matchup bonus.
              </li>
              <li>
                <strong>Parry (PAR)</strong> — Defender tries to block. If successful, may riposte.
              </li>
              <li>
                <strong>Defense (DEF)</strong> — If parry fails, dodge check. Modified by OE
                penalty.
              </li>
              <li>
                <strong>Riposte (RIP)</strong> — Counter-attack after successful parry or attacker
                whiff.
              </li>
              <li>
                <strong>Damage</strong> — Hit location × damage class × variance. Head hits deal 50%
                extra.
              </li>
              <li>
                <strong>Decisiveness (DEC)</strong> — When target is low HP+endurance, opens kill
                window.
              </li>
              <li>
                <strong>Endurance</strong> — Both fighters drain stamina each exchange. Higher OE/AL
                = faster drain.
              </li>
            </ol>
            <p className="mt-2">
              <strong>Victory Conditions</strong>: Kill, KO (HP ≤ 0), Stoppage (endurance ≤ 0),
              Exhaustion (both exhausted), or Decision (time/points).
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tokens">
          <AccordionTrigger className="font-display text-lg">Insight Tokens</AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Earned from tournament victories (2nd and 3rd place), these rare relics allow you to
              unmask your opponents' secrets:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Weapon Token</strong> ⚔️ — Reveals the exact damage and weight of a target's
                equipped weapon.
              </li>
              <li>
                <strong>Rhythm Token</strong> 🥁 — Reveals a warrior's hidden tactical tendencies
                (OE, AL, and KD).
              </li>
              <li>
                <strong>Style Token</strong> 🥋 — Instantly identifies a warrior's core fighting
                style without scouting.
              </li>
            </ul>
            <p className="mt-2">
              Use these tokens in the <strong>Booking Office</strong> or <strong>Treasury</strong>{' '}
              to gain a decisive advantage before a major clash.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
