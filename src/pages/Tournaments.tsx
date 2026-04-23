/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore, reconstructGameState } from "@/state/useGameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags, aiPlanForWarrior } from "@/engine";
import { type TournamentEntry, type TournamentBout, type FightSummary, type Warrior, FightingStyle } from "@/types/game";
import { generateId } from "@/utils/idUtils";
import { hashStr } from "@/utils/random";
import { SeededRNG } from "@/utils/random";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { LoreArchive } from "@/lore/LoreArchive";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { getFightsForTournament } from "@/engine/core/historyUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { Trophy, Play, UserPlus, FastForward, Settings2, Zap, AlertTriangle, Medal } from "lucide-react";
import { audioManager } from "@/lib/AudioManager";
import { engineProxy } from "@/engine/workerProxy";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

// Modular Components
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { TournamentHistory } from "@/components/tournaments/TournamentHistory";
import { TournamentPrepDialog } from "@/components/tournaments/TournamentPrepDialog";

const SEASON_NAMES: Record<string, string> = {
  Spring: "Spring Classic",
  Summer: "Summer Cup",
  Fall: "Fall Clash",
  Winter: "Winter Crown",
};

const SEASON_ICONS: Record<string, string> = {
  Spring: "🌿",
  Summer: "☀️",
  Fall: "🍂",
  Winter: "❄️",
};

const TIER_PRIZES: Record<string, { first: number; second: number; third: number }> = {
  Gold:   { first: 5000, second: 2500, third: 1200 },
  Silver: { first: 2500, second: 1250, third: 600  },
  Bronze: { first: 1200, second: 600,  third: 300  },
  Iron:   { first: 600,  second: 300,  third: 150  },
};

function getFatigueLabel(fatigue: number | undefined): { label: string; color: string } {
  const f = fatigue ?? 0;
  if (f < 30) return { label: "Fresh",     color: "text-emerald-400" };
  if (f < 60) return { label: "Tired",     color: "text-yellow-400" };
  return        { label: "Exhausted",  color: "text-red-400"    };
}

