import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, reconstructGameState, type GameStore } from '@/state/useGameStore';
import { type GameState, type Warrior, type RivalStableData } from '@/types/game';
import { generatePairings } from '@/engine/bout/core/pairings';
import { isFightReady } from '@/engine/warriorStatus';
import { processWeekBouts, type BoutResult } from '@/engine/boutProcessor';
import { runAutosim, type AutosimResult } from '@/engine/autosim';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Swords, Zap, Skull, Activity, FastForward, Heart, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Modular Components
import { MatchCard } from '@/components/run-round/MatchCard';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { RunResults } from '@/components/run-round/RunResults';

export default function RunRound() {
  const store = useGameStore();
  const { setState, doAdvanceDay, doAdvanceWeek, setSimulating } = store;
  const navigate = useNavigate();
  const state = useMemo(() => reconstructGameState(store), [store]);
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fightReady = useMemo(
    () => state.roster.filter((w: Warrior) => isFightReady(w)),
    [state.roster]
  );
  const matchCard = useMemo(() => {
    return generatePairings(state).map((p) => ({
      playerWarrior: p.a,
      rivalWarrior: p.d,
      rivalStable:
        state.rivals.find((r: RivalStableData) => r.owner.id === p.rivalStableId) ||
        ({ owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData),
      isRivalryBout: p.isRivalry,
    }));
  }, [state]);

  const handleExecuteCycle = useCallback(() => {
    if (running) return;
    setRunning(true);

    if (matchCard.length === 0 && fightReady.length < 2) {
      setRunning(false);
      toast.error('Mission aborted: insufficient personnel sync.');
      return;
    }

    const processed = processWeekBouts(state);
    setResults(processed.results);

    if (state.isTournamentWeek) {
      doAdvanceDay(
        undefined,
        processed.results,
        processed.summary.deathNames,
        processed.summary.injuryNames
      );
      toast.success(`Day ${state.day + 1} finalized.`);
    } else {
      doAdvanceWeek(
        undefined,
        processed.results,
        processed.summary.deathNames,
        processed.summary.injuryNames
      );
      toast.success(`Week ${state.week} archival sequence completed.`);
    }

    setRunning(false);
    setExpandedId(null);
    setTimeout(() => navigate({ to: '/command' }), 1500);
  }, [state, running, matchCard, fightReady.length, doAdvanceDay, doAdvanceWeek, navigate]);

  const handleStartAutosim = useCallback(
    async (weeks: number) => {
      if (autosimming) return;
      setAutosimming(true);
      setSimulating(true);
      setAutosimResult(null);

      try {
        const result = await runAutosim(state, weeks, (currentWeek: number) => {
          setAutosimProgress({ current: currentWeek, total: weeks });
        });

        setAutosimResult(result);
        setState((draft: GameStore) => {
          Object.assign(draft, result.finalState);
        });
      } catch (err) {
        console.error('Autosim failed', err);
        toast.error('Simulation interrupt: memory leak detected.');
      } finally {
        setAutosimming(false);
        setSimulating(false);
      }
    },
    [state, setState, autosimming, setSimulating]
  );

  return (
    <PageFrame size="md">
      <PageHeader
        eyebrow="MISSION_EXECUTION"
        title="Engagement Console"
        subtitle={`WEEK ${state.week} · ${state.season.toUpperCase()} SEASON · ${state.crowdMood.toUpperCase()} MOOD`}
        icon={Swords}
      />

      {/* Main Focus: Execution & Roster Status */}
      <div className="space-y-12">
        <Surface
          variant="glass"
          className="p-8 border-primary/20 bg-primary/[0.02] flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-12 mb-10">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
                Units Ready
              </div>
              <div className="text-3xl font-display font-black text-foreground">
                {fightReady.length}
              </div>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
                Paired Bouts
              </div>
              <div className="text-3xl font-display font-black text-arena-gold">
                {matchCard.length}
              </div>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">
                Medical List
              </div>
              <div className="text-3xl font-display font-black text-destructive">
                {state.roster.filter((w) => (w.fatigue ?? 0) > 70 || w.status === 'Injured').length}
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
            <Button
              onClick={handleExecuteCycle}
              disabled={running || (matchCard.length === 0 && fightReady.length < 2)}
              className="relative h-20 px-12 rounded-none bg-primary text-black font-black uppercase text-base tracking-[0.3em] hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)]"
            >
              <Zap className="h-5 w-5 mr-4 fill-current" />
              {state.isTournamentWeek
                ? `EXECUTE_DAY_${state.day + 1}`
                : `EXECUTE_WEEK_${state.week}`}
              <ChevronRight className="h-5 w-5 ml-4" />
            </Button>
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
            {running ? 'SYNCING_WITH_ARENA_RECORDS...' : 'AWAITING_COMMAND_AUTHORIZATION'}
          </p>
        </Surface>

        {/* Manifest / Results Section */}
        <section className="space-y-8">
          <SectionDivider
            label={results.length > 0 ? 'Execution Report' : 'Active Engagement Manifest'}
            variant="primary"
          />

          <div className="mx-auto">
            {results.length > 0 ? (
              <RunResults
                results={results}
                expandedId={expandedId}
                onToggleExpand={setExpandedId}
              />
            ) : (
              <div className="space-y-4">
                {matchCard.length > 0 ? (
                  matchCard.map((p, i) => (
                    <MatchCard
                      key={i}
                      pairing={{
                        a: p.playerWarrior,
                        d: p.rivalWarrior,
                        rivalStable: p.rivalStable?.owner?.stableName || 'Independent',
                        isRivalry: p.isRivalryBout,
                      }}
                      crowdMood={state.crowdMood}
                    />
                  ))
                ) : (
                  <Surface
                    variant="glass"
                    className="py-24 text-center border-dashed border-white/5"
                  >
                    <Skull className="h-12 w-12 mx-auto mb-6 opacity-20 text-muted-foreground" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Zero Engagement Pairs Detected
                      <br />
                      <span className="text-[9px] opacity-60">
                        Warriors may be unassigned or incapacitated.
                      </span>
                    </p>
                  </Surface>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Autosim Bridge */}
        <section className="pt-12 border-t border-white/5">
          <SectionDivider label="Auto Simulation Bridge" />
          <div className="mt-8">
            <AutosimConsole
              isSimulating={autosimming}
              progress={autosimProgress}
              result={autosimResult}
              onStart={handleStartAutosim}
            />
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
