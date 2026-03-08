import React, { useState, useMemo } from "react";
import { useGame } from "@/state/GameContext";
import { advanceWeek } from "@/state/gameStore";
import { simulateFight, defaultPlanForWarrior, fameFromTags } from "@/engine";
import { computeCrowdMood, getMoodModifiers } from "@/engine/crowdMood";
import { killWarrior } from "@/state/gameStore";
import { StyleMeter } from "@/metrics/StyleMeter";
import { LoreArchive } from "@/lore/LoreArchive";
import { ArenaHistory } from "@/engine/history/arenaHistory";
import { NewsletterFeed } from "@/engine/newsletter/feed";
import { StyleRollups } from "@/engine/stats/styleRollups";
import { commentatorFor } from "@/ui/commentator";
import { recapLine } from "@/ui/fightVariety";
import { rollForInjury, isTooInjuredToFight, type Injury } from "@/engine/injuries";
import { calculateXP, applyXP } from "@/engine/progression";
import {
  generateMatchCard,
  addRestState,
  addMatchRecord,
  detectRivalries,
  type MatchPairing,
} from "@/engine/matchmaking";
import type { FightSummary, Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Zap, Skull, UserPlus, Flame, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BoutViewer from "@/components/BoutViewer";
import { WarriorLink, StableLink } from "@/components/EntityLink";

export default function RunRound() {
  const { state, setState } = useGame();
  const [results, setResults] = useState<
    { a: Warrior; d: Warrior; outcome: ReturnType<typeof simulateFight>; announcement?: string; isRivalry: boolean; rivalStable?: string }[]
  >([]);
  const [running, setRunning] = useState(false);

  const fightReady = state.roster.filter(w => {
    if (w.status !== "Active") return false;
    const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
    return !isTooInjuredToFight(injObjs);
  });
  const tooInjuredCount = state.roster.filter(w => w.status === "Active").length - fightReady.length;
  const inTrainingCount = (state.trainingAssignments || []).length;

  // Generate the upcoming match card
  const matchCard = useMemo(() => generateMatchCard(state), [state]);
  const hasRivals = (state.rivals || []).length > 0;

  const runWeek = () => {
    if (running) return;
    setRunning(true);

    const weekResults: typeof results = [];
    let updatedState = { ...state };
    const moodMods = getMoodModifiers(state.crowdMood as any);

    // Use cross-stable pairings if rivals exist, otherwise fall back to internal
    const pairings: { a: Warrior; d: Warrior; isRivalry: boolean; rivalStable?: string; rivalStableId?: string }[] = [];

    if (matchCard.length > 0) {
      for (const mp of matchCard) {
        pairings.push({
          a: mp.playerWarrior,
          d: mp.rivalWarrior,
          isRivalry: mp.isRivalryBout,
          rivalStable: mp.rivalStable.owner.stableName,
          rivalStableId: mp.rivalStable.owner.id,
        });
      }
    } else {
      // Fallback: internal matchmaking (pre-rivals or no rivals)
      const activeWarriors = updatedState.roster.filter(w => {
        if (w.status !== "Active") return false;
        const injObjs = (w.injuries || []).filter((i): i is Injury => typeof i !== "string");
        return !isTooInjuredToFight(injObjs);
      });
      const paired = new Set<string>();
      for (let i = 0; i < activeWarriors.length; i++) {
        if (paired.has(activeWarriors[i].id)) continue;
        for (let j = i + 1; j < activeWarriors.length; j++) {
          if (paired.has(activeWarriors[j].id)) continue;
          pairings.push({ a: activeWarriors[i], d: activeWarriors[j], isRivalry: false });
          paired.add(activeWarriors[i].id);
          paired.add(activeWarriors[j].id);
          break;
        }
      }
    }

    if (pairings.length === 0) {
      setRunning(false);
      toast.error("No valid pairings available this week.");
      return;
    }

    for (const pairing of pairings) {
      const { a: warrior, d: opponent, isRivalry, rivalStable, rivalStableId } = pairing;

      // Check both still active
      const currentW = updatedState.roster.find(w => w.id === warrior.id);
      // For rival warriors, check in rivals roster
      let currentO: Warrior | undefined;
      if (rivalStableId) {
        for (const r of updatedState.rivals || []) {
          currentO = r.roster.find(w => w.id === opponent.id);
          if (currentO) break;
        }
      } else {
        currentO = updatedState.roster.find(w => w.id === opponent.id);
      }
      if (!currentW || currentW.status !== "Active" || !currentO) continue;

      const planA = currentW.plan ?? defaultPlanForWarrior(currentW);
      const planD = currentO.plan ?? defaultPlanForWarrior(currentO);
      const outcome = simulateFight(planA, planD, currentW, currentO, undefined, updatedState.trainers);

      const tags = outcome.post?.tags ?? [];
      const rawFameA = fameFromTags(outcome.winner === "A" ? tags : []);
      const rawFameD = fameFromTags(outcome.winner === "D" ? tags : []);
      // Rivalry fame multiplier
      const rivalryMult = isRivalry ? 2 : 1;
      const fameA = Math.round(rawFameA.fame * moodMods.fameMultiplier * rivalryMult);
      const popA = Math.round(rawFameA.pop * moodMods.popMultiplier);
      const fameD = Math.round(rawFameD.fame * moodMods.fameMultiplier);
      const popD = Math.round(rawFameD.pop * moodMods.popMultiplier);

      // Update player warrior records
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map(w => {
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
          // If internal bout, update opponent too
          if (!rivalStableId && w.id === opponent.id) {
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

      // Update rival warrior records
      if (rivalStableId) {
        updatedState.rivals = (updatedState.rivals || []).map(r => ({
          ...r,
          roster: r.roster.map(w => {
            if (w.id === opponent.id) {
              return {
                ...w,
                fame: Math.max(0, w.fame + fameD),
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
        }));
      }

      // Handle death
      if (outcome.by === "Kill") {
        if (outcome.winner === "A") {
          // Rival warrior died
          if (rivalStableId) {
            updatedState.rivals = (updatedState.rivals || []).map(r => ({
              ...r,
              roster: r.roster.filter(w => w.id !== opponent.id),
            }));
            // Detect rivalry
            updatedState.rivalries = detectRivalries(
              updatedState.rivalries || [], state.player.id, rivalStableId,
              warrior.name, opponent.name, state.week
            );
          } else {
            updatedState = killWarrior(updatedState, opponent.id, warrior.name, "Killed in arena combat");
          }
        } else {
          // Player warrior died
          updatedState = killWarrior(updatedState, warrior.id, opponent.name, "Killed in arena combat");
          if (rivalStableId) {
            updatedState.rivalries = detectRivalries(
              updatedState.rivalries || [], rivalStableId, state.player.id,
              opponent.name, warrior.name, state.week
            );
          }
        }
      }

      // Rest states for KO losers
      if (outcome.by === "KO") {
        const loserId = outcome.winner === "A" ? opponent.id : warrior.id;
        updatedState.restStates = addRestState(updatedState.restStates || [], loserId, "KO", state.week);
      }

      // Apply injuries to player warriors
      const injA = rollForInjury(warrior, outcome, "A");
      if (injA) {
        updatedState = {
          ...updatedState,
          roster: updatedState.roster.map(w =>
            w.id === warrior.id ? { ...w, injuries: [...(w.injuries || []), injA as any] } : w
          ),
        };
      }
      if (!rivalStableId) {
        const injD = rollForInjury(opponent, outcome, "D");
        if (injD) {
          updatedState = {
            ...updatedState,
            roster: updatedState.roster.map(w =>
              w.id === opponent.id ? { ...w, injuries: [...(w.injuries || []), injD as any] } : w
            ),
          };
        }
      }

      // XP progression for player warriors
      const xpA = calculateXP(outcome, "A", tags);
      updatedState = {
        ...updatedState,
        roster: updatedState.roster.map(w => {
          if (w.id === warrior.id) {
            const { warrior: updated } = applyXP(w, xpA);
            return updated;
          }
          return w;
        }),
      };
      if (!rivalStableId) {
        const xpD = calculateXP(outcome, "D", tags);
        updatedState = {
          ...updatedState,
          roster: updatedState.roster.map(w => {
            if (w.id === opponent.id) {
              const { warrior: updated } = applyXP(w, xpD);
              return updated;
            }
            return w;
          }),
        };
      }

      // Track match history for repeat avoidance
      if (rivalStableId) {
        updatedState.matchHistory = addMatchRecord(
          updatedState.matchHistory || [], warrior.id, opponent.id, rivalStableId, state.week
        );
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
        fameA: warrior.fame,
        fameD: opponent.fame,
        popularityDeltaA: popA,
        popularityDeltaD: popD,
        transcript: outcome.log.map(e => e.text),
        createdAt: new Date().toISOString(),
      };
      updatedState.arenaHistory = [...updatedState.arenaHistory, summary];

      // Check for Giant Killer flair — 3+ upset wins in career
      if (outcome.winner) {
        const winnerW = outcome.winner === "A" ? warrior : opponent;
        const loserW = outcome.winner === "A" ? opponent : warrior;
        if (loserW.fame >= winnerW.fame + 10 && loserW.fame >= winnerW.fame * 2) {
          // Count total career upsets for this warrior
          const upsetCount = updatedState.arenaHistory.filter(af => {
            if (af.fameA == null || af.fameD == null || !af.winner) return false;
            const wName = af.winner === "A" ? af.a : af.d;
            if (wName !== winnerW.name) return false;
            const wFame = af.winner === "A" ? af.fameA : af.fameD;
            const lFame = af.winner === "A" ? af.fameD : af.fameA;
            return lFame >= wFame + 10 && lFame >= wFame * 2;
          }).length;
          if (upsetCount >= 3 && !winnerW.flair.includes("Giant Killer")) {
            updatedState.roster = updatedState.roster.map(w =>
              w.id === winnerW.id ? { ...w, flair: [...w.flair, "Giant Killer"] } : w
            );
          }
        }
      }

      StyleMeter.recordFight({ styleA: warrior.style, styleD: opponent.style, winner: outcome.winner, by: outcome.by });
      StyleRollups.addFight({ week: state.week, styleA: warrior.style, styleD: opponent.style, winner: outcome.winner, by: outcome.by });
      ArenaHistory.append(summary);
      LoreArchive.signalFight(summary);
      NewsletterFeed.appendFightResult({ summary, transcript: outcome.log.map(e => e.text) });

      let announcement: string | undefined;
      if (outcome.by === "Kill") announcement = commentatorFor("Kill");
      else if (outcome.by === "KO") announcement = commentatorFor("KO");
      else if (tags.includes("Flashy")) announcement = commentatorFor("Flashy");
      else if (tags.includes("Comeback")) announcement = commentatorFor("Upset");
      else if (outcome.winner) {
        const winnerName = outcome.winner === "A" ? warrior.name : opponent.name;
        const loserName = outcome.winner === "A" ? opponent.name : warrior.name;
        announcement = recapLine(winnerName, loserName, outcome.minutes);
      }

      weekResults.push({ a: warrior, d: opponent, outcome, announcement, isRivalry, rivalStable });
    }

    // Mark fight of the week
    if (weekResults.length > 0) {
      let bestIdx = 0, bestScore = -1;
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
        if (bestFight) LoreArchive.markFightOfWeek(state.week, bestFight.id);
      }
    }

    updatedState.crowdMood = computeCrowdMood(updatedState.arenaHistory);

    // Tick trainer contracts
    updatedState.trainers = (updatedState.trainers ?? []).map(t => ({
      ...t, contractWeeksLeft: Math.max(0, t.contractWeeksLeft - 1),
    })).filter(t => t.contractWeeksLeft > 0);

    // Newsletter
    const highlights: string[] = [];

    // Rivalry special coverage
    const rivalryBouts = weekResults.filter(r => r.isRivalry && r.rivalStable);
    if (rivalryBouts.length > 0) {
      const rivalryTemplates = [
        (player: string, rival: string, stable: string) => `🔥 RIVALRY BOUT: The blood feud between ${state.player.stableName} and ${stable} continues — ${player} faced ${rival} in a grudge match!`,
        (player: string, rival: string, stable: string) => `⚔️ VENDETTA: ${player} stepped into the arena against ${rival} of ${stable} — the crowd roared for blood!`,
        (player: string, rival: string, stable: string) => `🏟️ GRUDGE MATCH: Tensions between ${state.player.stableName} and ${stable} boiled over as ${player} clashed with ${rival}!`,
        (player: string, rival: string, stable: string) => `💀 BAD BLOOD: ${player} and ${rival} (${stable}) met in a rivalry bout — neither side will forgive, neither will forget.`,
      ];
      for (const r of rivalryBouts) {
        const template = rivalryTemplates[Math.floor(Math.random() * rivalryTemplates.length)];
        highlights.push(template(r.a.name, r.d.name, r.rivalStable!));
        if (r.outcome.by === "Kill") {
          const killer = r.outcome.winner === "A" ? r.a.name : r.d.name;
          const victim = r.outcome.winner === "A" ? r.d.name : r.a.name;
          highlights.push(`☠️ BLOOD FEUD ESCALATES: ${killer} slew ${victim} — this rivalry just turned deadly!`);
        }
      }
    }

    for (const r of weekResults) {
      const winner = r.outcome.winner === "A" ? r.a.name : r.outcome.winner === "D" ? r.d.name : "Draw";
      const deathNote = r.outcome.by === "Kill" ? " ☠️" : "";
      const rivalTag = r.rivalStable ? ` (vs ${r.rivalStable})` : "";
      highlights.push(`${r.a.name} vs ${r.d.name}${rivalTag}: ${winner} ${r.outcome.by ? `by ${r.outcome.by}` : "(Draw)"}${deathNote}`);
    }

    const fameChanges = new Map<string, { name: string; fame: number }>();
    for (const r of weekResults) {
      if (r.outcome.winner === "A") {
        const existing = fameChanges.get(r.a.name) ?? { name: r.a.name, fame: 0 };
        existing.fame += (r.outcome.post?.tags ?? []).includes("Kill") ? 3 : 1;
        fameChanges.set(r.a.name, existing);
      }
      if (r.outcome.winner === "D" && !r.rivalStable) {
        const existing = fameChanges.get(r.d.name) ?? { name: r.d.name, fame: 0 };
        existing.fame += (r.outcome.post?.tags ?? []).includes("Kill") ? 3 : 1;
        fameChanges.set(r.d.name, existing);
      }
    }
    const topMovers = [...fameChanges.values()].sort((a, b) => b.fame - a.fame).slice(0, 3);
    if (topMovers.length > 0) {
      highlights.push(`⭐ Top Mover: ${topMovers[0].name} (+${topMovers[0].fame} fame)`);
    }

    updatedState.newsletter = [...updatedState.newsletter, { week: state.week, title: "Arena Gazette", items: highlights }];

    // Accumulate stable fame from warrior fame deltas
    let stableFameDelta = 0;
    for (const r of weekResults) {
      if (r.outcome.winner === "A") {
        stableFameDelta += (r.outcome.post?.tags ?? []).includes("Kill") ? 3 : 1;
      }
    }
    updatedState.fame = (updatedState.fame ?? 0) + stableFameDelta;
    updatedState.player = {
      ...updatedState.player,
      fame: (updatedState.player.fame ?? 0) + stableFameDelta,
    };

    // Close newsletter issue
    NewsletterFeed.closeWeekToIssue(state.week);

    // Now run full advanceWeek processing (training, economy, aging, injuries, AI bouts, recruit pool, tier progression, week increment)
    updatedState = advanceWeek(updatedState);

    setState(updatedState);
    setResults(weekResults);
    setRunning(false);

    const deaths = weekResults.filter(r => r.outcome.by === "Kill").length;
    const rivalBouts = weekResults.filter(r => r.rivalStable).length;
    toast.success(
      `Week ${state.week} complete! ${weekResults.length} bouts (${rivalBouts} cross-stable).${deaths > 0 ? ` ${deaths} death(s)!` : ""}`
    );
  };

  const activeRivalries = (state.rivalries || []).filter(r => r.intensity > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Run Round</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Week {state.week}, {state.season} — {fightReady.length} warriors ready ·
            Crowd: {state.crowdMood}
            {tooInjuredCount > 0 && (
              <span className="text-destructive ml-1">({tooInjuredCount} too injured)</span>
            )}
            {inTrainingCount > 0 && (
              <span className="text-muted-foreground ml-1">({inTrainingCount} in training)</span>
            )}
          </p>
        </div>
        <Button
          onClick={runWeek}
          disabled={running || (fightReady.length < 1 && matchCard.length === 0)}
          className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto"
          size="lg"
        >
          <Zap className="h-4 w-4" />
          Simulate Round
        </Button>
      </div>

      {/* Active Rivalries */}
      {activeRivalries.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Flame className="h-4 w-4 text-destructive" /> Active Rivalries
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeRivalries.map((r, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {"🔥".repeat(Math.min(r.intensity, 5))} {r.reason}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-Bout Match Card */}
      {results.length === 0 && matchCard.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Swords className="h-4 w-4" /> Upcoming Match Card — {matchCard.length} bout{matchCard.length !== 1 ? "s" : ""}
            </h3>
            <div className="divide-y divide-border">
              {matchCard.map((mp, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <WarriorLink name={mp.playerWarrior.name} id={mp.playerWarrior.id} className="font-semibold" />
                    <Badge variant="outline" className="text-xs">{STYLE_DISPLAY_NAMES[mp.playerWarrior.style]}</Badge>
                    <span className="text-muted-foreground text-xs">Fame {mp.playerWarrior.fame}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mp.isRivalryBout && <Flame className="h-3.5 w-3.5 text-destructive" />}
                    <span className="text-muted-foreground font-medium">vs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">Fame {mp.rivalWarrior.fame}</span>
                    <Badge variant="outline" className="text-xs">{STYLE_DISPLAY_NAMES[mp.rivalWarrior.style]}</Badge>
                    <WarriorLink name={mp.rivalWarrior.name} id={mp.rivalWarrior.id} className="font-semibold" />
                    <StableLink name={mp.rivalStable.owner.stableName} className="text-xs text-muted-foreground">
                      ({mp.rivalStable.owner.stableName})
                    </StableLink>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resting warriors */}
      {(state.restStates || []).filter(r => r.restUntilWeek > state.week).length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {(state.restStates || []).filter(r => r.restUntilWeek > state.week).length} warrior(s) resting this week
        </div>
      )}

      {/* Empty state */}
      {state.roster.filter(w => w.status === "Active").length < 1 && matchCard.length === 0 && results.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Swords className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              You need at least <span className="font-semibold text-foreground">1 active warrior</span> and rival stables to run a round.
            </p>
            <Link to="/recruit">
              <Button className="gap-2 mt-2">
                <UserPlus className="h-4 w-4" /> Recruit Warriors
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No rivals warning */}
      {!hasRivals && fightReady.length >= 2 && results.length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 inline mr-1.5 text-amber-500" />
            No rival stables present. Your warriors will fight each other. Complete the Orphanage to generate rival stables!
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-semibold">Results — Week {state.week - 1}</h2>
          {results.map((r, i) => (
            <div key={i} className="space-y-1">
              {r.isRivalry && (
                <div className="flex items-center gap-1 text-xs text-destructive font-semibold">
                  <Flame className="h-3 w-3" /> Rivalry Bout{r.rivalStable ? ` — vs ${r.rivalStable}` : ""}
                </div>
              )}
              {r.rivalStable && !r.isRivalry && (
                <div className="text-xs text-muted-foreground">vs {r.rivalStable}</div>
              )}
              <BoutViewer
                nameA={r.a.name}
                nameD={r.d.name}
                styleA={r.a.style}
                styleD={r.d.style}
                log={r.outcome.log}
                winner={r.outcome.winner}
                by={r.outcome.by}
                announcement={r.announcement}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
