import React, { useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { type Warrior, STYLE_DISPLAY_NAMES } from "@/types/game";
import { getRecommendedChallenges, getMatchupsToAvoid, type MatchupScore } from "@/engine/schedulingAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { Target, AlertTriangle, Swords, Trophy, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchupCardProps {
  matchup: MatchupScore;
  type: "recommend" | "avoid";
}

function MatchupCard({ matchup, type }: MatchupCardProps) {
  const w = matchup.rivalWarrior;
  const isGood = type === "recommend";

  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card transition-all hover:shadow-md",
      isGood ? "border-primary/20 hover:border-primary/40" : "border-destructive/20 hover:border-destructive/40"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isGood ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          <span className="font-display font-bold text-sm tracking-tight">{w.name}</span>
        </div>
        <Link to="/warrior/$id" params={{ id: w.id } as any}>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <Badge variant="outline" className="text-[10px] font-mono py-0">
          {STYLE_DISPLAY_NAMES[w.style]}
        </Badge>
        <Badge variant="secondary" className="text-[10px] font-mono py-0">
          {matchup.rivalStableName}
        </Badge>
        <Badge variant="outline" className={cn(
          "text-[10px] font-mono py-0",
          matchup.styleAdvantage > 0 ? "text-primary border-primary/30" : 
          matchup.styleAdvantage < 0 ? "text-destructive border-destructive/30" : ""
        )}>
          Adv: {matchup.styleAdvantage > 0 ? "+" : ""}{matchup.styleAdvantage}
        </Badge>
      </div>

      <div className="space-y-1">
        {matchup.notes.map((note, i) => (
          <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1.5 italic">
            <span className={cn("h-1 w-1 rounded-full", isGood ? "bg-primary/50" : "bg-destructive/50")} />
            {note}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">
          Score
        </div>
        <div className={cn(
          "text-sm font-mono font-black",
          isGood ? "text-primary" : "text-destructive"
        )}>
          {Math.round(matchup.score)}
        </div>
      </div>
    </div>
  );
}

interface SchedulingWidgetProps {
  warrior: Warrior;
}

export function SchedulingWidget({ warrior }: SchedulingWidgetProps) {
  const { state } = useGameStore();

  const recommendations = useMemo(() => 
    getRecommendedChallenges(state, warrior, 2), 
    [state, warrior]
  );
  
  const toAvoid = useMemo(() => 
    getMatchupsToAvoid(state, warrior, 2), 
    [state, warrior]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-display font-black uppercase tracking-tight">Prime Targets</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Recommended for advancement</p>
            </div>
          </div>
          <div className="space-y-3">
            {recommendations.length > 0 ? (
              recommendations.map((m, i) => (
                <MatchupCard key={i} matchup={m} type="recommend" />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">
                No prime targets available this week.
              </p>
            )}
          </div>
        </div>

        {/* To Avoid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-display font-black uppercase tracking-tight">High Risk</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Matchups to avoid if possible</p>
            </div>
          </div>
          <div className="space-y-3">
            {toAvoid.length > 0 ? (
              toAvoid.map((m, i) => (
                <MatchupCard key={i} matchup={m} type="avoid" />
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-lg text-center">
                No high-risk matchups found.
              </p>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-secondary/20 border-border/40">
        <CardContent className="p-4 flex items-start gap-3">
          <Swords className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Scouting Intelligence:</span> Recommendations represent a composite score based on style matchup matrix, fame differential, and your warrior's current momentum. Grudge matches against rivals will significantly boost the priority of a challenge.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
