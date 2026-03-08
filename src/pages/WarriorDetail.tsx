import React, { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior, type FightPlan, type FightSummary } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Flame, Star, Swords, Heart, Shield, Armchair, User, Crosshair, Shirt, History } from "lucide-react";
import TagBadge from "@/components/TagBadge";
import PlanBuilder from "@/components/PlanBuilder";
import EquipmentLoadoutUI from "@/components/EquipmentLoadout";
import { defaultPlanForWarrior } from "@/engine/simulate";
import { DAMAGE_LABELS } from "@/engine/skillCalc";
import { retireWarrior } from "@/state/gameStore";
import { DEFAULT_LOADOUT, type EquipmentLoadout } from "@/data/equipment";
import { toast } from "sonner";
import SubNav, { type SubNavTab } from "@/components/SubNav";
import BoutViewer from "@/components/BoutViewer";

const TABS: SubNavTab[] = [
  { id: "overview", label: "Overview", icon: <User className="h-3.5 w-3.5" /> },
  { id: "strategy", label: "Strategy", icon: <Crosshair className="h-3.5 w-3.5" /> },
  { id: "equipment", label: "Equipment", icon: <Shirt className="h-3.5 w-3.5" /> },
  { id: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
];

function AttrBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2" />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

function SkillBar({ label, value, max = 20 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 font-mono">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2" />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

function WarriorFightHistory({ warriorName, arenaHistory }: { warriorName: string; arenaHistory: FightSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fights = arenaHistory.filter((f) => f.a === warriorName || f.d === warriorName);

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
                  vs <span className="font-medium">{isA ? f.d : f.a}</span>
                </span>
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, setState } = useGame();
  const warrior = state.roster.find((w) => w.id === id);
  const [activeTab, setActiveTab] = useState("overview");

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      const nextRoster = state.roster.map((w) =>
        w.id === warrior.id ? { ...w, plan: newPlan } : w
      );
      setState({ ...state, roster: nextRoster });
    },
    [warrior, state, setState]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    const updated = retireWarrior(state, warrior.id);
    setState(updated);
    toast.success(`${warrior.name} has been retired with honor.`);
    navigate("/");
  }, [warrior, state, setState, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      const nextRoster = state.roster.map((w) =>
        w.id === warrior.id ? { ...w, equipment: newLoadout } : w
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
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={handleRetire} className="gap-1.5 text-muted-foreground hover:text-destructive">
          <Armchair className="h-3.5 w-3.5" /> Retire
        </Button>
      </div>

      {/* Hero */}
      <div className="relative rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-4 sm:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-arena-fame/5 to-arena-gold/5" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide break-all">{warrior.name}</h1>
              {warrior.champion && (
                <Badge className="bg-arena-gold text-black gap-1">
                  <Trophy className="h-3 w-3" /> Champion
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground font-display">
              {STYLE_DISPLAY_NAMES[warrior.style]}
            </p>
            <p className="font-mono text-sm text-muted-foreground mt-1">{record}</p>
            {warrior.age && (
              <p className="text-xs text-muted-foreground mt-1">Age: {warrior.age}</p>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {warrior.flair.map((f) => (
                <TagBadge key={f} tag={f} type="flair" />
              ))}
              {warrior.titles.map((t) => (
                <TagBadge key={t} tag={t} type="title" />
              ))}
              {warrior.injuries.map((i) => {
                const injName = typeof i === "string" ? i : i.name;
                return <TagBadge key={injName} tag={injName} type="injury" />;
              })}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Flame className="h-6 w-6 text-arena-fame mx-auto mb-1" />
              <div className="text-2xl font-bold">{warrior.fame}</div>
              <div className="text-xs text-muted-foreground">Fame</div>
            </div>
            <div className="text-center">
              <Star className="h-6 w-6 text-arena-pop mx-auto mb-1" />
              <div className="text-2xl font-bold">{warrior.popularity}</div>
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
                <Shield className="h-5 w-5 text-primary" /> Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ATTRIBUTE_KEYS.map((key) => (
                <AttrBar
                  key={key}
                  label={ATTRIBUTE_LABELS[key]}
                  value={warrior.attributes[key]}
                />
              ))}
              <div className="pt-2 text-xs text-muted-foreground">
                Total: {ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0)} / 70
              </div>
            </CardContent>
          </Card>

          {/* Base Skills + Physicals */}
          <div className="space-y-4">
            {warrior.baseSkills && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Swords className="h-5 w-5 text-arena-gold" /> Base Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(warrior.baseSkills).map(([key, val]) => (
                    <SkillBar key={key} label={key} value={val} />
                  ))}
                </CardContent>
              </Card>
            )}

            {warrior.derivedStats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-destructive" /> Physicals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Hit Points</div>
                      <div className="text-lg font-bold">{warrior.derivedStats.hp}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Endurance</div>
                      <div className="text-lg font-bold">{warrior.derivedStats.endurance}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Damage</div>
                      <div className="text-lg font-bold">{DAMAGE_LABELS[warrior.derivedStats.damage]}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3 border border-border">
                      <div className="text-xs text-muted-foreground">Carry Cap</div>
                      <div className="text-lg font-bold">{warrior.derivedStats.encumbrance}</div>
                    </div>
                  </div>
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
          warriorName={warrior.name}
        />
      )}

      {/* Equipment Tab */}
      {activeTab === "equipment" && warrior.derivedStats && (
        <EquipmentLoadoutUI
          loadout={currentLoadout}
          style={warrior.style}
          carryCap={warrior.derivedStats.encumbrance}
          onChange={handleEquipmentChange}
        />
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <WarriorFightHistory warriorName={warrior.name} arenaHistory={state.arenaHistory} />
      )}
    </div>
  );
}
