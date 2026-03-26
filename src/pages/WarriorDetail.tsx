import React, { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { obfuscateWarrior } from "@/lib/obfuscation";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior, type FightPlan, type FightSummary } from "@/types/game";
import { getAllFightsForWarrior } from "@/engine/core/historyUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Trophy, Flame, Star, Swords, Heart, Shield, Armchair, User, Crosshair, Shirt, History, TrendingUp, ScrollText, Zap, Skull } from "lucide-react";
import TagBadge from "@/components/TagBadge";
import PlanBuilder from "@/components/PlanBuilder";
import EquipmentLoadoutUI from "@/components/EquipmentLoadout";
import { defaultPlanForWarrior } from "@/engine/simulate";
import { computeStreaks } from "@/engine/gazetteNarrative";
import { DAMAGE_LABELS, getDamageRating, getHPRating, computeEncumbranceClass, computeEnduranceTier, ENDURANCE_LABELS } from "@/engine/skillCalc";
import { retireWarrior } from "@/state/gameStore";
import { DEFAULT_LOADOUT, type EquipmentLoadout } from "@/data/equipment";
import { toast } from "sonner";
import SubNav, { type SubNavTab } from "@/components/SubNav";
import BoutViewer from "@/components/BoutViewer";
import { generateWarriorStatements } from "@/data/warriorStatements";
import { ENCUMBRANCE_LABELS, type EncumbranceClass } from "@/data/terrabloodCharts";
import { getFavoritesDisplay, applyInsightToken } from "@/engine/favorites";
import { getMastery } from "@/engine/stylePassives";
import { Lightbulb, Eye } from "lucide-react";

