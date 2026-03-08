/**
 * Stable Lords — Trainers Page
 * Hire, manage, fire trainers. Convert retired warriors to trainers.
 */
import React, { useMemo, useCallback, useState } from "react";
import { useGame } from "@/state/GameContext";
import type { TrainerData } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import {
  TRAINER_FOCUSES,
  TRAINER_MAX_PER_STABLE,
  FOCUS_DESCRIPTIONS,
  FOCUS_ICONS,
  TIER_BONUS,
  TIER_COST,
  generateHiringPool,
  convertRetiredToTrainer,
  type TrainerFocus,
  type TrainerTier,
} from "@/modules/trainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, UserPlus, UserMinus, RefreshCw, Armchair, Sparkles, Clock, Coins } from "lucide-react";
import { toast } from "sonner";

const TIER_COLORS: Record<string, string> = {
  Novice: "text-muted-foreground",
  Seasoned: "text-arena-pop",
  Master: "text-arena-gold",
};

function TrainerCard({
  trainer,
  onFire,
  owned,
}: {
  trainer: TrainerData;
  onFire?: () => void;
  owned: boolean;
}) {
  const icon = FOCUS_ICONS[trainer.focus as TrainerFocus] ?? "📋";
  const tierColor = TIER_COLORS[trainer.tier] ?? "";
  const desc = FOCUS_DESCRIPTIONS[trainer.focus as TrainerFocus] ?? "";
  const bonus = TIER_BONUS[trainer.tier as TrainerTier] ?? 1;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{icon}</span>
            <div>
              <div className="font-display font-semibold text-foreground">{trainer.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${tierColor}`}>
                  {trainer.tier}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {trainer.focus}
                </Badge>
                {trainer.retiredFromWarrior && (
                  <Badge variant="outline" className="text-xs text-arena-fame">
                    <Armchair className="h-3 w-3 mr-1" />
                    Ex-{trainer.retiredFromWarrior}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> +{bonus} {trainer.focus}
                  {trainer.styleBonusStyle && (
                    <span className="text-arena-gold ml-1">
                      (+1 for {STYLE_DISPLAY_NAMES[trainer.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? trainer.styleBonusStyle})
                    </span>
                  )}
                </span>
                {owned && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {trainer.contractWeeksLeft}w left
                  </span>
                )}
              </div>
            </div>
          </div>
          {owned && onFire && (
            <Button variant="ghost" size="icon" onClick={onFire} title="Release trainer" className="text-muted-foreground hover:text-destructive">
              <UserMinus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Trainers() {
  const { state, setState } = useGame();
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const currentTrainers = state.trainers ?? [];
  const hiringPool = state.hiringPool ?? [];
  const canHire = currentTrainers.length < TRAINER_MAX_PER_STABLE;

  // Auto-populate hiring pool on first visit if empty
  React.useEffect(() => {
    if ((state.hiringPool ?? []).length === 0) {
      const pool = generateHiringPool(4, state.week * 1000 + Date.now());
      const poolData: TrainerData[] = pool.map((t) => ({
        id: t.id,
        name: t.name,
        tier: t.tier,
        focus: t.focus,
        fame: t.fame,
        contractWeeksLeft: t.contractWeeksLeft,
        retiredFromWarrior: t.retiredFromWarrior,
        retiredFromStyle: t.retiredFromStyle,
        styleBonusStyle: t.styleBonusStyle,
      }));
      setState({ ...state, hiringPool: poolData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh hiring pool
  const refreshPool = useCallback(() => {
    const pool = generateHiringPool(4, state.week * 1000 + Date.now());
    // Convert Trainer to TrainerData
    const poolData: TrainerData[] = pool.map((t) => ({
      id: t.id,
      name: t.name,
      tier: t.tier,
      focus: t.focus,
      fame: t.fame,
      contractWeeksLeft: t.contractWeeksLeft,
      retiredFromWarrior: t.retiredFromWarrior,
      retiredFromStyle: t.retiredFromStyle,
      styleBonusStyle: t.styleBonusStyle,
    }));
    setState({ ...state, hiringPool: poolData });
    toast.success("New trainers are available for hire!");
  }, [state, setState]);

  const hireTrainer = useCallback(
    (trainer: TrainerData) => {
      if (!canHire) return;
      const cost = TIER_COST[trainer.tier as TrainerTier] ?? 50;
      if ((state.gold ?? 0) < cost) {
        toast.error(`Not enough gold! Need ${cost}g to hire.`);
        return;
      }
      setState({
        ...state,
        trainers: [...currentTrainers, trainer],
        hiringPool: hiringPool.filter((t) => t.id !== trainer.id),
        gold: (state.gold ?? 0) - cost,
        ledger: [...(state.ledger ?? []), {
          week: state.week,
          label: `Hire: ${trainer.name}`,
          amount: -cost,
          category: "trainer" as const,
        }],
      });
      toast.success(`${trainer.name} has joined your stable! (-${cost}g)`);
    },
    [state, setState, currentTrainers, hiringPool, canHire]
  );

  const fireTrainer = useCallback(
    (trainerId: string) => {
      const trainer = currentTrainers.find((t) => t.id === trainerId);
      setState({
        ...state,
        trainers: currentTrainers.filter((t) => t.id !== trainerId),
      });
      if (trainer) toast.success(`${trainer.name} has been released.`);
    },
    [state, setState, currentTrainers]
  );

  const convertableRetired = useMemo(
    () => state.retired.filter(
      (w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)
    ),
    [state.retired, currentTrainers]
  );

  const convertWarrior = useCallback(
    (warriorId: string) => {
      const warrior = state.retired.find((w) => w.id === warriorId);
      if (!warrior || !canHire) return;
      const trainer = convertRetiredToTrainer(warrior);
      const trainerData: TrainerData = {
        id: trainer.id,
        name: trainer.name,
        tier: trainer.tier,
        focus: trainer.focus,
        fame: trainer.fame,
        contractWeeksLeft: trainer.contractWeeksLeft,
        retiredFromWarrior: trainer.retiredFromWarrior,
        retiredFromStyle: trainer.retiredFromStyle,
        styleBonusStyle: trainer.styleBonusStyle,
      };
      setState({
        ...state,
        trainers: [...currentTrainers, trainerData],
      });
      toast.success(`${warrior.name} returns as a ${trainer.tier} ${trainer.focus} trainer!`);
      setConvertDialogOpen(false);
    },
    [state, setState, currentTrainers, canHire]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Trainers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your training staff. Up to {TRAINER_MAX_PER_STABLE} trainers per stable.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-sm">
          {currentTrainers.length}/{TRAINER_MAX_PER_STABLE}
        </Badge>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Your Staff ({currentTrainers.length})
          </TabsTrigger>
          <TabsTrigger value="hire" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Hire
          </TabsTrigger>
        </TabsList>

        {/* Current Trainers */}
        <TabsContent value="current" className="space-y-4 mt-4">
          {currentTrainers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No trainers hired yet. Visit the Hire tab to recruit staff.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {currentTrainers.map((t) => (
                <TrainerCard
                  key={t.id}
                  trainer={t}
                  owned
                  onFire={() => fireTrainer(t.id)}
                />
              ))}
            </div>
          )}

          {/* Training Bonuses Summary */}
          {currentTrainers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Active Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {TRAINER_FOCUSES.map((focus) => {
                    const total = currentTrainers
                      .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                      .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);
                    if (total === 0) return null;
                    return (
                      <div key={focus} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 border border-border">
                        <span>{FOCUS_ICONS[focus]}</span>
                        <span className="text-sm font-semibold">+{total}</span>
                        <span className="text-xs text-muted-foreground">{focus}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Convert retired warriors */}
          {convertableRetired.length > 0 && canHire && (
            <>
              <Separator />
              <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Armchair className="h-4 w-4" />
                    Convert Retired Warrior to Trainer ({convertableRetired.length} available)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="font-display">Convert Retired Warrior</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-[400px] overflow-auto">
                    {convertableRetired.map((w) => {
                      const preview = convertRetiredToTrainer(w);
                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div>
                            <div className="font-display font-semibold text-sm">{w.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {STYLE_DISPLAY_NAMES[w.style]} · {w.career.wins}W-{w.career.losses}L
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              → {preview.tier} {preview.focus} Trainer
                            </div>
                          </div>
                          <Button size="sm" onClick={() => convertWarrior(w.id)}>
                            Convert
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>

        {/* Hiring Pool */}
        <TabsContent value="hire" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hiringPool.length > 0
                ? `${hiringPool.length} trainers available for hire.`
                : "No trainers available. Refresh to see new candidates."}
            </p>
            <Button variant="outline" size="sm" onClick={refreshPool} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Pool
            </Button>
          </div>

          {hiringPool.length > 0 ? (
            <div className="space-y-3">
              {hiringPool.map((t) => (
                <div key={t.id} className="relative">
                  <TrainerCard trainer={t} owned={false} />
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      disabled={!canHire}
                      onClick={() => hireTrainer(t)}
                      className="gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {canHire ? "Hire" : "Full"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Click "Refresh Pool" to see available trainers.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
