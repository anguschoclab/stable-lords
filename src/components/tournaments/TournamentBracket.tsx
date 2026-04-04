import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import BoutViewer from "@/components/BoutViewer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TournamentBout, FightSummary } from "@/types/game";

interface TournamentBracketProps {
  bouts: TournamentBout[];
  arenaHistory: FightSummary[];
  expandedBout: string | null;
  onToggleExpand: (key: string | null) => void;
}

export function TournamentBracket({ bouts, arenaHistory, expandedBout, onToggleExpand }: TournamentBracketProps) {
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

              return (
                <div key={bIdx} className="relative group">
                  {rIdx > 0 && (
                    <svg className="absolute -left-16 top-1/2 -translate-y-1/2 w-16 h-12 pointer-events-none stroke-border/20 fill-none overflow-visible">
                       <path d="M 0 0 L 32 0 L 32 24 L 64 24" className="stroke-2" />
                    </svg>
                  )}

                  <div className={cn(
                    "w-64 rounded-xl border transition-all duration-300 relative z-10",
                    isPending ? "bg-background/20 border-border/40" : "bg-secondary/10 border-primary/30 shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)]",
                    isExpanded && "ring-2 ring-primary/50 border-primary shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
                  )}>
                    <div className="px-3 py-1 border-b border-border/20 flex items-center justify-between bg-secondary/20">
                      <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest uppercase">MATCH {bIdx + 1}</span>
                      {isPending ? (
                        <Badge className="h-3 px-1.5 text-[7px] bg-blue-500/20 text-blue-400 border-none">PENDING</Badge>
                      ) : (
                        <Badge className="h-3 px-1.5 text-[7px] bg-primary/20 text-primary border-none">RESOLVED</Badge>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-colors",
                        isAChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isDChosen ? "opacity-30 grayscale" : "bg-background/40"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          <div className={cn("w-1 h-4 rounded-full", isAChosen ? "bg-primary" : "bg-muted-foreground/20")} />
                          <span className="text-xs truncate">{bout.a}</span>
                        </div>
                        {isAChosen && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                      </div>

                      <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-secondary px-2 rounded-full border border-border/20 text-[8px] font-black text-muted-foreground">VS</div>
                      </div>

                      <div className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-colors",
                        isDChosen ? "bg-primary/10 text-primary font-bold shadow-inner" : isAChosen ? "opacity-30 grayscale" : "bg-background/40"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          <div className={cn("w-1 h-4 rounded-full", isDChosen ? "bg-primary" : "bg-muted-foreground/20")} />
                          <span className="text-xs truncate">{bout.d}</span>
                        </div>
                        {isDChosen && <Trophy className="h-3 w-3 animate-bounce shadow-glow text-arena-gold" />}
                      </div>
                    </div>

                    {hasTranscript && (
                      <button
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
                            <span>Bout Archive: {bout.a} vs {bout.d}</span>
                            <Badge variant="outline" className="text-[10px]">{fightSummary.by}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <div className="p-4 max-h-[500px] overflow-y-auto thin-scrollbar bg-background/60">
                          <BoutViewer
                            nameA={fightSummary.a}
                            nameD={fightSummary.d}
                            styleA={fightSummary.styleA!}
                            styleD={fightSummary.styleD!}
                            log={fightSummary.transcript!.map((text, idx) => ({ minute: idx + 1, text }))}
                            winner={fightSummary.winner}
                            by={fightSummary.by!}
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
