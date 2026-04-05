/**
 * Stable Lords — Recruit Page (Post-FTUE)
 * Two tabs: Scout Pool (pre-generated warriors) and Custom Build.
 * Implements Stable_Lords_Orphanage_Recruitment_Spec_v1.0
 */
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGameStore } from "@/state/useGameStore";
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Attributes } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";
import { makeWarrior } from "@/state/gameStore";
import { DAMAGE_LABELS } from "@/engine/skillCalc";
import {
  generateRecruitPool, fullRefreshPool,
  type PoolWarrior, type RecruitTier,
  TIER_COST, TIER_STARS, REFRESH_COST,
} from "@/engine/recruitment";
import { potentialRating, potentialGrade } from "@/engine/potential";
import WarriorBuilder from "@/components/WarriorBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/WarriorBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Coins, Star, UserPlus, RefreshCw, Hammer, Search,
  Shield, Swords, Heart, Zap, Users, Eye, Clock, Quote
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CUSTOM_COST = 200;

const TIER_ACCENTS: Record<RecruitTier, string> = {
  Common: "border-border/40 text-muted-foreground",
  Promising: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  Exceptional: "border-purple-500/50 text-purple-400 bg-purple-500/10 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]",
  Prodigy: "border-arena-gold text-arena-gold bg-arena-gold/10 shadow-[0_0_20px_-5px_rgba(255,215,0,0.4)]",
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 font-black uppercase tracking-widest ${TIER_ACCENTS[tier]}`}>
      {stars > 0 && Array.from({ length: stars }).map((_, i) => <Star key={i} className="h-2 w-2 fill-current" />)} 
      {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-black uppercase text-muted-foreground w-6 text-right font-mono tracking-tighter">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden border border-border/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            value >= 16 ? "bg-primary glow-neon-green" : value >= 12 ? "bg-arena-gold glow-neon-gold" : "bg-muted-foreground/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold w-4 text-right text-foreground/80">{value}</span>
    </div>
  );
}

function RecruitCard({
  warrior, canAfford, rosterFull, onRecruit, isScouted, onScout, canAffordScout
}: {
  warrior: PoolWarrior; canAfford: boolean; rosterFull: boolean; onRecruit: (w: PoolWarrior) => void;
  isScouted: boolean; onScout: (w: PoolWarrior) => void; canAffordScout: boolean;
}) {
  const grade = potentialGrade(potentialRating(warrior.potential));
  const isElite = warrior.tier === "Prodigy" || warrior.tier === "Exceptional";

  return (
    <Card className={cn(
      "bg-glass-card border overflow-hidden transition-all duration-300 group",
      isElite ? "border-arena-gold/30 hover:border-arena-gold" : "border-border/40 hover:border-primary/50",
      TIER_ACCENTS[warrior.tier]
    )}>
      <CardHeader className="pb-2 pt-5 px-5 relative">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="font-display font-black uppercase text-sm tracking-tight group-hover:text-primary transition-colors">
            {warrior.name}
          </CardTitle>
          <TierBadge tier={warrior.tier} />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
          <StatBadge styleName={warrior.style} showFullName />
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> AGE {warrior.age}</span>
          {isScouted && (
            <Badge className={cn(
               "text-[10px] ml-auto font-black px-2 py-0 h-4",
               grade === 'S' || grade === 'A' ? 'bg-primary text-black' : 'bg-secondary text-muted-foreground'
            )}>
              POTENTIAL: {grade}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 space-y-4">
        {/* Attributes Grid */}
        <div className="space-y-1.5 bg-background/20 p-3 rounded-xl border border-border/20">
          {ATTRIBUTE_KEYS.map(key => (
            <StatBar key={key} label={key} value={warrior.attributes[key]} />
          ))}
        </div>

        {/* Derived Stats Mini-Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-border/10">
            <Heart className="h-3.5 w-3.5 text-destructive" />
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground font-black uppercase">HIT POINTS</p>
              <p className="text-xs font-mono font-bold">{warrior.derivedStats.hp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-border/10">
            <Zap className="h-3.5 w-3.5 text-arena-fame" />
            <div className="flex-1">
              <p className="text-[9px] text-muted-foreground font-black uppercase">ENDURANCE</p>
              <p className="text-xs font-mono font-bold">{warrior.derivedStats.endurance}</p>
            </div>
          </div>
        </div>

        {/* Lore / Bio */}
        <div className="relative">
           <Quote className="h-4 w-4 text-primary/20 absolute -top-2 -left-2" />
           <p className="text-[11px] text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-primary/20">
             {warrior.lore}
           </p>
        </div>

        {/* Cost & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground font-black uppercase tracking-tighter">CONTRACT FEE</span>
            <div className="flex items-center gap-1.5 text-base font-display font-black text-arena-gold">
              <Coins className="h-4 w-4" />
              {warrior.cost}G
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isScouted && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-[10px] font-black uppercase tracking-widest px-3 border-border/40 hover:bg-primary/10"
                disabled={!canAffordScout}
                onClick={() => onScout(warrior)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5 text-primary" />
                SCOUT [25G]
              </Button>
            )}
            <Button
              size="sm"
              className={cn(
                "h-9 px-4 font-black uppercase tracking-widest",
                isElite ? "bg-arena-gold text-black hover:bg-arena-gold/80" : "bg-primary text-black hover:bg-primary/80"
              )}
              disabled={!canAfford || rosterFull}
              onClick={() => onRecruit(warrior)}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              HIRE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recruit() {
  const { state, setState } = useGameStore();
  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (state.rosterBonus ?? 0);

  // Gather all used names (roster + graveyard + retired + rivals)
  const usedNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of state.roster) names.add(w.name);
    for (const w of state.graveyard) names.add(w.name);
    for (const w of state.retired) names.add(w.name);
    for (const r of state.rivals || []) {
      for (const w of r.roster) names.add(w.name);
    }
    return names;
  }, [state.roster, state.graveyard, state.retired, state.rivals]);

  // Initialize pool from state or generate fresh
  const [pool, setPool] = useState<PoolWarrior[]>(() => {
    if ((state as import("@/types/game").GameState).recruitPool?.length > 0) return (state as import("@/types/game").GameState).recruitPool;
    return generateRecruitPool(5, state.week, usedNames);
  });
  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());

  const gold = state.gold ?? 0;
  const rosterFull = state.roster.length >= MAX_ROSTER;
  const canRefresh = gold >= REFRESH_COST;

  // Persist pool to state
  const persistPool = useCallback((newPool: PoolWarrior[], newState?: typeof state) => {
    const base = newState ?? state;
    setState({ ...base, recruitPool: newPool } as import("@/types/game").GameState);
    setPool(newPool);
  }, [setState]);

  const handleRecruit = useCallback((w: PoolWarrior) => {
    setState((prev) => {
      const currentGold = prev.gold ?? 0;
      if (currentGold < w.cost) {
        toast.error(`Not enough gold! Need ${w.cost}g.`);
        return prev;
      }
      if (prev.roster.length >= MAX_ROSTER) {
        toast.error("Roster full! Retire or release a warrior first.");
        return prev;
      }

      const warrior = makeWarrior(
        `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
        w.name, w.style, w.attributes,
        { age: w.age, potential: w.potential }
      );

      const newPool = (prev.recruitPool ?? []).filter(p => p.id !== w.id);
      setPool(newPool);
      toast.success(`${w.name} has joined your stable! (-${w.cost}g)`);

      return {
        ...prev,
        roster: [...prev.roster, warrior],
        gold: currentGold - w.cost,
        recruitPool: newPool,
        ledger: [...(prev.ledger ?? []), {
          week: prev.week,
          label: `Recruit: ${w.name} (${w.tier})`,
          amount: -w.cost,
          category: "recruit" as const,
        }],
        newsletter: [...(prev.newsletter ?? []), {
          week: prev.week,
          title: "Recruitment",
          items: [`${prev.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`],
        }],
      };
    });
  }, [MAX_ROSTER, setState]);

  const handleScout = useCallback((w: PoolWarrior) => {
    setState((prev) => {
      const currentGold = prev.gold ?? 0;
      if (currentGold < 25) {
        toast.error("Not enough gold to scout potential (need 25g).");
        return prev;
      }
      setScoutedIds(s => new Set(s).add(w.id));
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
      return {
        ...prev,
        gold: currentGold - 25,
        ledger: [...(prev.ledger ?? []), {
          week: prev.week,
          label: `Scout Potential: ${w.name}`,
          amount: -25,
          category: "other" as const,
        }],
      };
    });
  }, [setState]);

  const handleRefresh = useCallback(() => {
    setState((prev) => {
      const currentGold = prev.gold ?? 0;
      if (currentGold < REFRESH_COST) {
        toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
        return prev;
      }
      const newPool = fullRefreshPool(prev.week, usedNames);
      setPool(newPool);
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
      return {
        ...prev,
        gold: currentGold - REFRESH_COST,
        recruitPool: newPool,
        ledger: [...(prev.ledger ?? []), {
          week: prev.week,
          label: "Pool refresh",
          amount: -REFRESH_COST,
          category: "other" as const,
        }],
      };
    });
  }, [usedNames, setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      setState((prev) => {
        const currentGold = prev.gold ?? 0;
        if (currentGold < CUSTOM_COST) {
          toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
          return prev;
        }
        if (prev.roster.length >= MAX_ROSTER) {
          toast.error("Roster full!");
          return prev;
        }
        const id = `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);
        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
        return {
          ...prev,
          roster: [...prev.roster, warrior],
          gold: currentGold - CUSTOM_COST,
          ledger: [...(prev.ledger ?? []), {
            week: prev.week,
            label: `Custom Build: ${data.name}`,
            amount: -CUSTOM_COST,
            category: "recruit" as const,
          }],
        };
      });
    },
    [setState, navigate, MAX_ROSTER]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => history.back()} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-display font-bold">Recruit Warriors</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 font-mono">
            <Users className="h-3 w-3" />
            {state.roster.length}/{MAX_ROSTER}
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-mono">
            <Coins className="h-3 w-3 text-arena-gold" />
            {gold}g
          </Badge>
        </div>
      </div>

      {rosterFull && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Roster full! Retire or release a warrior before recruiting.
        </div>
      )}

      <Tabs defaultValue="scout" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="scout" className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Scout Pool
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5">
            <Hammer className="h-3.5 w-3.5" />
            Custom Build
          </TabsTrigger>
        </TabsList>

        {/* Scout Pool Tab */}
        <TabsContent value="scout" className="mt-4 space-y-4">
          {/* Refresh bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pool.length} warrior{pool.length !== 1 ? "s" : ""} available · Pool refreshes weekly
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRefresh}
              disabled={!canRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh ({REFRESH_COST}g)
            </Button>
          </div>

          {/* Tier Legend */}
          <div className="flex flex-wrap gap-2">
            {(["Common", "Promising", "Exceptional", "Prodigy"] as RecruitTier[]).map(tier => (
              <div key={tier} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TierBadge tier={tier} />
                <span>{TIER_COST[tier]}g</span>
              </div>
            ))}
          </div>

          {/* Warrior Grid */}
          {pool.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pool.map(w => (
                <RecruitCard
                  key={w.id}
                  warrior={w}
                  canAfford={gold >= w.cost}
                  rosterFull={rosterFull}
                  onRecruit={handleRecruit}
                  isScouted={scoutedIds.has(w.id)}
                  onScout={handleScout}
                  canAffordScout={gold >= 25}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No warriors in the scout pool. Refresh to find new recruits!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Custom Build Tab */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
            <Hammer className="h-4 w-4 inline mr-1.5" />
            Custom warriors cost <span className="font-semibold text-foreground">{CUSTOM_COST}g</span> and start with 66 total attribute points. You choose the distribution.
            {gold < CUSTOM_COST && (
              <span className="text-destructive ml-1">
                (Need {CUSTOM_COST - gold}g more)
              </span>
            )}
          </div>
          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={state.roster.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
