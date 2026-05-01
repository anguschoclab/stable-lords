import { useMemo, useCallback, useState, useEffect } from 'react';
import { useGameStore } from '@/state/useGameStore';
import type { GameState } from '@/types/state.types';
import type { Trainer } from '@/types/shared.types';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/shared.types';
import {
  TRAINER_FOCUSES,
  TRAINER_MAX_PER_STABLE,
  FOCUS_ICONS,
  TIER_BONUS,
  TIER_COST,
  generateHiringPool,
  convertRetiredToTrainer,
  type TrainerTier,
} from '@/engine/trainers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WarriorNameTag, StatBadge } from '@/components/ui/WarriorBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  UserPlus,
  RefreshCw,
  Armchair,
  Zap,
  Users,
  Coins,
  ChevronRight,
  Award,
  Skull,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { TrainerCard } from '@/components/stable/TrainerCard';
import { canTransact } from '@/utils/economyUtils';
import { generateId } from '@/utils/idUtils';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { toast } from 'sonner';

export default function Trainers() {
  // Flat destructuring from 1.0 store
  const { trainers, hiringPool, week, retired, graveyard, treasury, setState } = useGameStore();

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
    toast.success('Personnel registry updated. New candidates available.');
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
          category: 'trainer',
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
    () => retired.filter((w) => !currentTrainers.some((t) => t.retiredFromWarrior === w.name)),
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
      toast.success(
        `${warrior.name} confirmed for the retirement-to-trainer protocol. Tactical specialization: ${trainer.focus}.`
      );
      setConvertDialogOpen(false);
    },
    [retired, setState]
  );

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Users}
        eyebrow="Personnel Management"
        title="Command Staff"
        subtitle="TACTICAL MASTERY · TRAINING OPERATIONS"
        actions={
          <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-none shadow-2xl">
            <div className="flex flex-col items-center border-r border-white/10 pr-6">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Staff Capacity
              </span>
              <span className="font-display font-black text-primary text-xl flex items-center gap-2 leading-none">
                {currentTrainers.length} <span className="opacity-20">/</span>{' '}
                {TRAINER_MAX_PER_STABLE}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                Personnel Budget
              </span>
              <span className="font-display font-black text-arena-gold text-xl flex items-center gap-2 leading-none">
                {treasury.toLocaleString()}G
              </span>
            </div>
          </div>
        }
      />

      <Tabs defaultValue="current" className="space-y-12">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-14 rounded-none w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="current"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <GraduationCap className="h-4 w-4" /> Operational Staff
          </TabsTrigger>
          <TabsTrigger
            value="hire"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <UserPlus className="h-4 w-4" /> Tactical Hire
          </TabsTrigger>
          <TabsTrigger
            value="mentors"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Award className="h-4 w-4" /> Legacy Mentors
          </TabsTrigger>
          <TabsTrigger
            value="legends"
            className="gap-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-none font-black uppercase text-[11px] tracking-[0.2em]"
          >
            <Skull className="h-4 w-4" /> Fallen Legends
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="current"
          className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 gap-8">
            {currentTrainers.length === 0 ? (
              <Surface
                variant="glass"
                className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
              >
                <ImperialRing size="lg" variant="bronze" className="opacity-20">
                  <GraduationCap className="h-8 w-8" />
                </ImperialRing>
                <div className="space-y-2">
                  <h4 className="font-display font-black uppercase tracking-widest text-muted-foreground/60">
                    Personnel Database Empty
                  </h4>
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] italic max-w-sm mx-auto">
                    Establish your training core by recruiting specialists from the tactical hire
                    registry.
                  </p>
                </div>
              </Surface>
            ) : (
              <div className="space-y-6">
                <SectionDivider label="Active Personnel" variant="primary" />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {currentTrainers.map((t) => (
                    <TrainerCard key={t.id} trainer={t} owned onFire={() => fireTrainer(t.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {currentTrainers.length > 0 && (
            <div className="space-y-8">
              <SectionDivider label="Aggregated System Bonuses" variant="gold" />
              <Surface
                variant="glass"
                padding="none"
                className="border-white/5 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-arena-gold/40" />
                <div className="p-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-12">
                  {TRAINER_FOCUSES.map((focus) => {
                    const total = currentTrainers
                      .filter((t) => t.focus === focus && t.contractWeeksLeft > 0)
                      .reduce((sum, t) => sum + (TIER_BONUS[t.tier as TrainerTier] ?? 1), 0);

                    return (
                      total > 0 && (
                        <div
                          key={focus}
                          className="group relative flex flex-col items-center gap-6"
                        >
                          <div className="text-5xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6">
                            {FOCUS_ICONS[focus]}
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <span className="text-3xl font-display font-black text-foreground">
                                +{total}
                              </span>
                              <Zap className="h-4 w-4 text-arena-gold animate-pulse" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-primary transition-colors">
                              {focus}
                            </span>
                          </div>
                        </div>
                      )
                    );
                  })}
                </div>
              </Surface>
            </div>
          )}

          {convertableRetired.length > 0 && canHire && (
            <div className="mt-12">
              <Button
                onClick={() => setConvertDialogOpen(true)}
                className="w-full h-20 bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-all rounded-none flex items-center justify-center gap-6 group"
              >
                <ImperialRing
                  size="md"
                  variant="blood"
                  className="group-hover:scale-110 transition-transform"
                >
                  <Armchair className="h-5 w-5" />
                </ImperialRing>
                <div className="text-left">
                  <span className="text-[12px] font-black uppercase tracking-[0.3em] block mb-1">
                    Veteran Reassignment Protocol
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest italic">
                    {convertableRetired.length} Retired Assets Ready for Staff Transition
                  </span>
                </div>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="hire"
          className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] border border-white/5 p-8 rounded-none gap-8">
            <div className="flex items-center gap-5">
              <ImperialRing size="md" variant="blood">
                <RefreshCw className="h-5 w-5 text-primary" />
              </ImperialRing>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none mb-1.5">
                  Personnel Registry
                </h3>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">
                  {currentHiringPool.length} Tactical Candidates Located
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refreshPool}
              className="h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-3 rounded-none border-white/10 hover:bg-white/5 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 group-hover:rotate-180 transition-all duration-700" />
              Update Registry
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {currentHiringPool.map((t) => (
              <TrainerCard
                key={t.id}
                trainer={t}
                owned={false}
                action={
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Acquisition
                      </span>
                      <span className="font-display font-black text-arena-gold text-lg leading-none">
                        {TIER_COST[t.tier as TrainerTier] ?? 50}G
                      </span>
                    </div>

                    <Button
                      disabled={
                        !canHire || !canTransact(treasury, TIER_COST[t.tier as TrainerTier] ?? 50)
                      }
                      onClick={() => hireTrainer(t)}
                      className="h-12 px-8 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] rounded-none hover:shadow-[0_0_20px_rgba(135,34,40,0.3)] transition-all"
                    >
                      <UserPlus className="h-4 w-4 mr-3" />
                      Secure Contract
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="mentors"
          className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <SectionDivider label="Legacy Mentors" variant="gold" />
          {(() => {
            const ranked = [...currentTrainers]
              .map((t) => ({
                t,
                score: (t.legacyWins ?? 0) * 2 + (t.legacyKills ?? 0) * 3 + (t.fame ?? 0),
              }))
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 8);
            if (ranked.length === 0) {
              return (
                <Surface
                  variant="glass"
                  className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Award className="h-8 w-8" />
                  </ImperialRing>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                    No mentor legacy recorded yet.
                  </p>
                </Surface>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ranked.map(({ t, score }, i) => (
                  <Surface
                    key={t.id}
                    variant="glass"
                    className="p-6 border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-display font-black text-arena-gold/30 group-hover:text-arena-gold transition-colors w-8 text-center">
                        {i + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-tight text-foreground">
                          {t.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                          {t.tier} · {t.focus} SPECIALIST
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground/30 text-[8px] mb-1">Wins</span>
                        <span className="text-primary">{t.legacyWins ?? 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground/30 text-[8px] mb-1">Kills</span>
                        <span className="text-destructive">{t.legacyKills ?? 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground/30 text-[8px] mb-1">Score</span>
                        <span className="text-arena-gold">{score}</span>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent
          value="legends"
          className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <SectionDivider label="Fallen Legends" variant="blood" />
          {(() => {
            const fallen = [
              ...(graveyard ?? []).map((w) => ({
                name: w.name,
                style: w.style,
                kind: 'fallen' as const,
                fame: w.fame ?? 0,
                week: (w as any).deathWeek,
              })),
              ...(retired ?? []).map((w) => ({
                name: w.name,
                style: w.style,
                kind: 'retired' as const,
                fame: w.fame ?? 0,
                week: (w as any).retiredWeek ?? 0,
              })),
            ]
              .sort((a, b) => b.fame - a.fame)
              .slice(0, 12);
            if (fallen.length === 0) {
              return (
                <Surface
                  variant="glass"
                  className="py-32 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Skull className="h-8 w-8" />
                  </ImperialRing>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                    No legends memorialized in the archives.
                  </p>
                </Surface>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fallen.map((w, i) => (
                  <Surface
                    key={`${w.kind}-${w.name}-${i}`}
                    variant="glass"
                    className="p-6 border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cn(
                          'p-3 border transition-all',
                          w.kind === 'fallen'
                            ? 'bg-destructive/5 border-destructive/20 text-destructive'
                            : 'bg-white/5 border-white/10 text-muted-foreground/40'
                        )}
                      >
                        {w.kind === 'fallen' ? (
                          <Skull className="h-4 w-4" />
                        ) : (
                          <Armchair className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-tight text-foreground">
                          {w.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                          {STYLE_DISPLAY_NAMES[w.style as FightingStyle]} ·{' '}
                          {w.kind === 'fallen' ? 'Fallen' : 'Retired'} · Wk {w.week}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground/30 text-[8px] font-black uppercase tracking-widest block mb-1">
                        Fame
                      </span>
                      <span className="font-display font-black text-arena-gold text-xl leading-none">
                        {w.fame}
                      </span>
                    </div>
                  </Surface>
                ))}
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="bg-neutral-950/95 backdrop-blur-2xl border-white/10 sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0 rounded-none">
          <div className="p-10 border-b border-white/5 bg-primary/5">
            <h3 className="font-display text-3xl font-black uppercase tracking-tight flex items-center gap-6">
              <ImperialRing size="lg" variant="blood">
                <GraduationCap className="h-8 w-8 text-primary" />
              </ImperialRing>
              Veteran Reassignment
            </h3>
          </div>

          <div className="p-10 space-y-6 overflow-y-auto no-scrollbar">
            {convertableRetired.map((w) => {
              const preview = convertRetiredToTrainer(w);
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black uppercase tracking-tight">{w.name}</span>
                      <StatBadge styleName={w.style as FightingStyle} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest rounded-none">
                        {preview.tier} Staff
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest italic">
                        Specialization: {preview.focus}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => convertWarrior(w.id)}
                    className="h-10 px-6 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-none"
                  >
                    Establish Staff
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
