import React from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { Calendar, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CROWD_MOODS, MOOD_ICONS, MOOD_DESCRIPTIONS } from "@/engine/crowdMood";

export function SeasonWidget() {
  const { state } = useGameStore();
  
  // Upcoming events
  const events: { label: string; week: number; type: "bout" | "season" | "recruit" }[] = [];
  // Next bout is always current week
  events.push({ label: "Arena Day", week: state.week, type: "bout" });
  // Pool refresh every 4 weeks
  const nextDraft = state.week + (4 - (state.week % 4));
  events.push({ label: "Scout Pool Refresh", week: nextDraft, type: "recruit" });
  // Season change every 13 weeks
  const nextSeason = state.week + (13 - ((state.week - 1) % 13));
  events.push({ label: "Season Change", week: nextSeason, type: "season" });
  // Tournament availability
  const hasActiveTournament = state.tournaments.some((t) => t.season === state.season && !t.completed);
  const hadTournamentThisSeason = state.tournaments.some((t) => t.season === state.season);
  if (!hasActiveTournament && !hadTournamentThisSeason) {
    events.push({ label: `${state.season} Tournament`, week: state.week, type: "bout" });
  }

  // Season progress
  const weeksIntoSeason = ((state.week - 1) % 13) + 1;
  const seasonProgress = (weeksIntoSeason / 13) * 100;
  const weeksRemaining = 13 - weeksIntoSeason;

  const SEASON_EMOJIS: Record<string, string> = {
    Spring: "🌱", Summer: "☀️", Fall: "🍂", Winter: "❄️",
  };
  const seasonEmoji = SEASON_EMOJIS[state.season] ?? "📅";

  return (
    <Card className="row-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> Season & Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current state */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-display font-bold">Week {state.week}</div>
            <div className="text-sm text-muted-foreground">{state.season}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              {CROWD_MOODS.map((mood) => (
                <span
                  key={mood}
                  className={`text-lg transition-opacity ${mood === state.crowdMood ? "opacity-100" : "opacity-25"}`}
                  title={mood}
                >
                  {MOOD_ICONS[mood as keyof typeof MOOD_ICONS]}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{state.crowdMood}</div>
          </div>
        </div>

        {/* Season Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
              {seasonEmoji} {state.season} Progress
            </span>
            <span className="font-mono text-muted-foreground">{weeksIntoSeason}/13</span>
          </div>
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${seasonProgress}%` }}
            />
            {/* Tick marks at quarters */}
            {[25, 50, 75].map(pct => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px bg-background/40"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <Link to="/seasonal-awards" className="hover:text-primary transition-colors">
              {weeksRemaining === 0
                ? "🏆 Awards ceremony!"
                : `${weeksRemaining} week${weeksRemaining !== 1 ? "s" : ""} until awards`}
            </Link>
            <span className="font-mono">{Math.round(seasonProgress)}%</span>
          </div>
        </div>

        {/* Upcoming timeline */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Upcoming</div>
          {events.sort((a, b) => a.week - b.week).map((ev, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  ev.type === "bout" ? "bg-destructive" :
                  ev.type === "season" ? "bg-primary" : "bg-arena-pop"
                }`} />
                <span className="text-foreground/80">{ev.label}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Wk {ev.week}</span>
            </div>
          ))}
        </div>

        <Link to="/run-round" className="block">
          <Button size="sm" className="w-full gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Run Round
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
