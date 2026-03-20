import React, { useMemo, useState } from "react";
import { useGameStore } from "@/state/useGameStore";
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV, type Warrior } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Flame, Skull, Heart, Eye, Target, AlertTriangle, Shield } from "lucide-react";
import { WarriorLink, StableLink } from "@/components/EntityLink";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { StatBadge } from "@/components/ui/StatBadge";
import { getRecommendedChallenges, getMatchupsToAvoid, type MatchupScore } from "@/engine/schedulingAssistant";
import { isTooInjuredToFight } from "@/engine/injuries";

function MatchupCard({ match, type }: { match: MatchupScore, type: "challenge" | "avoid" }) {
  const isChallenge = type === "challenge";

  return (
    <div className={`p-3 rounded-lg border flex flex-col gap-2 ${isChallenge ? "border-arena-pop/30 bg-arena-pop/5" : "border-destructive/30 bg-destructive/5"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <WarriorNameTag id={match.rivalWarrior.id} name={match.rivalWarrior.name} />
        </div>
        <div className="text-right">
            <Badge variant="outline" className={`text-[10px] h-4 px-1 shrink-0 ${isChallenge ? "text-arena-pop border-arena-pop/40" : "text-destructive border-destructive/40"}`}>
                {isChallenge ? "+" : ""}{match.styleAdvantage} Style
            </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span><StableLink name={match.rivalStableName} /></span>
        <span className="font-mono">Fame: {match.rivalWarrior.fame}</span>
      </div>

      <div className="mt-1">
        <StatBadge styleName={match.rivalWarrior.style as FightingStyle} career={match.rivalWarrior.career} />
      </div>

      {match.notes.length > 0 && (
          <ul className="text-[10px] mt-1 space-y-0.5">
              {match.notes.map((note, i) => (
                  <li key={i} className={`flex items-start gap-1 ${isChallenge ? "text-arena-pop" : "text-destructive"}`}>
                     {isChallenge ? <Target className="h-3 w-3 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
                     {note}
                  </li>
              ))}
          </ul>
      )}
    </div>
  );
}

export default function SchedulingAssistant() {
  const { state } = useGameStore();
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);

  const activeWarriors = useMemo(() => {
    return state.roster.filter(w => w.status === "Active" && !isTooInjuredToFight(w.injuries as any));
  }, [state.roster]);

  const selectedWarrior = useMemo(() => {
      return activeWarriors.find(w => w.id === selectedWarriorId) || activeWarriors[0];
  }, [activeWarriors, selectedWarriorId]);

  const recommendedChallenges = useMemo(() => {
      if (!selectedWarrior) return [];
      return getRecommendedChallenges(state, selectedWarrior, 4);
  }, [state, selectedWarrior]);

  const matchupsToAvoid = useMemo(() => {
      if (!selectedWarrior) return [];
      return getMatchupsToAvoid(state, selectedWarrior, 4);
  }, [state, selectedWarrior]);

  if (activeWarriors.length === 0) {
      return (
          <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Swords className="h-6 w-6 text-primary" /> Scheduling Assistant
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Identify favorable matchups and dangerous foes.
                </p>
              </div>
              <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                      <Swords className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>You have no active, healthy warriors available for scheduling.</p>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" /> Scheduling Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analyze rival rosters to find advantageous style matchups and avoid hard counters.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar: Warrior List */}
          <Card className="lg:col-span-1 h-fit">
              <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" /> Active Roster
                  </CardTitle>
                  <CardDescription>Select a warrior to analyze matchups.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                      {activeWarriors.map(w => (
                          <button
                            key={w.id}
                            onClick={() => setSelectedWarriorId(w.id)}
                            className={`w-full flex flex-col gap-1 p-3 text-left transition-colors hover:bg-secondary/40 ${selectedWarrior?.id === w.id ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent"}`}
                          >
                              <div className="flex justify-between items-center w-full">
                                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                                  <span className="text-[11px] text-muted-foreground">Fame {w.fame}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-muted-foreground w-full mt-1">
                                  <StatBadge styleName={w.style as FightingStyle} career={w.career} />
                              </div>
                          </button>
                      ))}
                  </div>
              </CardContent>
          </Card>

          {/* Main Panel: Recommendations */}
          {selectedWarrior && (
              <div className="lg:col-span-2 space-y-6">
                  {/* Selected Warrior Summary */}
                  <Card className="border-primary/30 glow-primary bg-primary/5">
                      <CardContent className="p-4 flex items-center justify-between">
                          <div>
                              <div className="flex items-center gap-2">
                                  <h2 className="text-lg font-display font-bold text-primary">{selectedWarrior.name}</h2>
                                  <Badge className="text-xs">{STYLE_DISPLAY_NAMES[selectedWarrior.style as FightingStyle] || selectedWarrior.style}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Analyzing rival rosters for favorable and unfavorable stylistic matchups.</p>
                          </div>
                      </CardContent>
                  </Card>

                  {/* Recommendations Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                      {/* Challenges */}
                      <Card className="border-arena-pop/30">
                          <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-display flex items-center gap-2 text-arena-pop">
                                  <Target className="h-4 w-4" /> Recommended Challenges
                              </CardTitle>
                              <CardDescription className="text-[11px]">Favorable styles and comparable fame.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              {recommendedChallenges.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No obvious targets found.</p>
                              ) : (
                                  recommendedChallenges.map(m => (
                                      <MatchupCard key={m.rivalWarrior.id} match={m} type="challenge" />
                                  ))
                              )}
                          </CardContent>
                      </Card>

                      {/* Avoid */}
                      <Card className="border-destructive/30">
                          <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-display flex items-center gap-2 text-destructive">
                                  <AlertTriangle className="h-4 w-4" /> Opponents to Avoid
                              </CardTitle>
                              <CardDescription className="text-[11px]">Dangerous counters or poor fame payouts.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                              {matchupsToAvoid.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No obvious threats found.</p>
                              ) : (
                                  matchupsToAvoid.map(m => (
                                      <MatchupCard key={m.rivalWarrior.id} match={m} type="avoid" />
                                  ))
                              )}
                          </CardContent>
                      </Card>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
