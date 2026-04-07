/**
 * Stable Lords — Recruit Page (Post-FTUE)
 * Two tabs: Scout Pool (pre-generated warriors) and Custom Build.
 * Implements Stable_Lords_Orphanage_Recruitment_Spec_v1.0
 */
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGameStore } from "@/state/useGameStore";
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, type Attributes } from "@/types/game";
import { BASE_ROSTER_CAP } from "@/data/constants";
import { makeWarrior } from "@/engine/factories";
import {
  generateRecruitPool, fullRefreshPool,
  type PoolWarrior, type RecruitTier,
  TIER_COST, TIER_STARS, REFRESH_COST,
} from "@/engine/recruitment";
import { canTransact } from "@/utils/economyUtils";
import { potentialRating, potentialGrade } from "@/engine/potential";
import WarriorBuilder from "@/components/WarriorBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatBadge } from "@/components/ui/WarriorBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Coins, Star, UserPlus, RefreshCw, Hammer, Search,
  Heart, Zap, Users, Eye, Clock, Quote
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
  const store = useGameStore();
  const { 
    roster, graveyard, retired, rivals, treasury, week, rosterBonus, player, 
    ledger, newsletter, recruitPool, setState 
  } = store;
  
  const navigate = useNavigate();
  const MAX_ROSTER = BASE_ROSTER_CAP + (rosterBonus ?? 0);

  // Gather all used names (roster + graveyard + retired + rivals)
  const usedNames = useMemo(() => {
    const names = new Set<string>();
    for (const w of roster) names.add(w.name);
    for (const w of graveyard) names.add(w.name);
    for (const w of retired) names.add(w.name);
    for (const r of rivals || []) {
      for (const w of r.roster) names.add(w.name);
    }
    return names;
  }, [roster, graveyard, retired, rivals]);

  const [scoutedIds, setScoutedIds] = useState<Set<string>>(new Set());

  const rosterFull = roster.length >= MAX_ROSTER;
  const canRefresh = canTransact(treasury, REFRESH_COST);

  const handleRecruit = useCallback((w: PoolWarrior) => {
    setState((draft: any) => {
      if (!canTransact(draft.treasury, w.cost)) {
        toast.error(`Not enough funds! Need ${w.cost}g.`);
        return;
      }
      if (draft.roster.length >= MAX_ROSTER) {
        toast.error("Roster full! Retire or release a warrior first.");
        return;
      }

      // 1.0 Deterministic ID: Recruitment uses timestamp + random for uniqueness but logic is engine-fed
      const warrior = makeWarrior(
        `war_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        w.name, w.style, w.attributes,
        { age: w.age, potential: w.potential }
      );

      draft.roster.push(warrior);
      draft.treasury -= w.cost;
      draft.recruitPool = (draft.recruitPool ?? []).filter((p: any) => p.id !== w.id);
      
      draft.ledger.push({
        week: draft.week,
        label: `Recruit: ${w.name} (${w.tier})`,
        amount: -w.cost,
        category: "recruit",
      });

      draft.newsletter.push({
        week: draft.week,
        title: "Recruitment",
        items: [`${draft.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`],
      });

      toast.success(`${w.name} has joined your stable! (-${w.cost}g)`);
    });
  }, [MAX_ROSTER, setState]);

  const handleScout = useCallback((w: PoolWarrior) => {
    setState((draft: any) => {
      if (!canTransact(draft.treasury, 25)) {
        toast.error("Not enough gold to scout potential (need 25g).");
        return;
      }
      setScoutedIds(s => new Set(s).add(w.id));
      draft.treasury -= 25;
      draft.ledger.push({
        week: draft.week,
        label: `Scout Potential: ${w.name}`,
        amount: -25,
        category: "other",
      });
      toast.success(`Scouted potential for ${w.name}! (-25g)`);
    });
  }, [setState]);

  const handleRefresh = useCallback(() => {
    setState((draft: any) => {
      if (!canTransact(draft.treasury, REFRESH_COST)) {
        toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
        return;
      }
      const newPool = fullRefreshPool(draft.week, usedNames);
      draft.treasury -= REFRESH_COST;
      draft.recruitPool = newPool;
      draft.ledger.push({
        week: draft.week,
        label: "Pool refresh",
        amount: -REFRESH_COST,
        category: "other",
      });
      toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
    });
  }, [usedNames, setState]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      setState((draft: any) => {
        if (!canTransact(draft.treasury, CUSTOM_COST)) {
          toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
          return;
        }
        if (draft.roster.length >= MAX_ROSTER) {
          toast.error("Roster full!");
          return;
        }
        const id = `war_custom_${Date.now()}`;
        const warrior = makeWarrior(id, data.name, data.style, data.attributes);
        
        draft.roster.push(warrior);
        draft.treasury -= CUSTOM_COST;
        draft.ledger.push({
          week: draft.week,
          label: `Custom Build: ${data.name}`,
          amount: -CUSTOM_COST,
          category: "recruit",
        });

        toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
        setTimeout(() => navigate({ to: `/warrior/${id}` }), 0);
      });
    },
    [setState, navigate, MAX_ROSTER]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-xl font-display font-bold">Recruit Warriors</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 font-mono">
            <Users className="h-3 w-3" />
            {roster.length}/{MAX_ROSTER}
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-mono">
            <Coins className="h-3 w-3 text-arena-gold" />
            {treasury}g
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {recruitPool.length} warrior{recruitPool.length !== 1 ? "s" : ""} available · Pool refreshes weekly
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

          <div className="flex flex-wrap gap-2">
            {(["Common", "Promising", "Exceptional", "Prodigy"] as RecruitTier[]).map(tier => (
              <div key={tier} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TierBadge tier={tier} />
                <span>{TIER_COST[tier]}g</span>
              </div>
            ))}
          </div>

          {recruitPool.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recruitPool.map(w => (
                <RecruitCard
                  key={w.id}
                  warrior={w}
                  canAfford={canTransact(treasury, w.cost)}
                  rosterFull={rosterFull}
                  onRecruit={handleRecruit}
                  isScouted={scoutedIds.has(w.id)}
                  onScout={handleScout}
                  canAffordScout={canTransact(treasury, 25)}
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
            {!canTransact(treasury, CUSTOM_COST) && (
              <span className="text-destructive ml-1">
                (Need {CUSTOM_COST - treasury}g more)
              </span>
            )}
          </div>
          <WarriorBuilder
            onCreateWarrior={handleCustomCreate}
            maxRoster={MAX_ROSTER}
            currentRosterSize={roster.length}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
