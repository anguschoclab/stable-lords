import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronUp, ChevronDown, Medal, Crown, StepForward } from "lucide-react";
import { cn } from "@/lib/utils";
import BoutViewer from "@/components/BoutViewer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveWarriorName } from "@/utils/historyResolver";
import { useGameStore } from "@/state/useGameStore";
import type { TournamentBout, FightSummary } from "@/types/game";

/** Check if bout is a bronze match (round 6, matchIndex 1) */
function isBronzeMatch(bout: TournamentBout): boolean {
  return bout.round === 6 && bout.matchIndex === 1;
}

/** Check if bout is the championship final */
function isChampionshipFinal(bout: TournamentBout, totalRounds: number): boolean {
  return bout.round === totalRounds && bout.round >= 6;
}

interface TournamentBracketProps {
  bouts: TournamentBout[];
  arenaHistory: FightSummary[];
  expandedBout: string | null;
  onToggleExpand: (key: string | null) => void;
}

export function TournamentBracket({ bouts, arenaHistory, expandedBout, onToggleExpand }: TournamentBracketProps) {
  const state = useGameStore();
  const roundsMap = new Map<number, TournamentBout[]>();
  bouts.forEach((b) => {
    const arr = roundsMap.get(b.round) || [];
    arr.push(b);
    roundsMap.set(b.round, arr);
  });
  
  const sortedRounds = Array.from(roundsMap.entries()).sort(([a], [b]) => a - b);
  const totalRounds = sortedRounds.length;

  return (
    <div className="relative overflow-x-auto pb-8 pt-4 no-scrollbar">
      <div className="flex gap-16 min-w-max px-4">
        {sortedRounds.map(([round, roundBouts], rIdx) => (
          <div key={round} className="flex flex-col justify-around gap-8 relative py-4">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                {round === totalRounds && totalRounds > 1 ? "Championship" : `Round ${round}`}
              </span>
            </div>

            {roundBouts.map((bout, bIdx) => {
              const boutKey = `${round}_${bIdx}`;
              const isExpanded = expandedBout === boutKey;
              const fightSummary = bout.fightId
                ? arenaHistory.find((f) => f.id === bout.fightId)
                : null;
              const hasTranscript = fightSummary?.transcript && fightSummary.transcript.length > 0;
              
              const isAChosen = bout.winner === "A";
              const isDChosen = bout.winner === "D";
              const isPending = bout.winner === undefined;
              const isBye = bout.d === "(bye)" || bout.warriorIdD === "bye";
              const bronze = isBronzeMatch(bout);
              const championship = isChampionshipFinal(bout, totalRounds);

              return (
                <div key={bIdx} className={cn(
                  "relative group",
                  bronze && "opacity-90"
                )}>
                  {/* Connection lines to previous round */}
                  {rIdx > 0 && !isBye && (
                    <svg className={cn(
                      "absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-16 pointer-events-none fill-none overflow-visible",
                      isPending ? "stroke-border/10" : "stroke-primary/30",
                      bronze && "stroke-amber-500/30"
                    )}>
                      <path d="M 0 -12 L 24 -12 L 24 0 L 48 0" className="stroke-1" />
                      <path d="M 0 12 L 24 12 L 24 0 L 48 0" className="stroke-1" />
                    </svg>
                  )}
                  {/* Simple line for byes */}
                  {rIdx > 0 && isBye && (
                    <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-8 pointer-events-none stroke-border/10 fill-none overflow-visible">
                      <path d="M 0 0 L 48 0" className="stroke-1" />
                    </svg>
                  )}

                  <div className={cn(
                    "w-64 rounded-none border transition-all duration-300 relative z-10",
                    isPending ? "bg-background/20 border-border/40" : "bg-secondary/10 border-primary/30 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]",
                    isExpanded && "ring-2 ring-primary/50 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]",
                    bronze && "border-amber-500/40 bg-amber-500/5",
                    championship && !isPending && "border-arena-gold/50 bg-amber-500/10 shadow-[0_0_20px_-5px_rgba(255,215,0,0.3)]",
                    isBye && "border-dashed border-border/30 bg-muted/10"
                  )}>
                    <div className={cn(
                      "px-3 py-1 border-b border-border/20 flex items-center justify-between bg-secondary/20",
                      bronze && "bg-amber-500/10 border-amber-500/20",
                      championship && !isPending && "bg-amber-500/20 border-amber-500/30"
                    )}>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest uppercase">
                          {bronze ? "BRONZE" : championship ? "FINAL" : `MATCH ${bout.matchIndex + 1}`}
                        </span>
                        {bronze && <Medal className="h-3 w-3 text-amber-600" />}
                        {championship && !isPending && <Crown className="h-3 w-3 text-arena-gold" />}
                      </div>
                      {isPending ? (
                        isBye ? (
                          <Badge className="h-3 px-1.5 text-[7px] bg-stone-500/20 text-stone-400 border-none">BYE</Badge>
                        ) : (
                          <Badge className="h-3 px-1.5 text-[7px] bg-stone-500/20 text-stone-400 border-none">PENDING</Badge>
                        )
                      ) : championship ? (
                        <Badge className="h-3 px-1.5 text-[7px] bg-arena-gold/30 text-amber-700 border-amber-500/30">CHAMPION</Badge>
                      ) : bronze ? (
                        <Badge className="h-3 px-1.5 text-[7px] bg-amber-500/30 text-amber-700 border-amber-500/30">BRONZE</Badge>
                      ) : (
                        <Badge className="h-3 px-1.5 text-[7px] bg-primary/20 text-primary border-none">RESOLVED</Badge>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      {/* Warrior A */}
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-none transition-colors",
                        isAChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isDChosen ? "opacity-30 grayscale" : "bg-background/40",
                        isBye && "bg-muted/30",
                        isAChosen && championship && "bg-arena-gold/20 text-amber-700"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          <div className={cn(
                            "w-1 h-4 rounded-full",
                            isAChosen ? (championship ? "bg-arena-gold" : "bg-primary") : "bg-muted-foreground/20"
                          )} />
                          <span className="text-xs truncate">{resolveWarriorName(state, bout.warriorIdA, bout.a)}</span>
                          {isBye && <StepForward className="h-3 w-3 text-muted-foreground/50" />}
                        </div>
                        {isAChosen && championship && <Crown className="h-3 w-3 text-arena-gold animate-pulse" />}
                        {isAChosen && !championship && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                      </div>

                      {/* VS indicator - hide for byes */}
                      {!isBye && (
                        <div className="flex justify-center -my-2 relative z-10">
                          <div className={cn(
                            "bg-secondary px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground",
                            bronze && "bg-amber-500/20 border-amber-500/30 text-amber-600"
                          )}>
                            {bronze ? "3RD PLACE" : "VS"}
                          </div>
                        </div>
                      )}
                      
                      {/* Bye indicator */}
                      {isBye && (
                        <div className="flex justify-center -my-1 relative z-10">
                          <div className="bg-muted px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground">
                            BYE
                          </div>
                        </div>
                      )}

                      {/* Warrior D */}
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-none transition-colors",
                        isDChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isAChosen ? "opacity-30 grayscale" : "bg-background/40",
                        isBye && "opacity-50 italic text-muted-foreground"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          <div className={cn(
                            "w-1 h-4 rounded-full",
                            isDChosen ? (championship ? "bg-arena-gold" : "bg-primary") : "bg-muted-foreground/20"
                          )} />
                          <span className="text-xs truncate">
                            {isBye ? "(bye)" : resolveWarriorName(state, bout.warriorIdD, bout.d)}
                          </span>
                        </div>
                        {isDChosen && championship && <Crown className="h-3 w-3 text-arena-gold animate-pulse" />}
                        {isDChosen && !championship && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                      </div>
                    </div>

                    {hasTranscript && (
                      <button
                        aria-label={isExpanded ? "Collapse Engagement Log" : "Expand Engagement Log"}
                        onClick={() => onToggleExpand(isExpanded ? null : boutKey)}
                        className="w-full py-1.5 px-3 border-t border-border/10 flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors group"
                      >
                        <span className="text-[9px] font-black uppercase text-muted-foreground group-hover:text-primary">Engagement Log</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3 text-primary animate-pulse" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && hasTranscript && fightSummary && (
                    <div className="absolute top-0 left-full ml-4 z-50 w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-300">
                      <Card className="bg-glass-card border-primary/50 shadow-2xl overflow-hidden">
                        <CardHeader className="p-4 border-b border-border/20 bg-secondary/40">
                          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between">
                            <span>Bout Archive: {resolveWarriorName(state, bout.warriorIdA, bout.a)} vs {resolveWarriorName(state, bout.warriorIdD, bout.d)}</span>
                            <Badge variant="outline" className="text-[10px]">{fightSummary.by || "Unknown"}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <div className="p-4 max-h-[500px] overflow-y-auto thin-scrollbar bg-background/60">
                          <BoutViewer
                            nameA={resolveWarriorName(state, fightSummary.warriorIdA, fightSummary.a)}
                            nameD={resolveWarriorName(state, fightSummary.warriorIdD, fightSummary.d)}
                            styleA={fightSummary.styleA || ""}
                            styleD={fightSummary.styleD || ""}
                            log={(fightSummary.transcript || []).map((text, idx) => ({ minute: idx + 1, text }))}
                            winner={fightSummary.winner}
                            by={fightSummary.by ?? null}
                            isRivalry={fightSummary.isRivalry}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full rounded-none border-t border-border/20"
                          onClick={() => onToggleExpand(null)}
                        >
                          Close Archive
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Champion display card shown when tournament is complete */
interface ChampionDisplayProps {
  championName: string;
  championId?: string;
  tournamentName: string;
}

export function ChampionDisplay({ championName, championId, tournamentName }: ChampionDisplayProps) {
  const state = useGameStore();
  const displayName = championId 
    ? resolveWarriorName(state, championId, championName)
    : championName;

  return (
    <Card className="bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-arena-gold/50 shadow-[0_0_30px_-10px_rgba(255,215,0,0.5)]">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Crown className="h-12 w-12 text-arena-gold animate-pulse" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Tournament Champion</p>
            <h3 className="text-2xl font-black uppercase tracking-wider text-amber-700 mt-1">{displayName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tournamentName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bronze match highlight card */
interface BronzeHighlightProps {
  thirdPlaceName: string;
  thirdPlaceId?: string;
}

export function BronzeHighlight({ thirdPlaceName, thirdPlaceId }: BronzeHighlightProps) {
  const state = useGameStore();
  const displayName = thirdPlaceId
    ? resolveWarriorName(state, thirdPlaceId, thirdPlaceName)
    : thirdPlaceName;

  return (
    <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-500/30">
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Medal className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">3rd Place</p>
            <p className="text-sm font-bold text-amber-700">{displayName}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Tournament progress summary */
interface TournamentProgressProps {
  currentRound: number;
  totalRounds: number;
  completedMatches: number;
  totalMatches: number;
}

export function TournamentProgress({ 
  currentRound, 
  totalRounds, 
  completedMatches, 
  totalMatches 
}: TournamentProgressProps) {
  const progress = Math.round((completedMatches / totalMatches) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Round {currentRound} of {totalRounds}</span>
        <span className="font-mono font-bold">{progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{completedMatches} matches completed</span>
        <span>{totalMatches - completedMatches} remaining</span>
      </div>
    </div>
  );
}