const TABS: SubNavTab[] = [
  { id: "overview", label: "Overview", icon: <User className="h-3.5 w-3.5" /> },
  { id: "strategy", label: "Strategy", icon: <Crosshair className="h-3.5 w-3.5" /> },
  { id: "equipment", label: "Equipment", icon: <Shirt className="h-3.5 w-3.5" /> },
  { id: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
];

/**
 * Narrative descriptors for growth headroom.
 * These hint at potential without showing numbers.
 */
function growthNarrative(current: number, potential: number | undefined): {
  label: string;
  color: string;
  tooltip: string;
} {
  if (potential === undefined) {
    return { label: "", color: "", tooltip: "Growth potential unknown" };
  }
  const gap = potential - current;
  if (gap <= 0) return {
    label: "Mastered",
    color: "text-muted-foreground",
    tooltip: "This warrior has reached their natural ceiling in this area.",
  };
  if (gap === 1) return {
    label: "Nearing peak",
    color: "text-arena-gold/70",
    tooltip: "Little room left to grow. Training gains will be rare.",
  };
  if (gap === 2) return {
    label: "Maturing",
    color: "text-arena-gold",
    tooltip: "Some growth remains, but progress is slowing.",
  };
  if (gap <= 5) return {
    label: "Developing",
    color: "text-primary",
    tooltip: "Solid room for improvement through training and experience.",
  };
  return {
    label: "Raw talent",
    color: "text-accent glow-neon-blue drop-shadow-md",
    tooltip: "Tremendous untapped potential. This warrior could become exceptional.",
  };
}

/** Overall narrative assessment of a warrior's growth ceiling */
function overallGrowthNarrative(warrior: Warrior): string {
  if (!warrior.potential) return "This warrior's limits are unknown.";
  const gaps = ATTRIBUTE_KEYS.map(k => warrior.potential![k] - warrior.attributes[k]);
  const totalGap = gaps.reduce((s, g) => s + Math.max(0, g), 0);
  const maxedCount = gaps.filter(g => g <= 0).length;

  if (maxedCount === 7) return "A fully realized warrior — there is nothing more the arena can teach.";
  if (maxedCount >= 5) return "Nearing the end of their growth. Focus training on what remains.";
  if (totalGap >= 30) return "Brimming with untapped potential. The right training could forge a legend.";
  if (totalGap >= 15) return "Still growing. There are gains to be made across the board.";
  return "Approaching their natural limits, but a few areas can still sharpen.";
}

function AttrBar({ label, value, potential, max = 25 }: { label: string; value: number; potential?: number; max?: number }) {
  const currentPct = (value / max) * 100;
  const growth = growthNarrative(value, potential);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground w-20">{label}</span>
        <div className="flex items-center gap-2">
          {growth.label && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-[10px] italic ${growth.color} cursor-default`}>
                    {growth.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px] text-xs">
                  {growth.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="relative">
        <Progress value={currentPct} className="h-2 rounded-full overflow-hidden shadow-[0_0_5px_currentColor]" />
      </div>
    </div>
  );
}

function SkillBar({ label, value, max = 20 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 font-mono">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2 rounded-full overflow-hidden shadow-[0_0_5px_currentColor]" />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

function WarriorStatementsPanel({ warrior }: { warrior: Warrior }) {
  if (!warrior.baseSkills) return null;
  const statements = generateWarriorStatements(
    warrior.attributes.WT, warrior.attributes.SP, warrior.attributes.DF, warrior.baseSkills
  );
  const lines = [
    statements.initiative, statements.riposte, statements.attack,
    statements.parry, statements.defense, statements.endurance,
    statements.coordination, statements.quickness, statements.activity,
  ].filter(Boolean);

  if (lines.length === 0) return <p className="text-xs text-muted-foreground italic">No notable observations.</p>;

  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => (
        <li key={i} className="text-xs text-muted-foreground italic leading-relaxed">• {line}</li>
      ))}
    </ul>
  );
}

/** Discovery progress thresholds */
const WEAPON_HINT_FIGHTS = 5;
const WEAPON_REVEAL_FIGHTS = 15;
const RHYTHM_HINT_FIGHTS = 7;
const RHYTHM_REVEAL_FIGHTS = 18;

/** Get discovery progress for a warrior */
function getDiscoveryProgress(totalFights: number): {
  weaponProgress: number;
  rhythmProgress: number;
  weaponStage: "hidden" | "hint1" | "hint2" | "revealed";
  rhythmStage: "hidden" | "hint1" | "hint2" | "revealed";
} {
  let weaponStage: "hidden" | "hint1" | "hint2" | "revealed" = "hidden";
  if (totalFights >= WEAPON_REVEAL_FIGHTS) weaponStage = "revealed";
  else if (totalFights >= WEAPON_HINT_FIGHTS * 2) weaponStage = "hint2";
  else if (totalFights >= WEAPON_HINT_FIGHTS) weaponStage = "hint1";

  let rhythmStage: "hidden" | "hint1" | "hint2" | "revealed" = "hidden";
  if (totalFights >= RHYTHM_REVEAL_FIGHTS) rhythmStage = "revealed";
  else if (totalFights >= RHYTHM_HINT_FIGHTS * 2) rhythmStage = "hint2";
  else if (totalFights >= RHYTHM_HINT_FIGHTS) rhythmStage = "hint1";

  return {
    weaponProgress: Math.min(100, (totalFights / WEAPON_REVEAL_FIGHTS) * 100),
    rhythmProgress: Math.min(100, (totalFights / RHYTHM_REVEAL_FIGHTS) * 100),
    weaponStage,
    rhythmStage,
  };
}

/** Discovery Progress Bar with milestone markers */
function DiscoveryProgressBar({
  progress,
  stage,
  label,
  hint1Label,
  hint2Label,
  revealLabel,
  hint1At,
  hint2At,
  revealAt,
}: {
  progress: number;
  stage: "hidden" | "hint1" | "hint2" | "revealed";
  label: string;
  hint1Label: string;
  hint2Label: string;
  revealLabel: string;
  hint1At: number;
  hint2At: number;
  revealAt: number;
}) {
  const stageLabels: Record<string, string> = {
    hidden: "Unknown",
    hint1: hint1Label,
    hint2: hint2Label,
    revealed: revealLabel,
  };

  const stageColors: Record<string, string> = {
    hidden: "bg-muted",
    hint1: "bg-primary/60",
    hint2: "bg-primary/80",
    revealed: "bg-accent",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-medium ${stage === "revealed" ? "text-accent" : "text-muted-foreground"}`}>
          {stageLabels[stage]}
        </span>
      </div>
      <div className="relative">
        {/* Progress track */}
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${stageColors[stage]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          <div
            className="absolute w-px h-3 bg-muted-foreground/30"
            style={{ left: `${(hint1At / revealAt) * 100}%` }}
            title={`Hint 1 at ${hint1At} fights`}
          />
          <div
            className="absolute w-px h-3 bg-muted-foreground/30"
            style={{ left: `${(hint2At / revealAt) * 100}%` }}
            title={`Hint 2 at ${hint2At} fights`}
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/70">
        <span>0</span>
        <span>Hint {hint1At}</span>
        <span>Hint {hint2At}</span>
        <span>Reveal {revealAt}</span>
      </div>
    </div>
  );
}

/** Favorites & Mastery Card — shows discovered/hinted weapon and rhythm preferences */
function FavoritesCard({ warrior, onUpdate }: { warrior: Warrior; onUpdate: () => void }) {
  const { setState, state } = useGameStore();
  const favDisplay = getFavoritesDisplay(warrior);
  const totalFights = warrior.career.wins + warrior.career.losses;
  const mastery = getMastery(totalFights);
  const progress = getDiscoveryProgress(totalFights);

  const handleInsight = (type: "weapon" | "rhythm") => {
    const msg = applyInsightToken(warrior, type);
    // Persist the change
    setState({
      ...state,
      roster: state.roster.map(w => w.id === warrior.id ? { ...w, favorites: warrior.favorites } : w),
    });
    toast.success(msg);
    onUpdate();
  };

  if (!warrior.favorites) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" /> Favorites & Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mastery Tier */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant={mastery.tier === "Grandmaster" ? "destructive" : mastery.tier === "Master" ? "default" : "secondary"}>
              {mastery.tier}
            </Badge>
            <span className="text-xs text-muted-foreground">{totalFights} fights</span>
          </div>
          <span className="text-[10px] text-muted-foreground">×{mastery.mult} passives</span>
        </div>

        {/* Discovery Progress */}
        <div className="space-y-3 pt-1">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> Discovery Progress
          </div>
          <DiscoveryProgressBar
            progress={progress.weaponProgress}
            stage={progress.weaponStage}
            label="Favorite Weapon"
            hint1Label="Developing..."
            hint2Label="Preference emerging"
            revealLabel="Discovered! (+1 ATT)"
            hint1At={WEAPON_HINT_FIGHTS}
            hint2At={WEAPON_HINT_FIGHTS * 2}
            revealAt={WEAPON_REVEAL_FIGHTS}
          />
          <DiscoveryProgressBar
            progress={progress.rhythmProgress}
            stage={progress.rhythmStage}
            label="Natural Rhythm"
            hint1Label="Rhythm forming..."
            hint2Label="Approach emerging"
            revealLabel="Discovered! (+1 INI)"
            hint1At={RHYTHM_HINT_FIGHTS}
            hint2At={RHYTHM_HINT_FIGHTS * 2}
            revealAt={RHYTHM_REVEAL_FIGHTS}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Discovered Preferences</div>
        </div>

        {/* Favorite Weapon */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Swords className="h-3 w-3" /> Favorite Weapon
            </div>
            {favDisplay.weapon ? (
              <div className="text-sm font-semibold text-accent">{favDisplay.weapon}</div>
            ) : favDisplay.weaponHint ? (
              <div className="text-sm text-muted-foreground italic">{favDisplay.weaponHint}</div>
            ) : (
              <div className="text-sm text-muted-foreground/50">Not yet discovered</div>
            )}
          </div>
          {!warrior.favorites.discovered.weapon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleInsight("weapon")} aria-label="Reveal favorite weapon">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use Insight Token to reveal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Favorite Rhythm */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" /> Natural Rhythm
            </div>
            {favDisplay.rhythm ? (
              <div className="text-sm font-semibold text-accent">{favDisplay.rhythm}</div>
            ) : favDisplay.rhythmHint ? (
              <div className="text-sm text-muted-foreground italic">{favDisplay.rhythmHint}</div>
            ) : (
              <div className="text-sm text-muted-foreground/50">Not yet discovered</div>
            )}
          </div>
          {!warrior.favorites.discovered.rhythm && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => handleInsight("rhythm")} aria-label="Reveal natural rhythm">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use Insight Token to reveal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Career Timeline — visual milestone markers */
function CareerTimeline({ warrior, arenaHistory }: { warrior: Warrior; arenaHistory: FightSummary[] }) {
  const milestones = useMemo(() => {
    const events: { week: number; label: string; icon: React.ReactNode; color: string }[] = [];
    const fights = getAllFightsForWarrior(arenaHistory, warrior.name);
    // Sort chronologically
    const sorted = [...fights].sort((a, b) => a.week - b.week);

    // First bout
    if (sorted.length > 0) {
      events.push({ week: sorted[0].week, label: "First Bout", icon: <Swords className="h-3.5 w-3.5" />, color: "bg-primary" });
    }

    // First win
    const firstWin = sorted.find(f => {
      const isA = f.a === warrior.name;
      return (isA && f.winner === "A") || (!isA && f.winner === "D");
    });
    if (firstWin) {
      events.push({ week: firstWin.week, label: "First Victory", icon: <Trophy className="h-3.5 w-3.5" />, color: "bg-arena-gold" });
    }

    // First kill
    const firstKill = sorted.find(f => {
      const isA = f.a === warrior.name;
      return ((isA && f.winner === "A") || (!isA && f.winner === "D")) && f.by === "Kill";
    });
    if (firstKill) {
      events.push({ week: firstKill.week, label: "First Kill", icon: <Skull className="h-3.5 w-3.5" />, color: "bg-destructive" });
    }

    // Championship
    if (warrior.champion) {
      const champFight = sorted.find(f => f.tournamentId && (
        (f.a === warrior.name && f.winner === "A") || (f.d === warrior.name && f.winner === "D")
      ));
      events.push({ week: champFight?.week ?? warrior.career.wins, label: "Champion", icon: <Star className="h-3.5 w-3.5" />, color: "bg-arena-fame" });
    }

    // Retirement
    if (warrior.status === "Retired" && warrior.retiredWeek) {
      events.push({ week: warrior.retiredWeek, label: "Retired", icon: <Armchair className="h-3.5 w-3.5" />, color: "bg-muted-foreground" });
    }

    // Death
    if (warrior.status === "Dead" && warrior.deathWeek) {
      events.push({ week: warrior.deathWeek, label: warrior.deathCause ?? "Fallen", icon: <Skull className="h-3.5 w-3.5" />, color: "bg-destructive" });
    }

    // Deduplicate by label, keep earliest
    const seen = new Set<string>();
    return events.filter(e => { if (seen.has(e.label)) return false; seen.add(e.label); return true; })
      .sort((a, b) => a.week - b.week);
  }, [warrior, arenaHistory]);

  if (milestones.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Career Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${m.color} text-primary-foreground shrink-0 shadow-sm`}>
                  {m.icon}
                </div>
                <div className="pt-1">
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground font-mono">Week {m.week}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WarriorFightHistory({ warriorName, arenaHistory }: { warriorName: string; arenaHistory: FightSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fights = getAllFightsForWarrior(arenaHistory, warriorName);

  // Compute head-to-head records per opponent
  const h2h = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; draws: number; kills: number; deaths: number }>();
    for (const f of fights) {
      const isA = f.a === warriorName;
      const opponent = isA ? f.d : f.a;
      if (!map.has(opponent)) map.set(opponent, { wins: 0, losses: 0, draws: 0, kills: 0, deaths: 0 });
      const rec = map.get(opponent)!;
      const won = (isA && f.winner === "A") || (!isA && f.winner === "D");
      const lost = (isA && f.winner === "D") || (!isA && f.winner === "A");
      if (won) {
        rec.wins++;
        if (f.by === "Kill") rec.kills++;
      } else if (lost) {
        rec.losses++;
        if (f.by === "Kill") rec.deaths++;
      } else {
        rec.draws++;
      }
    }
    return map;
  }, [fights, warriorName]);

  if (fights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No recorded bouts yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <Swords className="h-5 w-5 text-arena-gold" /> Fight History
      </h3>
      {fights.slice(-10).reverse().map((f) => {
        const isA = f.a === warriorName;
        const won = (isA && f.winner === "A") || (!isA && f.winner === "D");
        const isExpanded = expandedId === f.id;
        const hasTranscript = f.transcript && f.transcript.length > 0;
        const opponent = isA ? f.d : f.a;
        const record = h2h.get(opponent);

        return (
          <div key={f.id}>
            <button
              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors text-left ${
                isExpanded ? "border-primary/40 bg-primary/5" : "border-border hover:bg-secondary/50"
              }`}
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={won ? "default" : f.winner ? "destructive" : "secondary"}
                  className="text-xs w-8 justify-center"
                >
                  {won ? "W" : f.winner ? "L" : "D"}
                </Badge>
                <span className="text-sm">
                  vs <span className="font-medium">{opponent}</span>
                </span>
                {record && (record.wins + record.losses + record.draws) >= 2 && (
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    H2H: {record.wins}-{record.losses}{record.draws > 0 ? `-${record.draws}` : ""}
                    {record.kills > 0 && <span className="text-destructive glow-neon-red drop-shadow-md ml-1">☠{record.kills}</span>}
                  </span>
                )}
                {record && record.losses >= 3 && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    💀 Nemesis
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {f.by && <Badge variant="outline" className="text-xs">{f.by}</Badge>}
                <span className="text-xs text-muted-foreground">Wk {f.week}</span>
                {hasTranscript && (
                  <span className="text-[10px] text-primary">▶</span>
                )}
              </div>
            </button>

            {isExpanded && hasTranscript && (
              <div className="mt-2 animate-fade-in">
                <BoutViewer
                  nameA={f.a}
                  nameD={f.d}
                  styleA={f.styleA}
                  styleD={f.styleD}
                  log={f.transcript!.map((text, i) => ({ minute: i + 1, text }))}
                  winner={f.winner}
                  by={f.by}
                  isRivalry={f.isRivalry}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { state, setState } = useGameStore();

  // Find warrior in roster, graveyard, retired, OR rival stables
  const warrior = useMemo(() => {
    let w = state.roster.find((w) => w.id === id) ||
            state.graveyard.find((w) => w.id === id) ||
            state.retired.find((w) => w.id === id);
    if (w) return w;
    for (const rs of state.rivals || []) {
      w = rs.roster.find((w) => w.id === id);
      if (w) return w;
    }
    return undefined;
  }, [id, state.roster, state.graveyard, state.retired, state.rivals]);

  const isPlayerOwned = useMemo(() => {
    if (!warrior) return false;
    return !!(state.roster.find((w) => w.id === id) || state.graveyard.find((w) => w.id === id) || state.retired.find((w) => w.id === id));
  }, [warrior, id, state.roster, state.graveyard, state.retired]);

  const displayWarrior = useMemo(() => {
    if (!warrior) return null;
    return obfuscateWarrior(warrior, state.insightTokens, isPlayerOwned);
  }, [warrior, state.insightTokens, isPlayerOwned]);

  // Import our obfuscator
  // Wait, I need to make sure I add the import at the top

  const [activeTab, setActiveTab] = useState("overview");

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      const nextRoster = state.roster.map((w) =>
        w.id === warrior?.id ? { ...w, plan: newPlan } : w
      );
      setState({ ...state, roster: nextRoster });
    },
    [warrior, state, setState]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    const updated = retireWarrior(state, warrior!.id);
    setState(updated);
    toast.success(`${warrior!.name} has been retired with honor.`);
    navigate({ to: "/" });
  }, [warrior, state, setState, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      const nextRoster = state.roster.map((w) =>
        w.id === warrior?.id ? { ...w, equipment: newLoadout } : w
      );
      setState({ ...state, roster: nextRoster });
    },
    [warrior, state, setState]
  );

  const currentPlan = warrior?.plan ?? (warrior ? defaultPlanForWarrior(warrior) : undefined);
  const currentLoadout = warrior?.equipment ?? DEFAULT_LOADOUT;

  if (!warrior) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Warrior not found.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const record = `${displayWarrior.career.wins}W - ${displayWarrior.career.losses}L - ${displayWarrior.career.kills}K`;

  // Compute current streak
  const streakMap = computeStreaks(state.arenaHistory);
  const streakVal = streakMap.get(displayWarrior.name) ?? 0;
  const streakLabel = streakVal > 0
    ? `🔥 ${streakVal}W streak`
    : streakVal < 0
    ? `${Math.abs(streakVal)}L streak`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/"><Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button></Link>
        <Button variant="outline" size="sm" onClick={handleRetire} className="gap-1.5 text-muted-foreground hover:text-destructive glow-neon-red drop-shadow-md">
          <Armchair className="h-3.5 w-3.5" /> Retire
        </Button>
      </div>

      {/* Hero */}
      <div className="relative rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-4 sm:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5 glow-neon-blue rounded-xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide break-all">{displayWarrior.name}</h1>
              {displayWarrior.champion && (
                <Badge className="bg-arena-gold text-black gap-1">
                  <Trophy className="h-3 w-3" /> Champion
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground font-display">
              {(displayWarrior.style === "UNKNOWN" ? "Unknown Style" : STYLE_DISPLAY_NAMES[displayWarrior.style])}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-sm text-muted-foreground">{record}</p>
              {streakLabel && (
                <Badge
                  variant={streakVal > 0 ? "default" : "destructive"}
                  className={`text-xs gap-1 ${streakVal > 0 ? "bg-primary text-black glow-neon-green" : ""}`}
                >
                  {streakLabel}
                </Badge>
              )}
            </div>
            {displayWarrior.age && (
              <p className="text-xs text-muted-foreground mt-1">Age: {displayWarrior.age} · XP: {(warrior as any).xp ?? 0}</p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {displayWarrior.flair.map((f) => (
                <TagBadge key={f} tag={f} type="flair" />
              ))}
              {displayWarrior.titles.map((t) => (
                <TagBadge key={t} tag={t} type="title" />
              ))}
              {displayWarrior.injuries.map((i) => {
                const injName = typeof i === "string" ? i : i.name;
                return <TagBadge key={injName} tag={injName} type="injury" />;
              })}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Flame className="h-6 w-6 text-arena-fame mx-auto mb-1" />
              <div className="text-2xl font-bold">{displayWarrior.fame}</div>
              <div className="text-xs text-muted-foreground">Fame</div>
            </div>
            <div className="text-center">
              <Star className="h-6 w-6 text-arena-pop mx-auto mb-1" />
              <div className="text-2xl font-bold">{displayWarrior.popularity}</div>
              <div className="text-xs text-muted-foreground">Pop</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Attributes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(20,255,100,0.8)]" /> Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map((key) => (
                <AttrBar
                  key={key}
                  label={ATTRIBUTE_LABELS[key]}
                  value={typeof displayWarrior.attributes[key] === 'number' ? displayWarrior.attributes[key] as number : 0}
                  potential={displayWarrior.potential?.[key]}
                />
              ))}
              <div className="pt-2 text-xs text-muted-foreground">
                Total: {ATTRIBUTE_KEYS.reduce((sum, k) => sum + (typeof displayWarrior.attributes[k] === 'number' ? displayWarrior.attributes[k] as number : 0), 0)} / 70
              </div>
              {/* Narrative growth assessment */}
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex items-start gap-2 text-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground italic leading-relaxed">
                    {overallGrowthNarrative(warrior)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Skills + Physicals */}
          <div className="space-y-4">
            {displayWarrior.baseSkills && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Swords className="h-5 w-5 text-arena-gold" /> Base Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(displayWarrior.baseSkills).map(([key, val]) => (
                    <SkillBar key={key} label={key} value={val} />
                  ))}
                </CardContent>
              </Card>
            )}

            {displayWarrior.derivedStats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-destructive glow-neon-red drop-shadow-md" /> Physicals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Hit Points</div>
                      <div className="text-lg font-bold">{displayWarrior.derivedStats.hp}</div>
                      <div className="text-[10px] text-muted-foreground">{getHPRating(displayWarrior.derivedStats.hp)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Endurance</div>
                      <div className="text-lg font-bold">{displayWarrior.derivedStats.endurance}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ENDURANCE_LABELS[computeEnduranceTier(warrior.attributes.ST, warrior.attributes.CN, warrior.attributes.WL)]}
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Damage</div>
                      <div className="text-lg font-bold">{getDamageRating(displayWarrior.derivedStats.damage)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Carry Cap</div>
                      <div className="text-lg font-bold">{displayWarrior.derivedStats.encumbrance}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ENCUMBRANCE_LABELS[computeEncumbranceClass(warrior.attributes.ST, warrior.attributes.CN)]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Favorites & Mastery */}
            <FavoritesCard warrior={warrior} onUpdate={() => {}} />

            {/* Canonical Warrior Statements */}
            {displayWarrior.baseSkills && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary glow-neon-green drop-shadow-md" /> Overview Statements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WarriorStatementsPanel warrior={warrior} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === "strategy" && currentPlan && (
        <PlanBuilder
          plan={currentPlan}
          onPlanChange={handlePlanChange}
          warriorName={displayWarrior.name}
        />
      )}

      {/* Equipment Tab */}
      {activeTab === "equipment" && displayWarrior.derivedStats && (
        <EquipmentLoadoutUI
          loadout={currentLoadout}
          style={warrior.style}
          carryCap={warrior.derivedStats?.encumbrance ?? 0}
          warriorAttrs={{ ST: warrior.attributes.ST, DF: warrior.attributes.DF, SP: warrior.attributes.SP }}
          onChange={handleEquipmentChange}
        />
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <CareerTimeline warrior={warrior} arenaHistory={state.arenaHistory} />
          <WarriorFightHistory warriorName={displayWarrior.name} arenaHistory={state.arenaHistory} />
        </div>
      )}
    </div>
  );
}
