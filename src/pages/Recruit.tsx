/**
 * Stable Lords — Recruit Page (Post-FTUE)
 * Two tabs: Scout Pool (pre-generated warriors) and Custom Build.
 * Implements Stable_Lords_Orphanage_Recruitment_Spec_v1.0
 */
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/state/GameContext";
import { FightingStyle, STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, BASE_ROSTER_CAP, type Attributes } from "@/types/game";
import { makeWarrior } from "@/state/gameStore";
import { DAMAGE_LABELS } from "@/engine/skillCalc";
import {
  generateRecruitPool, fullRefreshPool,
  type PoolWarrior, type RecruitTier,
  TIER_COST, TIER_STARS, REFRESH_COST,
} from "@/engine/recruitment";
import WarriorBuilder from "@/components/WarriorBuilder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Coins, Star, UserPlus, RefreshCw, Hammer, Search,
  Shield, Swords, Heart, Zap, Users,
} from "lucide-react";
import { toast } from "sonner";

const CUSTOM_COST = 200;
const MAX_ROSTER = 10;

const TIER_COLORS: Record<RecruitTier, string> = {
  Common: "bg-secondary text-secondary-foreground",
  Promising: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Exceptional: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  Prodigy: "bg-primary/15 text-primary border-primary/30",
};

function TierBadge({ tier }: { tier: RecruitTier }) {
  const stars = TIER_STARS[tier];
  return (
    <Badge variant="outline" className={`text-xs gap-0.5 ${TIER_COLORS[tier]}`}>
      {stars > 0 && "⭐".repeat(stars)} {tier}
    </Badge>
  );
}

function StatBar({ label, value, max = 21 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-6 text-right font-mono">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            value >= 15 ? "bg-primary" : value >= 11 ? "bg-amber-500" : "bg-muted-foreground/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono w-4 text-right">{value}</span>
    </div>
  );
}

function RecruitCard({
  warrior, canAfford, rosterFull, onRecruit,
}: {
  warrior: PoolWarrior; canAfford: boolean; rosterFull: boolean; onRecruit: (w: PoolWarrior) => void;
}) {
  const styleName = STYLE_DISPLAY_NAMES[warrior.style] ?? warrior.style;

  return (
    <Card className="overflow-hidden hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-base">{warrior.name}</CardTitle>
          <TierBadge tier={warrior.tier} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{styleName}</Badge>
          <span>Age {warrior.age}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Attributes */}
        <div className="space-y-1">
          {ATTRIBUTE_KEYS.map(key => (
            <StatBar key={key} label={key} value={warrior.attributes[key]} />
          ))}
        </div>

        {/* Derived Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-destructive" />
            <span className="text-muted-foreground">HP</span>
            <span className="font-mono ml-auto">{warrior.derivedStats.hp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-muted-foreground">End</span>
            <span className="font-mono ml-auto">{warrior.derivedStats.endurance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Swords className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Dmg</span>
            <span className="font-mono ml-auto">{DAMAGE_LABELS[warrior.derivedStats.damage] ?? warrior.derivedStats.damage}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Enc</span>
            <span className="font-mono ml-auto">{warrior.derivedStats.encumbrance}</span>
          </div>
        </div>

        {/* Lore */}
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">{warrior.lore}</p>

        {/* Cost & Recruit Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Coins className="h-3.5 w-3.5 text-arena-gold" />
            {warrior.cost}g
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!canAfford || rosterFull}
            onClick={() => onRecruit(warrior)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Recruit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recruit() {
  const { state, setState } = useGame();
  const navigate = useNavigate();

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
    if ((state as any).recruitPool?.length > 0) return (state as any).recruitPool;
    return generateRecruitPool(5, state.week, usedNames);
  });

  const gold = state.gold ?? 0;
  const rosterFull = state.roster.length >= MAX_ROSTER;
  const canRefresh = gold >= REFRESH_COST;

  // Persist pool to state
  const persistPool = useCallback((newPool: PoolWarrior[], newState?: typeof state) => {
    const base = newState ?? state;
    setState({ ...base, recruitPool: newPool } as any);
    setPool(newPool);
  }, [state, setState]);

  const handleRecruit = useCallback((w: PoolWarrior) => {
    if (gold < w.cost) {
      toast.error(`Not enough gold! Need ${w.cost}g.`);
      return;
    }
    if (rosterFull) {
      toast.error("Roster full! Retire or release a warrior first.");
      return;
    }

    const warrior = makeWarrior(
      `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      w.name, w.style, w.attributes,
      { age: w.age, potential: w.potential }
    );

    const newPool = pool.filter(p => p.id !== w.id);
    const updatedState = {
      ...state,
      roster: [...state.roster, warrior],
      gold: gold - w.cost,
      ledger: [...(state.ledger ?? []), {
        week: state.week,
        label: `Recruit: ${w.name} (${w.tier})`,
        amount: -w.cost,
        category: "recruit" as const,
      }],
      newsletter: [...state.newsletter, {
        week: state.week,
        title: "Recruitment",
        items: [`${state.player.stableName} signed ${w.name}, a ${w.tier.toLowerCase()} ${STYLE_DISPLAY_NAMES[w.style]}.`],
      }],
    };

    persistPool(newPool, updatedState);
    toast.success(`${w.name} has joined your stable! (-${w.cost}g)`);
  }, [gold, rosterFull, pool, state, persistPool]);

  const handleRefresh = useCallback(() => {
    if (!canRefresh) {
      toast.error(`Not enough gold! Need ${REFRESH_COST}g to refresh.`);
      return;
    }
    const newPool = fullRefreshPool(state.week, usedNames);
    const updatedState = {
      ...state,
      gold: gold - REFRESH_COST,
      ledger: [...(state.ledger ?? []), {
        week: state.week,
        label: "Pool refresh",
        amount: -REFRESH_COST,
        category: "other" as const,
      }],
    };
    persistPool(newPool, updatedState);
    toast.success(`Scout pool refreshed! (-${REFRESH_COST}g)`);
  }, [canRefresh, gold, state, usedNames, persistPool]);

  const handleCustomCreate = useCallback(
    (data: { name: string; style: FightingStyle; attributes: Attributes }) => {
      if (gold < CUSTOM_COST) {
        toast.error(`Not enough gold! Need ${CUSTOM_COST}g for custom build.`);
        return;
      }
      if (rosterFull) {
        toast.error("Roster full!");
        return;
      }
      const id = `w_${Date.now()}_${Math.floor(Math.random() * 1e5)}`;
      const warrior = makeWarrior(id, data.name, data.style, data.attributes);
      setState({
        ...state,
        roster: [...state.roster, warrior],
        gold: gold - CUSTOM_COST,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Custom Build: ${data.name}`,
          amount: -CUSTOM_COST,
          category: "recruit" as const,
        }],
      });
      toast.success(`${data.name} has joined your stable! (-${CUSTOM_COST}g)`);
      navigate(`/warrior/${id}`);
    },
    [state, setState, navigate, gold, rosterFull]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
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
