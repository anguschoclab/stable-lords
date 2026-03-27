/**
 * Stable Lords — Trainers Page
 * Hire, manage, fire trainers. Convert retired warriors to trainers.
 */
import React, { useMemo, useCallback, useState } from "react";
import { useGameStore } from "@/state/useGameStore";
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
} from "@/engine/trainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { StatBadge } from "@/components/ui/StatBadge";
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
import { GraduationCap, UserPlus, UserMinus, RefreshCw, Armchair, Sparkles, Clock, Coins, Trophy, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIER_ACCENTS: Record<string, string> = {
  Novice: "border-border/40 text-muted-foreground",
  Seasoned: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  Master: "border-arena-gold text-arena-gold bg-arena-gold/10 shadow-[0_0_15px_-5px_rgba(255,215,0,0.3)]",
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
  const tierAccent = TIER_ACCENTS[trainer.tier] ?? "";
  const desc = FOCUS_DESCRIPTIONS[trainer.focus as TrainerFocus] ?? "";
  const bonus = TIER_BONUS[trainer.tier as TrainerTier] ?? 1;

  return (
    <Card className={cn(
      "bg-glass-card border overflow-hidden transition-all duration-300 group",
      tierAccent
    )}>
      <CardContent className="p-0 flex items-stretch min-h-[120px]">
        <div className={cn("w-1.5 shrink-0", trainer.tier === "Master" ? "bg-arena-gold" : "bg-primary/40")} />
        <div className="p-5 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-background/40 border border-border/20 flex items-center justify-center shrink-0 shadow-inner text-2xl group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div>
                <div className="font-display text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                  {trainer.name}
                  {trainer.tier === "Master" && <Badge className="bg-arena-gold text-black text-[9px] font-black h-4 px-1">ELITE</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5", tierAccent)}>
                    {trainer.tier} GRADE
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                     <Target className="h-3 w-3" /> {trainer.focus} SPECIALIST
                  </span>
                  {trainer.retiredFromWarrior && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-arena-fame border-arena-fame/30 bg-arena-fame/5">
                      <GraduationCap className="h-2.5 w-2.5 mr-1" /> EX-{trainer.retiredFromWarrior.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {owned && onFire && (
              <Button variant="ghost" size="icon" onClick={onFire} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 h-8 w-8">
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-background/20 px-4 py-2.5 rounded-xl border border-border/20 flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground block">STAFF PERFORMANCE</span>
                  <span className="flex items-center gap-1.5 font-bold text-sm text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> +{bonus} TO {trainer.focus.toUpperCase()}
                  </span>
                </div>
                {trainer.styleBonusStyle && (
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground block">STYLE MASTERY</span>
                    <span className="flex items-center gap-1.5 font-bold text-xs text-arena-gold">
                       <Trophy className="h-3 w-3" /> {STYLE_DISPLAY_NAMES[trainer.styleBonusStyle as keyof typeof STYLE_DISPLAY_NAMES] ?? trainer.styleBonusStyle}
                    </span>
                  </div>
                )}
             </div>
             
             <div className="flex items-center h-full">
                 {owned ? (
                     <div className="w-full bg-secondary/10 px-4 py-2 rounded-lg border border-border/10 flex items-center justify-between">
                         <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">CONTRACT DURATION</span>
                         <span className="font-mono font-bold text-xs flex items-center gap-1.5">
                           <Clock className="h-3.5 w-3.5 text-arena-fame" /> {trainer.contractWeeksLeft} WEEKS
                         </span>
                     </div>
                 ) : (
                     <p className="text-[11px] text-muted-foreground italic leading-snug pl-3 border-l-2 border-primary/20">
                       {desc}
                     </p>
                 )}
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Trainers() {
  const { state, setState } = useGameStore();
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const currentTrainers = useMemo(() => state.trainers ?? [], [state.trainers]);
  const hiringPool = useMemo(() => state.hiringPool ?? [], [state.hiringPool]);
  const canHire = (currentTrainers || []).length < TRAINER_MAX_PER_STABLE;

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
    [state, setState, canHire, currentTrainers, hiringPool]
  );

  const fireTrainer = useCallback(
    (trainerId: string) => {

      const trainer = (currentTrainers || []).find((t) => t.id === trainerId);
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
      (w) => !(state.trainers ?? []).some((t) => t.retiredFromWarrior === w.name)
    ),
    [state.retired, state.trainers]
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
        trainers: [...(state.trainers ?? []), trainerData],
      });
      toast.success(`${warrior.name} returns as a ${trainer.tier} ${trainer.focus} trainer!`);
      setConvertDialogOpen(false);
    },
    [state, setState, canHire]
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
            <Card className="bg-glass border-neon-gold border-2 overflow-hidden">
              <CardHeader className="pb-3 border-b border-arena-gold/20 bg-arena-gold/5">
                <CardTitle className="font-display font-black uppercase text-xs tracking-widest text-arena-gold flex items-center gap-2">
                   <Zap className="h-4 w-4" /> Aggregated Training Multipliers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {TRAINER_FOCUSES.map((focus) => {
                    const total = currentTrainers
                      .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                      .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);
                    if (total === 0) return null;
                    return (
                      <div key={focus} className="group relative overflow-hidden flex flex-col items-center gap-2 rounded-2xl bg-background/40 p-4 border border-border/40 hover:border-primary/50 transition-all">
                        <div className="text-3xl filter saturate-50 group-hover:saturate-100 transition-all">
                          {FOCUS_ICONS[focus]}
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-display font-black text-primary block">+{total}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{focus}</span>
                        </div>
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
                            <div className="flex items-center gap-2 mb-1">
                              <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                              <StatBadge styleName={w.style} career={w.career} />
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
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs gap-1">
                      <Coins className="h-3 w-3 text-arena-gold" />
                      {TIER_COST[t.tier as TrainerTier] ?? 50}g
                    </Badge>
                    <Button
                      size="sm"
                      disabled={!canHire || (state.gold ?? 0) < (TIER_COST[t.tier as TrainerTier] ?? 50)}
                      onClick={() => hireTrainer(t)}
                      className="gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {!canHire ? "Full" : (state.gold ?? 0) < (TIER_COST[t.tier as TrainerTier] ?? 50) ? "Can't Afford" : "Hire"}
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
