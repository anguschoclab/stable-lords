/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore, reconstructGameState } from '@/state/useGameStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Trophy, Play, UserPlus, Settings2, Zap, AlertTriangle, Medal } from 'lucide-react';
import { audioManager } from '@/lib/AudioManager';
import { engineProxy } from '@/engine/workerProxy';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

// Modular Components
import { TournamentBracket } from '@/components/tournaments/TournamentBracket';
import { TournamentHistory } from '@/components/tournaments/TournamentHistory';
import { TournamentPrepDialog } from '@/components/tournaments/TournamentPrepDialog';
import { TournamentSchedule } from '@/components/tournaments/TournamentSchedule';

const SEASON_NAMES: Record<string, string> = {
  Spring: 'Spring Classic',
  Summer: 'Summer Cup',
  Fall: 'Fall Clash',
  Winter: 'Winter Crown',
};

const SEASON_ICONS: Record<string, string> = {
  Spring: '🌿',
  Summer: '☀️',
  Fall: '🍂',
  Winter: '❄️',
};

const TIER_PRIZES: Record<string, { first: number; second: number; third: number }> = {
  Gold: { first: 5000, second: 2500, third: 1200 },
  Silver: { first: 2500, second: 1250, third: 600 },
  Bronze: { first: 1200, second: 600, third: 300 },
  Iron: { first: 600, second: 300, third: 150 },
};

function getFatigueLabel(fatigue: number | undefined): { label: string; color: string } {
  const f = fatigue ?? 0;
  if (f < 30) return { label: 'Fresh', color: 'text-primary' };
  if (f < 60) return { label: 'Tired', color: 'text-arena-gold' };
  return { label: 'Exhausted', color: 'text-destructive' };
}

