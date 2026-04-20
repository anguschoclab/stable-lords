/**
 * Stable Lords — Seasonal Tournaments (Refactored)
 * Modularized for better maintainability and strict type safety.
 */
import React, { useState, useCallback, useMemo } from "react";
import { useGameStore, reconstructGameState } from "@/state/useGameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags, aiPlanForWarrior } from "@/engine";
import { type TournamentEntry, type TournamentBout, type FightSummary, type Warrior, FightingStyle } from "@/types/game";
import { generateId, hashStr } from "@/utils/idUtils";
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
import { Trophy, Play, UserPlus, FastForward, Settings2 } from "lucide-react";
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
                <UserPlus className="h-4 w-4" /> RECRUIT_OPERATIVES
              </Button>
            </Link>
          )}
          </div>
        }
      />

      {currentTournament && (
        <Card className="border-accent/40 shadow-[0_0_30px_-10px_hsla(var(--accent),0.3)] bg-glass-card overflow-hidden">
          <CardHeader className="pb-4 bg-accent/5 border-b border-border/10">
            <CardTitle className="font-display text-xl font-black flex items-center justify-between text-accent uppercase tracking-tighter">
              <span className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-sm">{SEASON_ICONS[season]}</span>
                {currentTournament.name}
              </span>
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-[0.2em] px-3 animate-pulse">PROTOCOL_LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TournamentBracket
              bouts={currentTournament.bracket}
              arenaHistory={arenaHistory}
              expandedBout={expandedBout}
              onToggleExpand={setExpandedBout}
            />

            {currentTournament.bracket.some((b) => b.winner === undefined) && (
              <div className="flex flex-col gap-4 p-6 border-t border-border/10 bg-secondary/10">
                <div className="flex gap-4">
                  <Button onClick={handleExecuteRound} className="flex-1 h-12 font-black uppercase text-[11px] tracking-widest shadow-lg">
                    <Play className="h-4 w-4 mr-2 fill-current" /> EXECUTE_NEXT_BOUT
                  </Button>
                </div>
                
                {isTournamentReadyToStart && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPrepOpen(true)} 
                    className="w-full h-11 font-black uppercase text-[10px] tracking-widest gap-2 bg-accent/5"
                  >
                    <Settings2 className="h-4 w-4" /> OPEN_PREP_CONSOLE
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tournament_History_Matrices</h3>
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
