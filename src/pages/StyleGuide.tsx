/**
 * Style Guide — comprehensive reference for all 10 fighting styles.
 * Shows classic weapons, matchup heuristics, tactic suitability, mastery tiers, and strategy tips.
 */
import React, { useState } from "react";
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEAPONS, STYLE_CLASSIC_WEAPONS } from "@/data/equipment";
import {
  getOffensiveSuitability,
  getDefensiveSuitability,
  SUITABILITY_LABELS,
  type SuitabilityRating,
} from "@/engine/tacticSuitability";
import { Swords, Shield, Zap, Target, Crown, ChevronRight } from "lucide-react";

// ─── Style Data ───────────────────────────────────────────────────────

const ALL_STYLES = Object.values(FightingStyle);
const OFF_TACTICS = ["Lunge", "Slash", "Bash", "Decisiveness"] as const;
const DEF_TACTICS = ["Dodge", "Parry", "Riposte", "Responsiveness"] as const;

const MASTERY_TIERS = [
  { tier: "Novice", fights: 0, color: "bg-muted text-muted-foreground" },
  { tier: "Practiced", fights: 10, color: "bg-secondary text-secondary-foreground" },
  { tier: "Veteran", fights: 20, color: "bg-primary/20 text-primary" },
  { tier: "Master", fights: 30, color: "bg-accent/20 text-accent" },
  { tier: "Grandmaster", fights: 50, color: "bg-destructive/20 text-destructive" },
];

interface StyleInfo {
  style: FightingStyle;
  archetype: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestAttrs: string;
  rhythmTip: string;
}