export default function Tournaments() {
  const {
    tournaments,
    season,
    roster,
    week,
    year,
    arenaHistory,
    player,
    activeSlotId,
    loadGame,
    setSimulating,
  } = useGameStore();

  const [expandedBout, setExpandedBout] = useState<string | null>(null);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [hasShownPrep, setHasShownPrep] = useState(false);

  const currentTournament = useMemo(
    () => tournaments.find((t) => t.season === season && !t.completed),
    [tournaments, season]
  );

  const activeWarriors = useMemo(() => roster.filter((w) => w.status === 'Active'), [roster]);

  // Warriors belonging to the player that are in the active tournament
  const playerWarriorsInTournament = useMemo(() => {
    if (!currentTournament || !player) return [];
    return currentTournament.participants.filter((w) => w.stableId === player.id);
  }, [currentTournament, player]);

  const pastTournaments = useMemo(
    () => tournaments.filter((t) => t.completed).reverse(),
    [tournaments]
  );

  // 🌩️ Protocol Sync: Auto-open prep dialog if tournament is ready but not started
  const isTournamentReadyToStart = useMemo(() => {
    if (!currentTournament) return false;
    return currentTournament.bracket.every((b) => b.winner === undefined);
  }, [currentTournament]);

  React.useEffect(() => {
    const hasAlreadyStarted = currentTournament?.bracket.some((b) => b.winner !== undefined);
    if (isTournamentReadyToStart && !hasShownPrep && !hasAlreadyStarted) {
      setIsPrepOpen(true);
      setHasShownPrep(true);
      audioManager.play('clash'); // Thematic entrance sound
    }

    // ⚔️ 1.0 Atmospheric: Trigger ambient arena sound when on this page
    audioManager.play('arena_ambient');
  }, [isTournamentReadyToStart, hasShownPrep, currentTournament]);

  const handleExecuteRound = useCallback(async () => {
    if (!currentTournament) return;

    setSimulating(true);
    try {
      const state = useGameStore.getState();
      const currentFullState = reconstructGameState(state);

      const { updatedState, roundResults } = await engineProxy.resolveTournamentRound(
        currentFullState,
        currentTournament.id,
        Date.now()
      );

      loadGame(activeSlotId || 'autosave', updatedState);
      audioManager.play('clash');
      toast.success(roundResults.length > 0 ? 'Round resolved.' : 'Tournament complete.');
    } catch (error) {
      console.error('Tournament resolution failed:', error);
      toast.error('Resolution failed.');
    } finally {
      setSimulating(false);
    }
  }, [currentTournament, activeSlotId, loadGame, setSimulating]);

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Trophy}
        eyebrow="Seasonal Campaigns"
        title="Imperial Tournaments"
        subtitle={`${season.toUpperCase()} SEASON · YEAR ${year}`}
        actions={
          <div className="flex items-center gap-3">
            {!currentTournament && activeWarriors.length < 2 && (
              <Link to="/ops/recruit">
                <Button
                  variant="outline"
                  className="h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2 rounded-none border-white/10 hover:bg-white/5 transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" /> RECRUIT UNITS
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* ── Pre-tournament readiness banner ── */}
      {currentTournament && playerWarriorsInTournament.length > 0 && (
        <div className="pt-4">
          <SectionDivider label="Operative Readiness" />
          <Surface
            variant="glass"
            className="flex flex-col gap-6 p-6 border-l-4 border-l-primary shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImperialRing size="sm" variant="blood">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </ImperialRing>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                  Combat Status Audit
                </span>
              </div>
              {(() => {
                const prizes = TIER_PRIZES[currentTournament.tierId];
                if (!prizes) return null;
                return (
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-none">
                    <Medal className="h-3.5 w-3.5 text-arena-gold" />
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-foreground/70">
                      <span>{prizes.first.toLocaleString()}g</span>
                      <span className="opacity-20 text-[8px]">|</span>
                      <span>{prizes.second.toLocaleString()}g</span>
                      <span className="opacity-20 text-[8px]">|</span>
                      <span>{prizes.third.toLocaleString()}g</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerWarriorsInTournament.map((w) => {
                const { label: fatigueLabel, color: fatigueColor } = getFatigueLabel(w.fatigue);
                const hasInjuries = w.injuries && w.injuries.length > 0;
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black uppercase tracking-tight text-foreground/90">
                        {w.name}
                      </span>
                      {hasInjuries ? (
                        <div className="flex items-center gap-1.5 text-destructive animate-pulse">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest">
                            {w.injuries.length === 1
                              ? w.injuries[0].severity
                              : `${w.injuries.length} INJURIES`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                          Status: Nominal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-widest',
                          fatigueColor
                        )}
                      >
                        {fatigueLabel}
                      </span>
                      <div className="h-1 w-12 bg-white/5 mt-1">
                        <div
                          className={cn(
                            'h-full transition-all',
                            (w.fatigue ?? 0) < 30
                              ? 'bg-primary'
                              : (w.fatigue ?? 0) < 60
                                ? 'bg-arena-gold'
                                : 'bg-destructive'
                          )}
                          style={{ width: `${Math.min(100, w.fatigue ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>
        </div>
      )}

      {currentTournament && (
        <div className="pt-8">
          <SectionDivider label="Active Manifest" variant="primary" />
          <Surface
            variant="glass"
            padding="none"
            className="border-primary/20 shadow-[0_0_50px_-10px_rgba(135,34,40,0.15)] overflow-hidden"
          >
            <div className="pb-6 bg-primary/5 border-b border-white/5 p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <ImperialRing size="md" variant="blood">
                  <span className="text-xl">{SEASON_ICONS[season]}</span>
                </ImperialRing>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                    Tournament Active
                  </span>
                  <h3 className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
                    {currentTournament.name}
                  </h3>
                </div>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] px-6 py-2 rounded-none animate-pulse">
                LIVE PHASE
              </Badge>
            </div>

            <div className="p-0">
              <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                <TournamentSchedule tournament={currentTournament} currentWeek={week} />
              </div>

              <div className="py-12 bg-gradient-to-b from-transparent to-white/[0.02]">
                <TournamentBracket
                  bouts={currentTournament.bracket}
                  arenaHistory={arenaHistory}
                  expandedBout={expandedBout}
                  onToggleExpand={setExpandedBout}
                />
              </div>

              {currentTournament.bracket.some((b) => b.winner === undefined) && (
                <div className="flex flex-col gap-6 p-8 border-t border-white/5 bg-primary/5">
                  <div className="flex gap-6">
                    <Button
                      onClick={handleExecuteRound}
                      className="flex-1 h-16 font-black uppercase text-[12px] tracking-[0.4em] bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(135,34,40,0.4)] transition-all rounded-none"
                    >
                      <Play className="h-5 w-5 mr-4 fill-current" /> EXECUTE NEXT BOUT
                    </Button>
                  </div>

                  {isTournamentReadyToStart && (
                    <Button
                      variant="outline"
                      onClick={() => setIsPrepOpen(true)}
                      className="w-full h-12 font-black uppercase text-[10px] tracking-[0.2em] gap-3 bg-white/5 border-white/10 hover:bg-white/10 transition-all rounded-none"
                    >
                      <Settings2 className="h-4 w-4" /> OPEN PREPARATION CONSOLE
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Surface>
        </div>
      )}

      <div className="space-y-6 pt-12">
        <SectionDivider label="Campaign Archives" />
        <TournamentHistory
          pastTournaments={pastTournaments}
          seasonIcons={SEASON_ICONS}
          seasonNames={SEASON_NAMES}
          currentSeason={season}
        />
      </div>
      <TournamentPrepDialog
        isOpen={isPrepOpen}
        onOpenChange={setIsPrepOpen}
        activeWarriors={activeWarriors}
        seasonName={SEASON_NAMES[season] ?? season}
        onStart={() => setIsPrepOpen(false)}
      />
    </PageFrame>
  );
}
