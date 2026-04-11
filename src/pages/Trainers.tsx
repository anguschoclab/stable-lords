import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useGameStore } from "@/state/useGameStore";
import type { GameState } from "@/types/state.types";
import type { Trainer } from "@/types/shared.types";
import { STYLE_DISPLAY_NAMES, FightingStyle } from "@/types/shared.types";
import {
  TRAINER_FOCUSES,
  TRAINER_MAX_PER_STABLE,
  FOCUS_ICONS,
  TIER_BONUS,
  TIER_COST,
  generateHiringPool,
  convertRetiredToTrainer,
  type TrainerTier,
} from "@/engine/trainers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WarriorNameTag, StatBadge } from "@/components/ui/WarriorBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GraduationCap, UserPlus, RefreshCw, Armchair, Zap, Users, Coins, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { TrainerCard } from "@/components/stable/TrainerCard";
import { canTransact } from "@/utils/economyUtils";
import { generateId } from "@/utils/idUtils";
import { SeededRNGService } from "@/engine/core/rng/SeededRNGService";
import { toast } from "sonner";

export default function Trainers() {
  // Flat destructuring from 1.0 store
  const { 
    trainers, hiringPool, week, retired, treasury, 
    setState 
  } = useGameStore();

  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const currentTrainers = useMemo(() => trainers ?? [], [trainers]);
  const currentHiringPool = useMemo(() => hiringPool ?? [], [hiringPool]);
  const canHire = currentTrainers.length < TRAINER_MAX_PER_STABLE;

  // Auto-populate hiring pool on first visit if empty
  useEffect(() => {
    if (currentHiringPool.length === 0) {
      const pool = generateHiringPool(4, week * 1000 + Date.now());
      setState((draft: GameState) => {
        draft.hiringPool = pool;
      });
    }
  }, [currentHiringPool.length, week, setState]);

  // Refresh hiring pool
  const refreshPool = useCallback(() => {
    const pool = generateHiringPool(4, week * 1000 + Date.now());
    setState((draft: GameState) => {
      draft.hiringPool = pool;
    });
    toast.success("Personnel registry updated. New candidates available.");
  }, [week, setState]);

  const hireTrainer = useCallback(
    (trainer: Trainer) => {
      const cost = TIER_COST[trainer.tier as TrainerTier] ?? 50;
      if (!canTransact(treasury, cost)) {
        toast.error(`Insufficient credits. Access to ${trainer.name} requires ${cost}G.`);
        return;
      }
      setState((draft: GameState) => {
        draft.trainers.push(trainer);
        draft.hiringPool = draft.hiringPool.filter((t) => t.id !== trainer.id);
        draft.treasury -= cost;
        draft.ledger.push({
          id: new SeededRNGService(Date.now()).uuid(),
          week: draft.week,
          label: `Acquisition: ${trainer.name}`,
          amount: -cost,
          category: "trainer",
        });
      });
      toast.success(`${trainer.name} has signed with your stable. Personnel synchronized.`);
    },
    [treasury, setState]
  );

  const fireTrainer = useCallback(
    (trainerId: string) => {
      setState((draft: GameState) => {
        draft.trainers = draft.trainers.filter((t) => t.id !== trainerId);
      });
    },
    [setState]
  );

  const convertableRetired = useMemo(
    () => retired.filter(
      (w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)
    ),
    [retired, currentTrainers]
  );

  const convertWarrior = useCallback(
    (warriorId: string) => {
      const warrior = retired.find((w) => w.id === warriorId);
      if (!warrior) return;
      const trainer = convertRetiredToTrainer(warrior);
      setState((draft: GameState) => {
        draft.trainers.push(trainer);
      });
      toast.success(`${warrior.name} confirmed for the retirement-to-trainer protocol. Tactical specialization: ${trainer.focus}.`);
      setConvertDialogOpen(false);
    },
    [retired, setState]
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Personnel Management"
        subtitle="STABLE_STAFF // TACTICAL_MASTERY // RECRUITMENT_REVEAL"
        icon={Users}
        actions={
          <div className="flex flex-col md:flex-row items-center gap-6 bg-neutral-900/40 backdrop-blur-md px-6 py-3 rounded-xl border border-white/5 shadow-inner">
             <div className="flex flex-col items-center border-r border-white/10 pr-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Staff Capacity</span>
                <span className="font-mono font-black text-primary text-lg flex items-center gap-1.5 leading-none">
                   {currentTrainers.length} <span className="opacity-20">/</span> {TRAINER_MAX_PER_STABLE} <Users className="h-3.5 w-3.5" />
                </span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Personnel Budget</span>
                <span className="font-mono font-black text-arena-gold text-lg flex items-center gap-1.5 leading-none">
                   {treasury} <Coins className="h-3.5 w-3.5" />
                </span>
             </div>
          </div>
        }
      />

      <Tabs defaultValue="current" className="space-y-8">
        <TabsList className="bg-neutral-900/60 border border-white/5 p-1 h-12 rounded-xl">
          <TabsTrigger value="current" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-lg font-black uppercase text-[10px] tracking-widest">
            <GraduationCap className="h-3.5 w-3.5" /> Stability Staff
          </TabsTrigger>
          <TabsTrigger value="hire" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-lg font-black uppercase text-[10px] tracking-widest">
            <UserPlus className="h-3.5 w-3.5" /> Tactical Hire
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            {currentTrainers.length === 0 ? (
               <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
                  <GraduationCap className="h-12 w-12 text-muted-foreground opacity-20" />
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-display font-black uppercase tracking-tight text-muted-foreground">Personnel Database Empty</p>
                    <p className="text-xs text-muted-foreground/60 italic max-w-xs mx-auto text-center">Establish your training core by recruiting specialists from the tactical hire registry.</p>
                  </div>
               </Surface>
            ) : (
              <div className="space-y-4">
                 <div className="flex items-center gap-3 px-1 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">STAFF_PERSONNEL</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
                 </div>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {currentTrainers.map((t) => (
                      <TrainerCard
                        key={t.id}
                        trainer={t}
                        owned
                        onFire={() => fireTrainer(t.id)}
                      />
                    ))}
                 </div>
              </div>
            )}
          </div>

          {currentTrainers.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arena-gold">AGGREGATED_SYSTEM_BONUSES</span>
                 <div className="h-px flex-1 bg-gradient-to-r from-arena-gold/20 via-border/20 to-transparent" />
              </div>
              <Surface variant="glass" padding="none" className="border-border/40 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-arena-gold opacity-40 shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                  {TRAINER_FOCUSES.map((focus) => {
                    const total = currentTrainers
                      .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                      .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);
                    
                    return total > 0 && (
                      <div key={focus} className="group relative flex flex-col items-center gap-6 p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="text-4xl filter group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all duration-500">
                          {FOCUS_ICONS[focus]}
                        </div>
                        <div className="text-center relative">
                           <div className="flex items-center justify-center gap-1.5 mb-1">
                              <span className="text-3xl font-display font-black text-white leading-none">+{total}</span>
                              <Zap className={cn("h-4 w-4 transition-all duration-500", total > 0 ? "text-arena-gold animate-pulse" : "text-muted-foreground/20")} />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{focus} PROTOCOL</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Surface>
            </div>
          )}

          {convertableRetired.length > 0 && canHire && (
            <div className="pt-8 border-t border-white/5">
              <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center gap-4 group hover:bg-primary/20 hover:border-primary transition-all">
                    <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary transition-colors">
                       <Armchair className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary block leading-none mb-1">Veteran Restoration Protocol</span>
                       <span className="text-[9px] text-muted-foreground/60 uppercase tracking-widest leading-none italic">{convertableRetired.length} Retired Assets Ready for Re-acquisition</span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-950/95 backdrop-blur-2xl border-white/10 sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader className="p-6 border-b border-white/5 flex flex-col gap-4">
                    <DialogTitle className="font-display text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                       <div className="p-2 rounded-xl bg-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                          <GraduationCap className="h-6 w-6" />
                       </div>
                       Retired_to_Staff_Sync
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed uppercase tracking-widest font-medium border-l-2 border-primary/20 pl-4 italic">
                       Confirmed veterans are eligible for immediate tactical reassignment. This protocol restores legendary combat signatures as specialized staff assets.
                    </p>
                  </DialogHeader>
                  
                  <div className="p-6 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {convertableRetired.map((w) => {
                      const preview = convertRetiredToTrainer(w);
                      return (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-white/5 group hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-center gap-6">
                            <div>
                               <div className="flex items-center gap-3 mb-2">
                                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} useCrown={w.champion} />
                                  <StatBadge styleName={w.style as FightingStyle} />
                                </div>
                               <div className="flex items-center gap-2">
                                  <ChevronRight className="h-3 w-3 text-primary" />
                                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary rounded-none">
                                     {preview.tier} {preview.focus} SPECIALIST
                                  </Badge>
                               </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => convertWarrior(w.id)}
                            className="bg-primary text-white px-6 py-2.5 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all"
                          >
                             ESTABLISH_Staff
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hire" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between bg-neutral-900/60 p-6 rounded-2xl border border-white/5 gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <RefreshCw className="h-6 w-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground leading-none mb-1.5">Candidate Database</h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest leading-none">
                    {currentHiringPool.length > 0 ? `Confirmed Search Result: ${currentHiringPool.length} Candidates Located` : "Scanning Personnel Database..."}
                  </p>
               </div>
            </div>
            <button 
              onClick={refreshPool} 
              className="flex items-center gap-2.5 bg-neutral-950 border border-white/10 hover:border-primary/50 px-5 py-2.5 rounded-xl transition-all group/refresh"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:rotate-180 transition-all duration-700" />
              <span className="text-[10px] font-black uppercase tracking-widest">Update_Registry</span>
            </button>
          </div>

          {currentHiringPool.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {currentHiringPool.map((t) => (
                <TrainerCard 
                  key={t.id} 
                  trainer={t} 
                  owned={false} 
                  action={
                    <div className="flex items-center gap-3">
                       <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black border border-white/5 font-mono font-black text-xs text-arena-gold shadow-inner">
                                <Coins className="h-3.5 w-3.5" /> {TIER_COST[t.tier as TrainerTier] ?? 50}G
                             </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black uppercase tracking-widest">ACQUISITION_CREDITS</TooltipContent>
                       </Tooltip>
                       
                        <button
                          disabled={!canHire || !canTransact(treasury, TIER_COST[t.tier as TrainerTier] ?? 50)}
                          onClick={() => hireTrainer(t)}
                          className={cn(
                            "flex items-center gap-2 px-5 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all",
                            !canHire || !canTransact(treasury, TIER_COST[t.tier as TrainerTier] ?? 50)
                              ? "bg-neutral-900 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
                              : "bg-primary text-white border border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95"
                          )}
                       >
                          <UserPlus className="h-4 w-4" />
                          {!canHire ? "CAPACITY_FULL" : !canTransact(treasury, TIER_COST[t.tier as TrainerTier] ?? 50) ? "FUNDS_LOCKED" : "Secure_Contract"}
                       </button>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <Surface variant="glass" className="py-24 text-center border-dashed border-border/40 flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 text-muted-foreground opacity-20 animate-spin duration-3000" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Waiting_for_Connection...</p>
            </Surface>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