const STYLE_INFO: Record<FightingStyle, Omit<StyleInfo, "style">> = {
  [FightingStyle.AimedBlow]: {
    archetype: "Precision Assassin",
    description: "Patient, low-activity fighter who conserves endurance and waits for the perfect strike. Crits are devastating, especially headshots.",
    strengths: ["Crit chance on targeted strikes", "Endurance conservation (low OE)", "Destroys predictable defensive styles (TP)"],
    weaknesses: ["Slow start (opening phase penalty)", "Struggles vs counter-fighters (PR)", "Needs high WT and DF"],
    bestAttrs: "WT > DF > WL",
    rhythmTip: "Run OE 3-5, AL 4-6. Low OE is a feature — each swing is deliberate.",
  },
  [FightingStyle.BashingAttack]: {
    archetype: "Momentum Brawler",
    description: "Raw power fighter that builds momentum with consecutive hits. Bash tactic attacks 'through a parry', making BA the hard counter to defensive styles.",
    strengths: ["Bash bypasses parry checks", "Momentum damage (+DMG per consecutive hit)", "Hard-counters Total Parry"],
    weaknesses: ["Burns endurance fast", "Poor dodge ability", "Weak to precision styles (AB) that read charges"],
    bestAttrs: "ST > CN > WL",
    rhythmTip: "Run OE 7-9, AL 3-5. Go all-in early. Use Bash tactic always.",
  },
  [FightingStyle.LungingAttack]: {
    archetype: "Blitz Striker",
    description: "Explosive opener with the fastest initiative. Devastating in the first 2 exchanges, then fades. Win fast or struggle.",
    strengths: ["Highest opening INI bonus", "+ATT on first exchange", "Speed overwhelms slow starters"],
    weaknesses: ["Fades hard in late phases", "Highest endurance drain", "Weak vs zone controllers (WS)"],
    bestAttrs: "SP > DF > WT",
    rhythmTip: "Run OE 6-8, AL 6-8. Front-load everything. If you haven't won by mid, you're in trouble.",
  },
  [FightingStyle.ParryLunge]: {
    archetype: "Patient Counter-Lunger",
    description: "Waits for the opponent to overcommit, then explodes with a devastating counter-lunge. Best when behind on hits.",
    strengths: ["Counter-attack bonus when behind", "Balanced hybrid skills", "Beats PR with patience"],
    weaknesses: ["No strong opening", "Loses to aggressive speed (LU)", "Needs opponent to attack first"],
    bestAttrs: "WT > SP > WL",
    rhythmTip: "Run OE 4-6, AL 4-6. Be patient — the counter-lunge rewards letting them swing first.",
  },
  [FightingStyle.ParryRiposte]: {
    archetype: "Counter-Strike Specialist",
    description: "The ultimate counter-fighter. Low OE actually INCREASES attack power via the OE paradox — fewer swings but each is a lethal counter.",
    strengths: ["OE paradox: low OE = more counters", "High RIP skill", "Punishes aggressive styles (AB, SL)"],
    weaknesses: ["Terrible at high OE", "TP outlasts PR", "Needs opponent to attack to counter"],
    bestAttrs: "DF > WT > WL",
    rhythmTip: "Run OE 2-4, AL 3-5. Never go above OE 5 — you lose your counter identity.",
  },
  [FightingStyle.ParryStrike]: {
    archetype: "Efficient Defender",
    description: "The most consistent style — reliable parry into measured strikes. No flashy mechanics, just steady winning through economy of motion.",
    strengths: ["Highest PAR seed (4)", "Consistent ATT+PAR passive", "Well-suited to most tactics"],
    weaknesses: ["No explosive mechanic", "PR out-counters PS", "Loses to raw power (ST)"],
    bestAttrs: "WT > DF > WL",
    rhythmTip: "Run OE 4-6, AL 4-6. Steady and consistent. Decisiveness tactic is Well-Suited.",
  },
  [FightingStyle.SlashingAttack]: {
    archetype: "Whirlwind Aggressor",
    description: "Wide, sweeping attacks that overwhelm in the opening. Flurry bonus fades in late phases. Best with a scimitar.",
    strengths: ["Opening ATT+DMG bonus", "Aggression overwhelms TP", "Multi-hit potential"],
    weaknesses: ["Fades in late phases", "Terrible parry ability", "Weak vs disciplined parry styles"],
    bestAttrs: "ST > SP > CN",
    rhythmTip: "Run OE 6-8, AL 5-7. Slash tactic is Well-Suited. End fights before they go late.",
  },
  [FightingStyle.StrikingAttack]: {
    archetype: "Clean Power Hitter",
    description: "Reliable, efficient striker with consistent ATT bonus. Extra damage against wounded opponents makes ST a strong finisher.",
    strengths: ["Consistent +1 ATT always", "Bonus DMG vs wounded opponents", "Well-suited to Decisiveness"],
    weaknesses: ["No defensive identity", "Loses to zone controllers (WS)", "No early-fight advantage"],
    bestAttrs: "ST > WT > DF",
    rhythmTip: "Run OE 6-8, AL 4-6. Steady aggression. Decisiveness tactic for kill windows.",
  },
  [FightingStyle.TotalParry]: {
    archetype: "Endurance Fortress",
    description: "Outlasts opponents through superior endurance efficiency. Low ATT means TP rarely kills — it wins by exhaustion and decision.",
    strengths: ["Lowest endurance drain", "Late-phase PAR bonus", "Outlasts reactive styles (PL, PR)"],
    weaknesses: ["Crushed by BA (bash through parry)", "AB precision finds openings", "Very low ATT — can't kill"],
    bestAttrs: "CN > WL > WT",
    rhythmTip: "Run OE 2-4, AL 2-4. Survive. Let them exhaust themselves. Win on decision.",
  },
  [FightingStyle.WallOfSteel]: {
    archetype: "Zone Controller",
    description: "Constant blade motion creates an impenetrable defensive zone. DEF scales with fight length. Excellent endurance.",
    strengths: ["Scaling DEF bonus over time", "Great endurance efficiency", "Zone control beats speed (LU)"],
    weaknesses: ["Slow DEF buildup", "Loses to raw power (BA)", "Low ATT — struggles to finish"],
    bestAttrs: "SP > DF > WL",
    rhythmTip: "Run OE 3-5, AL 4-6. Let the blade wall build. Responsiveness tactic is Well-Suited.",
  },
};

