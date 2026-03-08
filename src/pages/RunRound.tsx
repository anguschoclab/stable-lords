import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useGame } from "@/state/GameContext";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { killWarrior } from "@/state/gameStore";
import { StyleMeter } from "@/metrics/StyleMeter";
import { LoreArchive } from "@/lore/LoreArchive";
import { blurb } from "@/lore/AnnouncerAI";
import { commentatorFor } from "@/ui/commentator";
import { recapLine } from "@/ui/fightVariety";
import { rollForInjury } from "@/engine/injuries";
import { calculateXP, applyXP } from "@/engine/progression";
import { pickRivalOpponent } from "@/engine/rivals";
import type { FightSummary, Warrior, RivalStableData } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, Skull, Megaphone, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BoutViewer from "@/components/BoutViewer";

export default function RunRound() {
  const { state, setState } = useGame();
  const [results, setResults] = useState<
    { a: Warrior; d: Warrior; outcome: ReturnType<typeof simulateFight>; announcement?: string }[]
  >([]);
  const [running, setRunning] = useState(false);

  const runWeek = () => {
    if (running || state.roster.length < 2) return;
    setRunning(true);

    const weekResults: typeof results = [];
    let updatedState = { ...state };
    const moodMods = getMoodModifiers(state.crowdMood as any);
    const activeWarriors = updatedState.roster.filter(w => w.status === "Active");

    // Build pairings — avoid repeat matchups where possible
    const paired = new Set<string>();
    const pairings: [Warrior, Warrior][] = [];
    for (let i = 0; i < activeWarriors.length; i++) {
      if (paired.has(activeWarriors[i].id)) continue;
      for (let j = i + 1; j < activeWarriors.length; j++) {
        if (paired.has(activeWarriors[j].id)) continue;
        pairings.push([activeWarriors[i], activeWarriors[j]]);
        paired.add(activeWarriors[i].id);
        paired.add(activeWarriors[j].id);
        break;
      }
    }

    for (const [warrior, opponent] of pairings) {
      // Check both still active after previous fights (death may have occurred)
      const currentW = updatedState.roster.find(w => w.id === warrior.id);
      const currentO = updatedState.roster.find(w => w.id === opponent.id);
      if (!currentW || currentW.status !== "Active" || !currentO || currentO.status !== "Active") continue;

      const planA = currentW.plan ?? defaultPlanForWarrior(currentW);
      const planD = currentO.plan ?? defaultPlanForWarrior(currentO);
      const outcome = simulateFight(planA, planD, currentW, currentO, undefined, updatedState.trainers);

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
        id: `fight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

      // Feed style tracking
      StyleMeter.recordFight({
        styleA: warrior.style,
        styleD: opponent.style,
        winner: outcome.winner,
        by: outcome.by,
      });

      // Feed lore archive
      LoreArchive.signalFight(summary);

      // Generate announcer commentary
      let announcement: string | undefined;
      if (outcome.by === "Kill") {
        announcement = commentatorFor("Kill");
      } else if (outcome.by === "KO") {
        announcement = commentatorFor("KO");
      } else if (tags.includes("Flashy")) {
        announcement = commentatorFor("Flashy");
      } else if (tags.includes("Comeback")) {
        announcement = commentatorFor("Upset");
      } else if (outcome.winner) {
        const winnerName = outcome.winner === "A" ? warrior.name : opponent.name;
        const loserName = outcome.winner === "A" ? opponent.name : warrior.name;
        announcement = recapLine(winnerName, loserName, outcome.minutes);
      }

      weekResults.push({ a: warrior, d: opponent, outcome, announcement });
    }

    // Mark fight of the week
    if (weekResults.length > 0) {
      let bestIdx = 0;
      let bestScore = -1;
      weekResults.forEach((r, i) => {
        let score = 0;
        const t = r.outcome.post?.tags ?? [];
        if (t.includes("Kill")) score += 5;
        if (t.includes("KO")) score += 3;
        if (t.includes("Flashy")) score += 2;
        if (t.includes("Comeback")) score += 4;
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      });
      if (bestScore > 0) {
        const bestFight = updatedState.arenaHistory[updatedState.arenaHistory.length - weekResults.length + bestIdx];
        if (bestFight) {
          LoreArchive.markFightOfWeek(state.week, bestFight.id);
        }
      }
    }

    // Update crowd mood
    updatedState.crowdMood = computeCrowdMood(updatedState.arenaHistory);

    // Tick trainer contracts
    updatedState.trainers = (updatedState.trainers ?? []).map((t) => ({
      ...t,
      contractWeeksLeft: Math.max(0, t.contractWeeksLeft - 1),
    })).filter((t) => t.contractWeeksLeft > 0);

    // Newsletter with top movers
    const highlights = weekResults.map((r) => {
      const winner = r.outcome.winner === "A" ? r.a.name : r.outcome.winner === "D" ? r.d.name : "Draw";
      const deathNote = r.outcome.by === "Kill" ? " ☠️" : "";
      return `${r.a.name} vs ${r.d.name}: ${winner} ${r.outcome.by ? `by ${r.outcome.by}` : "(Draw)"}${deathNote}`;
    });

    // Top movers: warriors who gained the most fame this week
    const fameChanges = new Map<string, { name: string; fame: number; pop: number }>();
    for (const r of weekResults) {
      const isAWinner = r.outcome.winner === "A";
      const isDWinner = r.outcome.winner === "D";
      if (isAWinner) {
        const existing = fameChanges.get(r.a.name) ?? { name: r.a.name, fame: 0, pop: 0 };
        existing.fame += (r.outcome.post?.tags ?? []).includes("Kill") ? 3 : 1;
        fameChanges.set(r.a.name, existing);
      }
      if (isDWinner) {
        const existing = fameChanges.get(r.d.name) ?? { name: r.d.name, fame: 0, pop: 0 };
        existing.fame += (r.outcome.post?.tags ?? []).includes("Kill") ? 3 : 1;
        fameChanges.set(r.d.name, existing);
      }
    }
    const topMovers = [...fameChanges.values()].sort((a, b) => b.fame - a.fame).slice(0, 3);
    if (topMovers.length > 0) {
      highlights.push(`⭐ Top Mover: ${topMovers[0].name} (+${topMovers[0].fame} fame)`);
    }

    updatedState.newsletter = [
      ...updatedState.newsletter,
      { week: state.week, title: "Arena Gazette", items: highlights },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Run Round</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Week {state.week}, {state.season} — {state.roster.filter(w => w.status === "Active").length} warriors ready ·
            Crowd: {state.crowdMood}
          </p>
        </div>
        <Button
          onClick={runWeek}
          disabled={running || state.roster.filter(w => w.status === "Active").length < 2}
          className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
          size="lg"
        >
          <Zap className="h-4 w-4" />
          Simulate Round
        </Button>
      </div>

      {/* Empty state CTA when not enough warriors */}
      {state.roster.filter(w => w.status === "Active").length < 2 && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Swords className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              You need at least <span className="font-semibold text-foreground">2 active warriors</span> to run a round.
            </p>
            <Link to="/recruit">
              <Button className="gap-2 mt-2">
                <UserPlus className="h-4 w-4" /> Recruit Warriors
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-semibold">Results — Week {state.week - 1}</h2>
          {results.map((r, i) => (
            <BoutViewer
              key={i}
              nameA={r.a.name}
              nameD={r.d.name}
              styleA={r.a.style}
              styleD={r.d.style}
              log={r.outcome.log}
              winner={r.outcome.winner}
              by={r.outcome.by}
              announcement={r.announcement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