export default function Tournaments() {
  const {
    tournaments,
    season,
    roster,
    rivals,
    trainers,
    weather,
    week,
    year,
    arenaHistory,
    player,
    rosterBonus,
    setState,
    activeSlotId,
    loadGame,
    setSimulating
  } = useGameStore();

  const [expandedBout, setExpandedBout] = useState<string | null>(null);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [hasShownPrep, setHasShownPrep] = useState(false);

  const currentTournament = useMemo(
    () => tournaments.find((t) => t.season === season && !t.completed),
    [tournaments, season]
  );

  const activeWarriors = useMemo(() => roster.filter((w) => w.status === "Active"), [roster]);

  // Warriors belonging to the player that are in the active tournament
  const playerWarriorsInTournament = useMemo(() => {
    if (!currentTournament || !player) return [];
    return currentTournament.participants.filter(
      (w) => w.stableId === player.id
    );
  }, [currentTournament, player]);

  const pastTournaments = useMemo(
    () => tournaments.filter((t) => t.completed).reverse(),
    [tournaments]
  );
  
  // 🌩️ Protocol Sync: Auto-open prep dialog if tournament is ready but not started
  const isTournamentReadyToStart = useMemo(() => {
    if (!currentTournament) return false;
    return currentTournament.bracket.every(b => b.winner === undefined);
  }, [currentTournament]);

  React.useEffect(() => {
    const hasAlreadyStarted = currentTournament?.bracket.some(b => b.winner !== undefined);
    if (isTournamentReadyToStart && !hasShownPrep && !hasAlreadyStarted) {
      setIsPrepOpen(true);
      setHasShownPrep(true);
      audioManager.play("clash"); // Thematic entrance sound
    }
    
    // ⚔️ 1.0 Atmospheric: Trigger ambient arena sound when on this page
    audioManager.play("arena_ambient"); 
  }, [isTournamentReadyToStart, hasShownPrep, currentTournament]);

  const handleExecuteRound = useCallback(async () => {
    if (!currentTournament) return;
    
    setSimulating(true);
    try {
      const state = useGameStore.getState();
      const currentFullState = reconstructGameState(state as any);
      
      const { updatedState, roundResults } = await engineProxy.resolveTournamentRound(
        currentFullState,
        currentTournament.id,
        Date.now()
      );

      loadGame(activeSlotId || "autosave", updatedState);
      audioManager.play("clash");
      toast.success(roundResults.length > 0 ? "Round resolved." : "Tournament complete.");
    } catch (error) {
      console.error("Tournament resolution failed:", error);
      toast.error("Resolution failed.");
    } finally {
      setSimulating(false);
    }
  }, [currentTournament, activeSlotId, loadGame, setSimulating]);


  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        icon={Trophy}
        title="Seasonal Campaigns"
        subtitle={`IMPERIAL · TOURNAMENTS · ${season.toUpperCase()} SEASON`}
        actions={
          <div className="flex items-center gap-2">
          {!currentTournament && activeWarriors.length < 2 && (
             <Link to="/ops/personnel">
              <Button variant="outline" className="h-9 font-black uppercase text-[10px] tracking-widest gap-2">
                <UserPlus className="h-4 w-4" /> RECRUIT OPERATIVES
              </Button>
            </Link>
          )}
          </div>
        }
      />

      {/* ── Pre-tournament readiness banner ── */}
      {currentTournament && playerWarriorsInTournament.length > 0 && (
        <div className="rounded-lg border border-border/20 bg-secondary/10 px-5 py-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              OPERATIVE READINESS
            </div>
            {/* Prizes pill */}
            {(() => {
              const prizes = TIER_PRIZES[currentTournament.tierId];
              if (!prizes) return null;
              return (
                <div className="flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-accent">
                  <Medal className="h-3 w-3" />
                  <span>{prizes.first.toLocaleString()}g</span>
                  <span className="opacity-40">/</span>
                  <span className="opacity-70">{prizes.second.toLocaleString()}g</span>
                  <span className="opacity-40">/</span>
                  <span className="opacity-50">{prizes.third.toLocaleString()}g</span>
                </div>
              );
            })()}
          </div>

          {/* Per-warrior rows */}
          <div className="flex flex-wrap gap-2">
            {playerWarriorsInTournament.map((w) => {
              const { label: fatigueLabel, color: fatigueColor } = getFatigueLabel(w.fatigue);
              const hasInjuries = w.injuries && w.injuries.length > 0;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded border border-border/15 bg-background/30 px-3 py-1.5 text-[11px]"
                >
                  <span className="font-semibold text-foreground/90 truncate max-w-[120px]">{w.name}</span>
                  <span className={`font-black uppercase text-[9px] tracking-widest ${fatigueColor}`}>
                    {fatigueLabel}
                  </span>
                  {hasInjuries && (
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {w.injuries.length === 1
                          ? w.injuries[0].severity
                          : `${w.injuries.length} INJURIES`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentTournament && (
        <Surface
          variant="gold"
          padding="none" className="border-accent/40 shadow-[0_0_50px_-10px_hsla(var(--accent),0.2)] overflow-hidden">
          <div className="pb-4 bg-accent/5 border-b border-border/10 p-6">
            <div className="font-display text-xl font-black flex items-center justify-between text-accent uppercase tracking-tighter">
              <span className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-sm">{SEASON_ICONS[season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-black font-black uppercase text-[9px] tracking-[0.2em] px-3 animate-pulse border-none">
                LIVE
              </Badge>
            </div>
          </div>
          <div className="p-0">
            <TournamentBracket
              bouts={currentTournament.bracket}
              arenaHistory={arenaHistory}
              expandedBout={expandedBout}
              onToggleExpand={setExpandedBout}
            />

            {currentTournament.bracket.some((b) => b.winner === undefined) && (
              <div className="flex flex-col gap-4 p-8 border-t border-white/5 bg-secondary/10">
                <div className="flex gap-4">
                  <Button onClick={handleExecuteRound} className="flex-1 h-14 font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl bg-primary text-black hover:bg-primary/90 transition-all">
                    <Play className="h-4 w-4 mr-2 fill-current" /> EXECUTE NEXT BOUT
                  </Button>
                </div>
                
                {isTournamentReadyToStart && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPrepOpen(true)} 
                    className="w-full h-12 font-black uppercase text-[10px] tracking-widest gap-2 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors"
                  >
                    <Settings2 className="h-4 w-4" /> OPEN PREP CONSOLE
                  </Button>
                )}
              </div>
            )}
          </div>
        </Surface>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tournament History</h3>
          <div className="h-px flex-1 bg-border/20" />
        </div>
        <TournamentHistory
          pastTournaments={pastTournaments}
          seasonIcons={SEASON_ICONS}
          seasonNames={SEASON_NAMES}
          currentSeason={season}
        />
      </div>

    </div>
  );
}