// ─── Matchup Matrix (simplified display) ─────────────────────────────

const MATCHUP_DISPLAY: Record<string, Record<string, number>> = {};
const MATCHUP_MATRIX = [
  [ 0, +1,  0,  0, -1,  0, +1,  0, +2,  0],
  [-1,  0, -1,  0,  0, -1, +1, +1, +2, +1],
  [ 0, +1,  0, +1,  0, -1, +1,  0, +1, -1],
  [ 0,  0, -1,  0, +1,  0,  0, -1, -1,  0],
  [+1,  0,  0, -1,  0, +1, +1, -1, -1,  0],
  [ 0, +1, +1,  0, -1,  0, +1, -1,  0, -1],
  [-1, -1, -1,  0, -1, -1,  0, +1, +1, +1],
  [ 0, -1,  0, +1, +1, +1, -1,  0,  0, -1],
  [-2, -2, -1, +1, +1,  0, -1,  0,  0, +1],
  [ 0, -1, +1,  0,  0, +1, -1, +1, -1,  0],
];

ALL_STYLES.forEach((a, ai) => {
  MATCHUP_DISPLAY[a] = {};
  ALL_STYLES.forEach((d, di) => {
    MATCHUP_DISPLAY[a][d] = MATCHUP_MATRIX[ai][di];
  });
});

// ─── Component ──────────────────────────────────────────────────────

