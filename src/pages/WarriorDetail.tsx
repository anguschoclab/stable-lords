/**
 * Stable Lords — Warrior Detail
 * Deep dive into a single warrior's stats, history, and equipment.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { obfuscateWarrior } from "@/lib/obfuscation";
import { useGameStore } from "@/state/useGameStore";
import { STYLE_DISPLAY_NAMES, type Warrior, type FightPlan } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Trophy, Flame, Star, Shield, Armchair, 
  Target, Crosshair, Zap, Activity, Eye, TrendingUp, ScrollText, User
} from "lucide-react";
import { TagBadge } from "@/components/ui/WarriorBadges";
import PlanBuilder from "@/components/PlanBuilder";
import { SchedulingWidget } from "@/components/widgets/SchedulingWidget";
import EquipmentLoadoutUI from "@/components/EquipmentLoadout";
import { defaultPlanForWarrior } from "@/engine/simulate";
import { computeStreaks } from "@/engine/gazetteNarrative";
import { retireWarrior } from "@/state/gameStore";
import { DEFAULT_LOADOUT, type EquipmentLoadout } from "@/data/equipment";
import { toast } from "sonner";
import SubNav, { type SubNavTab } from "@/components/SubNav";
import { WarriorRadarChart } from "@/components/charts/WarriorRadarChart";
import { FormSparkline } from "@/components/charts/FormSparkline";

// Extracted Components
import { overallGrowthNarrative } from "@/components/warrior/GrowthHelpers";
import { AttrBar, SkillBar, WarriorStatementsPanel } from "@/components/warrior/WarriorStats";
import { FavoritesCard } from "@/components/warrior/FavoritesCard";
import { CareerTimeline } from "@/components/warrior/CareerTimeline";
import { WarriorFightHistory } from "@/components/warrior/WarriorFightHistory";

const TABS: SubNavTab[] = [
  { id: "biometrics", label: "Biometrics", icon: <User className="h-4 w-4" /> },
  { id: "mission", label: "Mission Control", icon: <Target className="h-4 w-4" /> },
  { id: "chronicle", label: "Chronicle", icon: <ScrollText className="h-4 w-4" /> },
];

export default function WarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { state, setState } = useGameStore();

  const [activeTab, setActiveTab] = useState("biometrics");

  // Find warrior across all possible states
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

  if (!warrior || !displayWarrior) {
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

  const currentPlan = warrior.plan ?? defaultPlanForWarrior(warrior);
  const currentLoadout = warrior.equipment ?? DEFAULT_LOADOUT;
  const record = `${displayWarrior.career.wins}W - ${displayWarrior.career.losses}L - ${displayWarrior.career.kills}K`;

  const streakMap = computeStreaks(state.arenaHistory);
  const streakVal = streakMap.get(displayWarrior.name) ?? 0;
  const streakLabel = streakVal > 0 ? `🔥 ${streakVal}W streak` : streakVal < 0 ? `${Math.abs(streakVal)}L streak` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/"><Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button></Link>
        {isPlayerOwned && warrior.status === "Active" && (
          <Button variant="outline" size="sm" onClick={handleRetire} className="gap-1.5 text-muted-foreground hover:text-destructive transition-colors">
            <Armchair className="h-3.5 w-3.5" /> Retire
          </Button>
        )}
      </div>

      {/* Hero Header */}
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
              {displayWarrior.style === "UNKNOWN" ? "Unknown Style" : STYLE_DISPLAY_NAMES[displayWarrior.style as keyof typeof STYLE_DISPLAY_NAMES]}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-sm text-muted-foreground">{record}</p>
              {streakLabel && (
                <Badge variant={streakVal > 0 ? "default" : "destructive"} className="text-xs gap-1">
                  {streakLabel}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {displayWarrior.flair.map((f) => <TagBadge key={f} tag={f} type="flair" />)}
              {displayWarrior.titles.map((t) => <TagBadge key={t} tag={t} type="title" />)}
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

      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Biometrics Tab */}
      {activeTab === "biometrics" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-glass-card border-neon border overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-secondary/10">
                <CardTitle className="font-display font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Physical Polygon
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <WarriorRadarChart warrior={warrior} />
                <div className="mt-8 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Recent Form</span>
                      <FormSparkline warriorId={warrior.id} />
                   </div>
                   <Separator className="opacity-40" />
                   <div className="pt-2 text-xs flex items-start gap-2">
                     <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                     <p className="text-muted-foreground italic leading-relaxed">{overallGrowthNarrative(warrior)}</p>
                   </div>
                </div>
              </CardContent>
            </Card>
            <FavoritesCard warrior={warrior} onUpdate={() => {}} />
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-glass-card border-border/40 border">
                <CardHeader className="pb-3 bg-secondary/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" /> Physical Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  <AttrBar label="Strength" value={warrior.attributes.ST} potential={warrior.potential?.ST} />
                  <AttrBar label="Constitution" value={warrior.attributes.CN} potential={warrior.potential?.CN} />
                  <AttrBar label="Deftness" value={warrior.attributes.DF} potential={warrior.potential?.DF} />
                  <AttrBar label="Speed" value={warrior.attributes.SP} potential={warrior.potential?.SP} />
                  <AttrBar label="Size" value={warrior.attributes.SZ} potential={warrior.potential?.SZ} />
                </CardContent>
              </Card>

              <Card className="bg-glass-card border-border/40 border">
                <CardHeader className="pb-3 bg-secondary/5">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" /> Coach's Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 overflow-y-auto max-h-[300px] no-scrollbar">
                  <WarriorStatementsPanel warrior={warrior} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-glass-card border-border/40 border overflow-hidden">
               <div className="p-6 bg-gradient-to-r from-secondary/20 to-transparent">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-arena-gold" /> Skillset Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                    {displayWarrior.baseSkills && Object.entries(displayWarrior.baseSkills).map(([skill, val]) => (
                      <SkillBar key={skill} label={skill.toUpperCase()} value={val as number} />
                    ))}
                  </div>
               </div>
            </Card>
          </div>
        </div>
      )}

      {/* Mission Control Tab */}
      {activeTab === "mission" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-glass-card border-neon-gold border-2 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-arena-gold/10 px-8 py-4 border-b border-arena-gold/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crosshair className="h-5 w-5 text-arena-gold" />
                  <span className="font-display font-black uppercase tracking-widest text-sm">Targeting & Engagement Protocols</span>
                </div>
                <Badge className="bg-arena-gold text-black px-4">Manual Override Active</Badge>
              </div>
              <div className="p-8">
                <PlanBuilder warrior={warrior} plan={currentPlan!} onPlanChange={handlePlanChange} warriorName={displayWarrior.name} />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-glass-card border-neon rounded-2xl overflow-hidden border">
                <div className="bg-secondary/10 px-6 py-4 border-b border-border/40 flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-display font-black uppercase tracking-widest text-xs">Armory Loadout</span>
                </div>
                <div className="p-6">
                  <EquipmentLoadoutUI
                    loadout={currentLoadout}
                    style={warrior.style}
                    carryCap={warrior.derivedStats?.encumbrance ?? 0}
                    warriorAttrs={warrior.attributes}
                    onChange={handleEquipmentChange}
                  />
                </div>
              </div>
              <div className="bg-glass-card border-neon rounded-2xl overflow-hidden border">
                <div className="bg-secondary/10 px-6 py-4 border-b border-border/40 flex items-center gap-3">
                  <Target className="h-4 w-4 text-accent" />
                  <span className="font-display font-black uppercase tracking-widest text-xs">Scouting Assist</span>
                </div>
                <div className="p-2 h-full overflow-y-auto max-h-[600px] no-scrollbar">
                  <SchedulingWidget warrior={warrior} />
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Chronicle Tab */}
      {activeTab === "chronicle" && (
        <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 space-y-6">
             <CareerTimeline warrior={warrior} arenaHistory={state.arenaHistory} />
             <Card className="bg-glass-card border-border/40 border">
                <CardHeader className="bg-secondary/5">
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Trophy className="h-4 w-4 text-arena-gold" /> Hall of Records
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Highest Fame</span>
                      <span className="font-mono font-bold">{warrior.fame}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Tournaments Won</span>
                      <span className="font-mono font-bold">{warrior.career.wins > 10 ? 1 : 0}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Total Payout</span>
                      <span className="font-mono font-bold text-arena-gold">${warrior.career.wins * 150}</span>
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-glass-card border-border/40 border rounded-3xl overflow-hidden min-h-[600px]">
              <div className="bg-secondary/10 px-8 py-6 border-b border-border/40">
                 <h2 className="font-display font-black uppercase text-2xl tracking-tighter">Engagement Archive</h2>
              </div>
              <div className="p-8">
                 <WarriorFightHistory warriorName={warrior.name} arenaHistory={state.arenaHistory} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
