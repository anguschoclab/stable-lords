import React, { useState } from "react";
import { useGame } from "@/state/GameContext";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { sendSignal } from "@/engine/signals";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { killWarrior } from "@/state/gameStore";
import type { FightSummary, Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, Skull } from "lucide-react";
import { toast } from "sonner";

export default function RunRound() {
  const { state, setState } = useGame();
  const [results, setResults] = useState<
    { a: Warrior; d: Warrior; outcome: ReturnType<typeof simulateFight> }[]
  >([]);
  const [running, setRunning] = useState(false);

  const runWeek = () => {
    if (running || state.roster.length < 2) return;
    setRunning(true);

    const weekResults: typeof results = [];
    let updatedState = { ...state };
    const moodMods = getMoodModifiers(state.crowdMood as any);

    for (let i = 0; i < state.roster.length; i++) {
      const warrior = updatedState.roster[i];
      if (!warrior || warrior.status !== "Active") continue;
      const opponentIdx = (i + 1) % updatedState.roster.length;
      const opponent = updatedState.roster[opponentIdx];
      if (!opponent || opponent.status !== "Active") continue;

      const planA = warrior.plan ?? defaultPlanForWarrior(warrior);
      const planD = opponent.plan ?? defaultPlanForWarrior(opponent);
      const outcome = simulateFight(planA, planD, warrior, opponent);

      const tags = outcome.post?.tags ?? [];
      const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
      const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);
      const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier);
      const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
      const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
      const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

      // Update warrior records
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map((w) => {
          if (w.id === warrior.id) {
            return {
              ...w,
              fame: Math.max(0, w.fame + fameA),
              popularity: Math.max(0, w.popularity + popA),
              career: {
                ...w.career,
                wins: w.career.wins + (outcome.winner === "A" ? 1 : 0),
                losses: w.career.losses + (outcome.winner === "D" ? 1 : 0),
                kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "A" ? 1 : 0),
              },
              flair: outcome.winner === "A" && tags.includes("Flashy")
                ? Array.from(new Set([...w.flair, "Flashy"]))
                : w.flair,
            };
          }
          if (w.id === opponent.id) {
            return {
              ...w,
              fame: Math.max(0, w.fame + fameD),
              popularity: Math.max(0, w.popularity + popD),
              career: {
                ...w.career,
                wins: w.career.wins + (outcome.winner === "D" ? 1 : 0),
                losses: w.career.losses + (outcome.winner === "A" ? 1 : 0),
                kills: w.career.kills + (outcome.by === "Kill" && outcome.winner === "D" ? 1 : 0),
              },
            };
          }
          return w;
        }),
      };

      // Handle death
      if (outcome.by === "Kill") {
        const deadId = outcome.winner === "A" ? opponent.id : warrior.id;
        const killerName = outcome.winner === "A" ? warrior.name : opponent.name;
        updatedState = killWarrior(updatedState, deadId, killerName, "Killed in arena combat");
      }

      const summary: FightSummary = {
        id: `fight_${Date.now()}_${i}`,
        week: state.week,
        title: `${warrior.name} vs ${opponent.name}`,
        a: warrior.name,
        d: opponent.name,
        winner: outcome.winner,
        by: outcome.by,
        styleA: warrior.style,
        styleD: opponent.style,
        flashyTags: tags,
        fameDeltaA: fameA,
        fameDeltaD: fameD,
        popularityDeltaA: popA,
        popularityDeltaD: popD,
        transcript: outcome.log.map((e) => e.text),
        createdAt: new Date().toISOString(),
      };
      updatedState.arenaHistory = [...updatedState.arenaHistory, summary];
      weekResults.push({ a: warrior, d: opponent, outcome });
    }

    // Update crowd mood
    updatedState.crowdMood = computeCrowdMood(updatedState.arenaHistory);

    // Newsletter
    const highlights = weekResults.map((r) => {
      const winner = r.outcome.winner === "A" ? r.a.name : r.outcome.winner === "D" ? r.d.name : "Draw";
      const deathNote = r.outcome.by === "Kill" ? " ☠️" : "";
      return `${r.a.name} vs ${r.d.name}: ${winner} ${r.outcome.by ? `by ${r.outcome.by}` : "(Draw)"}${deathNote}`;
    });
    updatedState.newsletter = [
      ...updatedState.newsletter,
      { week: state.week, title: "Arena Chronicle", items: highlights },
    ];

    // Advance week
    const newWeek = state.week + 1;
    const seasons = ["Spring", "Summer", "Fall", "Winter"] as const;
    updatedState.week = newWeek;
    updatedState.season = seasons[Math.floor((newWeek - 1) / 13) % 4];

    setState(updatedState);
    setResults(weekResults);
    setRunning(false);

    const deaths = weekResults.filter((r) => r.outcome.by === "Kill").length;
    toast.success(
      `Week ${state.week} complete! ${weekResults.length} bouts resolved.${deaths > 0 ? ` ${deaths} death(s)!` : ""}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Run Round</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Week {state.week}, {state.season} — {state.roster.filter(w => w.status === "Active").length} warriors ready ·
            Crowd: {state.crowdMood}
          </p>
        </div>
        <Button
          onClick={runWeek}
          disabled={running || state.roster.filter(w => w.status === "Active").length < 2}
          className="gap-2 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Zap className="h-4 w-4" />
          Simulate Round
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-semibold">Results — Week {state.week - 1}</h2>
          {results.map((r, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Swords className="h-5 w-5 text-arena-gold" />
                    <span className="font-display font-semibold">{r.a.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {STYLE_DISPLAY_NAMES[r.a.style]}
                    </Badge>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-display font-semibold">{r.d.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {STYLE_DISPLAY_NAMES[r.d.style]}
                    </Badge>
                  </div>
                  <Badge
                    variant={r.outcome.winner ? "default" : "secondary"}
                    className={
                      r.outcome.by === "Kill"
                        ? "bg-arena-blood text-white gap-1"
                        : r.outcome.by === "KO"
                        ? "bg-arena-gold text-black"
                        : ""
                    }
                  >
                    {r.outcome.by === "Kill" && <Skull className="h-3 w-3" />}
                    {r.outcome.winner
                      ? `${r.outcome.winner === "A" ? r.a.name : r.d.name} — ${r.outcome.by}`
                      : "Draw"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground border-l-2 border-primary/20 pl-3">
                  {r.outcome.log.map((e, j) => (
                    <p key={j}>
                      <span className="text-xs text-muted-foreground/60 mr-2">Min {e.minute}</span>
                      {e.text}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