function SuitBadge({ rating }: { rating: SuitabilityRating }) {
  const colors: Record<SuitabilityRating, string> = {
    WS: "bg-green-500/20 text-green-400 border-green-500/30",
    S: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    U: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[rating]}`}>
      {SUITABILITY_LABELS[rating]}
    </span>
  );
}

function MatchupCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>;
  const color = value > 0
    ? value >= 2 ? "text-green-400 font-bold" : "text-green-400"
    : value <= -2 ? "text-destructive font-bold" : "text-destructive";
  return <span className={color}>{value > 0 ? `+${value}` : value}</span>;
}

function StyleCard({ style }: { style: FightingStyle }) {
  const info = STYLE_INFO[style];
  const classicWeaponId = STYLE_CLASSIC_WEAPONS[style];
  const classicWeapon = WEAPONS.find(w => w.id === classicWeaponId);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-cinzel text-foreground">
            {STYLE_DISPLAY_NAMES[style]}
            <span className="ml-2 text-xs text-muted-foreground font-sans">({STYLE_ABBREV[style]})</span>
          </CardTitle>
          <Badge variant="outline" className="text-accent border-accent/30">
            {info.archetype}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{info.description}</p>

        {/* Classic Weapon */}
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Classic Weapon:</span>
          <Badge variant="secondary">{classicWeapon?.name ?? "Unknown"}</Badge>
          <span className="text-xs text-muted-foreground">(+1 ATT when equipped)</span>
        </div>

        {/* Best Attributes */}
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Best Attributes:</span>
          <span className="text-sm text-muted-foreground">{info.bestAttrs}</span>
        </div>

        {/* Rhythm Tip */}
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <span className="text-sm font-medium text-foreground">Rhythm:</span>
            <span className="text-sm text-muted-foreground ml-1">{info.rhythmTip}</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-semibold text-green-400 uppercase mb-1">Strengths</h4>
            <ul className="space-y-1">
              {info.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <ChevronRight className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-destructive uppercase mb-1">Weaknesses</h4>
            <ul className="space-y-1">
              {info.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <ChevronRight className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tactic Suitability */}
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase mb-2">Tactic Suitability</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">Offensive</span>
              <div className="space-y-1">
                {OFF_TACTICS.map(t => (
                  <div key={t} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{t}</span>
                    <SuitBadge rating={getOffensiveSuitability(style, t)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">Defensive</span>
              <div className="space-y-1">
                {DEF_TACTICS.map(t => (
                  <div key={t} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{t}</span>
                    <SuitBadge rating={getDefensiveSuitability(style, t)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StyleGuide() {
  const [selectedStyle, setSelectedStyle] = useState<FightingStyle | null>(null);

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-foreground">Fighting Style Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Master the 10 fighting styles — learn their weapons, matchups, tactics, and mastery progression.
        </p>
      </div>

      <Tabs defaultValue="styles" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="styles">Style Cards</TabsTrigger>
          <TabsTrigger value="matchups">Matchup Matrix</TabsTrigger>
          <TabsTrigger value="mastery">Mastery Tiers</TabsTrigger>
        </TabsList>

        {/* ── Style Cards ── */}
        <TabsContent value="styles" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALL_STYLES.map(style => (
              <StyleCard key={style} style={style} />
            ))}
          </div>
        </TabsContent>

        {/* ── Matchup Matrix ── */}
        <TabsContent value="matchups" className="mt-4">
          <Card className="border-border bg-card overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-lg font-cinzel">Style Matchup Matrix</CardTitle>
              <p className="text-xs text-muted-foreground">
                Row attacks Column. Positive = advantage for the row style. Values affect INI, PAR, and DEC rolls.
              </p>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-1 text-muted-foreground">ATT ↓ / DEF →</th>
                    {ALL_STYLES.map(s => (
                      <th key={s} className="p-1 text-center text-muted-foreground font-medium">
                        {STYLE_ABBREV[s]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_STYLES.map(a => (
                    <tr key={a} className="border-t border-border/50">
                      <td className="p-1 font-medium text-foreground">{STYLE_ABBREV[a]}</td>
                      {ALL_STYLES.map(d => (
                        <td key={d} className="p-1 text-center">
                          {a === d
                            ? <span className="text-muted-foreground/50">—</span>
                            : <MatchupCell value={MATCHUP_DISPLAY[a][d]} />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <p><span className="text-green-400 font-bold">+2</span> = strong advantage | <span className="text-green-400">+1</span> = slight edge | <span className="text-destructive">-1</span> = slight disadvantage | <span className="text-destructive font-bold">-2</span> = hard counter</p>
                <p className="text-accent">Notable: BA hard-counters TP (+2), AB destroys TP (+2), SL/LU beat TP through aggression.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Mastery Tiers ── */}
        <TabsContent value="mastery" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-cinzel flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Mastery Progression
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Warriors gain mastery in their fighting style through bout experience. Higher tiers enhance style-specific passives.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MASTERY_TIERS.map(({ tier, fights, color }) => (
                  <div key={tier} className="flex items-center gap-3">
                    <Badge className={`${color} w-28 justify-center`}>{tier}</Badge>
                    <span className="text-sm text-muted-foreground w-24">{fights}+ fights</span>
                    <span className="text-xs text-foreground">
                      {tier === "Novice" && "Base passive effects. No bonus."}
                      {tier === "Practiced" && "×1.04 passive multiplier. Style identity starts to emerge."}
                      {tier === "Veteran" && "+1 bonus, ×1.08 multiplier. Reliable execution of style mechanics."}
                      {tier === "Master" && "+1 bonus, ×1.15 multiplier. Passives become a significant combat factor."}
                      {tier === "Grandmaster" && "+1 bonus, ×1.25 multiplier. Peak mastery — passives are devastating."}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-2">Style Passive Examples at Grandmaster:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">AB:</strong> +15% crit chance on targeted strikes</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">BA:</strong> +3 momentum DMG per consecutive hit</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">LU:</strong> +3 INI in opening exchanges</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">PL:</strong> +2 ATT/INI when behind on hits</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">PR:</strong> +2 RIP escalation after ripostes</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">PS:</strong> +2 PAR, +1 ATT always</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">SL:</strong> +2 ATT in opening, +1 DMG</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">ST:</strong> +2 ATT always, +1 DMG vs wounded</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">TP:</strong> +2 PAR in late phase, +1 RIP</div>
                  <div className="p-2 bg-secondary/50 rounded"><strong className="text-accent">WS:</strong> +2 DEF scaling over time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
