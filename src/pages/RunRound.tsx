import React, { useState, useMemo, useCallback } from "react";
import { useGameStore } from "@/state/useGameStore";
import { advanceWeek } from "@/state/gameStore";
import { generateMatchCard } from "@/engine/matchmaking";
import { isFightReady } from "@/engine/warriorStatus";
import type { InjuryData } from "@/types/game";
import { processWeekBouts, generatePairings, type BoutResult } from "@/engine/boutProcessor";
import { runAutosim, type AutosimResult, type WeekSummary } from "@/engine/autosim";
import type { Warrior } from "@/types/game";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatBadge, WarriorNameTag } from "@/components/ui/WarriorBadges";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Swords, Zap, Skull, UserPlus, Flame, Shield, Clock, FastForward, Trophy, Heart, ChevronDown, Crosshair, Ban, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import BoutViewer from "@/components/BoutViewer";
import { StableLink } from "@/components/EntityLink";

function getLethalityHint(wA: Warrior, wB: Warrior, crowdMood: string): { label: string; color: string } {
  let score = 0;
  
  // Lower HP = higher risk
  if (wA.derivedStats.hp < 15 || wB.derivedStats.hp < 15) score += 2;
  else if (wA.derivedStats.hp < 25 || wB.derivedStats.hp < 25) score += 1;

  // Power styles hit harder
  const powerStyles = ["Bashing Attack", "Striking Attack", "Slashing Attack", "Lunging Attack"];
  if (powerStyles.includes(wA.style)) score += 1;
  if (powerStyles.includes(wB.style)) score += 1;

  // Crowd mood
  if (crowdMood === "Bloodthirsty") score += 2;
  else if (crowdMood === "Restless") score += 1;

  if (score >= 4) return { label: "High Lethality Risk", color: "text-destructive border-destructive" };
  if (score >= 2) return { label: "Moderate Danger", color: "text-amber-500 border-amber-500/50" };
  return { label: "Standard Bout", color: "text-muted-foreground border-border" };
}

import { useShallow } from 'zustand/react/shallow';

export default function RunRound() {
  const { state, setState } = useGameStore(
    useShallow((s) => ({ state: s.state, setState: s.setState }))
  );
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{ current: number; total: number; lastSummary?: WeekSummary } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);

  const fightReady = state.roster.filter(isFightReady);
  const tooInjuredCount = state.roster.filter(w => w.status === "Active").length - fightReady.length;
  const inTrainingCount = (state.trainingAssignments || []).length;

  const matchCard = useMemo(() => generateMatchCard(state), [state]);
  const hasRivals = (state.rivals || []).length > 0;

  const runWeek = useCallback(() => {
    if (running) return;
    setRunning(true);

    const pairings = generatePairings(state);
    if (pairings.length === 0) {
      setRunning(false);
      toast.error("No valid pairings available this week.");
      return;
    }

    // Process all bouts via shared engine
    const processed = processWeekBouts(state);

    // Tick trainer contracts
    let updatedState = {
      ...processed.state,
      trainers: (processed.state.trainers ?? []).map(t => ({
        ...t, contractWeeksLeft: Math.max(0, t.contractWeeksLeft - 1),
      })).filter(t => t.contractWeeksLeft > 0),
    };

    // Run full advanceWeek pipeline (training, economy, aging, injuries, AI bouts, etc.)
    updatedState = advanceWeek(updatedState);

    // Extract the latest gazette generated during this week's simulation
    // This is simple since weekPipeline or advanceWeek already pushed it to state.newsletter
    // We only want the items from the exact week we just completed.
    const weekNewsletter = updatedState.newsletter.filter(n => n.week === state.week);

    // Filter injuries/deaths from the player's roster specifically
    const playerDeaths = processed.summary.deathNames || [];
    const playerInjuries = processed.summary.injuryNames || [];
    const playerPromotions = []; // Could add logic if needed

    updatedState = {
      ...updatedState,
      phase: "resolution",
      pendingResolutionData: {
        gazette: weekNewsletter,
        injuries: playerInjuries,
        deaths: playerDeaths,
        bouts: processed.results,
        promotions: playerPromotions,
      }
    };

    setState(updatedState);
    // setResults(processed.results); // handled in resolution phase now
    setRunning(false);

    // Replaced toast with the Grand Submission UI flow.
  }, [running, state, setState]);

  const startAutosim = useCallback(async (weeks: number) => {
    if (autosimming || running) return;
    setAutosimming(true);
    setAutosimResult(null);
    setResults([]);
    setAutosimProgress({ current: 0, total: weeks });

    const result = await runAutosim(state, weeks, (current, total, summary) => {
      setAutosimProgress({ current, total, lastSummary: summary });
    });

    setState(result.finalState);
    setAutosimResult(result);
    setAutosimming(false);
    setAutosimProgress(null);

    const stopEmoji: Record<string, string> = {
      death: "💀", player_death: "☠️", injury: "🩹",
      rivalry_escalation: "🔥", tournament_week: "🏆",
      max_weeks: "✅", no_pairings: "⚠️",
    };
    toast(`${stopEmoji[result.stopReason] ?? "⏹"} Autosim stopped after ${result.weeksSimmed} week(s): ${result.stopDetail}`);
  }, [autosimming, running, state, setState]);


  const activeRivalries = (state.rivalries || []).filter(r => r.intensity > 0);

  const availableRivals = useMemo(() => {
    const list: { id: string; name: string; isStable: boolean; stableName?: string }[] = [];
    for (const r of state.rivals || []) {
      list.push({ id: r.owner.id, name: r.owner.stableName, isStable: true });
      for (const w of r.roster) {
        if (w.status === "Active") {
          list.push({ id: w.id, name: w.name, isStable: false, stableName: r.owner.stableName });
        }
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.rivals]);

  const [challengeSelection, setChallengeSelection] = useState<string>("");
  const [avoidSelection, setAvoidSelection] = useState<string>("");

  const addChallenge = useCallback(() => {
    if (!challengeSelection) return;
    if (state.playerChallenges?.includes(challengeSelection)) return;
    setState({ ...state, playerChallenges: [...(state.playerChallenges || []), challengeSelection] });
    setChallengeSelection("");
  }, [challengeSelection, state, setState]);

  const addAvoid = useCallback(() => {
    if (!avoidSelection) return;
    if (state.playerAvoids?.includes(avoidSelection)) return;
    setState({ ...state, playerAvoids: [...(state.playerAvoids || []), avoidSelection] });
    setAvoidSelection("");
  }, [avoidSelection, state, setState]);

  const removeChallenge = useCallback((id: string) => {
    setState({ ...state, playerChallenges: (state.playerChallenges || []).filter(x => x !== id) });
  }, [state, setState]);

  const removeAvoid = useCallback((id: string) => {
    setState({ ...state, playerAvoids: (state.playerAvoids || []).filter(x => x !== id) });
  }, [state, setState]);


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
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={runWeek}
            disabled={running || autosimming || state.phase === "resolution" || (fightReady.length < 1 && matchCard.length === 0)}
            className="gap-2 bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
            size="lg"
          >
            <Zap className="h-4 w-4" />
            Submit Cycle
          </Button>
          <Button
            variant="outline"
            onClick={() => startAutosim(4)}
            disabled={running || autosimming || (fightReady.length < 1 && matchCard.length === 0)}
            className="gap-2 flex-1 sm:flex-none"
            size="lg"
          >
            <FastForward className="h-4 w-4" />
            Autosim 4
          </Button>
          <Button
            variant="outline"
            onClick={() => startAutosim(13)}
            disabled={running || autosimming || (fightReady.length < 1 && matchCard.length === 0)}
            className="gap-2 flex-1 sm:flex-none"
            size="lg"
          >
            <FastForward className="h-4 w-4" />
            Autosim Season
          </Button>
        </div>
      </div>

      {/* Autosim progress */}
      {autosimming && autosimProgress && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-semibold flex items-center gap-2">
                <FastForward className="h-4 w-4 text-primary animate-pulse" /> Autosimming...
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Week {autosimProgress.current}/{autosimProgress.total}
              </span>
            </div>
            <Progress value={(autosimProgress.current / autosimProgress.total) * 100} className="h-2" />
            {autosimProgress.lastSummary && (
              <p className="text-xs text-muted-foreground">
                Week {autosimProgress.lastSummary.week}: {autosimProgress.lastSummary.bouts} bouts
                {autosimProgress.lastSummary.deaths > 0 && <span className="text-destructive"> · {autosimProgress.lastSummary.deaths} deaths</span>}
                {autosimProgress.lastSummary.injuries > 0 && <span className="text-amber-500"> · {autosimProgress.lastSummary.injuries} injuries</span>}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Autosim Recap */}
      {autosimResult && !autosimming && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold">
                Autosim Recap — {autosimResult.weeksSimmed} week{autosimResult.weeksSimmed !== 1 ? "s" : ""}
              </h3>
              <Badge variant={autosimResult.stopReason === "max_weeks" ? "default" : "destructive"} className="text-xs">
                {autosimResult.stopReason === "max_weeks" ? "Completed" :
                 autosimResult.stopReason === "death" ? "Death" :
                 autosimResult.stopReason === "player_death" ? "Player Death!" :
                 autosimResult.stopReason === "injury" ? "Injury" :
                 autosimResult.stopReason === "rivalry_escalation" ? "Rivalry!" :
                 autosimResult.stopReason === "tournament_week" ? "Tournament" :
                 "Stopped"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{autosimResult.stopDetail}</p>

            {/* Aggregate stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-secondary p-2 text-center">
                <div className="text-lg font-bold">{autosimResult.weekSummaries.reduce((s, w) => s + w.bouts, 0)}</div>
                <div className="text-[10px] text-muted-foreground">Total Bouts</div>
              </div>
              <div className="rounded-lg bg-secondary p-2 text-center">
                <div className="text-lg font-bold text-destructive">{autosimResult.weekSummaries.reduce((s, w) => s + w.deaths, 0)}</div>
                <div className="text-[10px] text-muted-foreground">Deaths</div>
              </div>
              <div className="rounded-lg bg-secondary p-2 text-center">
                <div className="text-lg font-bold text-amber-500">{autosimResult.weekSummaries.reduce((s, w) => s + w.injuries, 0)}</div>
                <div className="text-[10px] text-muted-foreground">Injuries</div>
              </div>
            </div>

            {/* Week-by-week expandable details */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Week-by-Week Breakdown</h4>
              {autosimResult.weekSummaries.map((ws, i) => {
                const hasEvents = ws.deaths > 0 || ws.injuries > 0;
                return (
                  <Collapsible key={i}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 px-2 rounded hover:bg-muted/50 text-xs group transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground w-14">Wk {ws.week}</span>
                        <span className="font-medium">{ws.bouts} bout{ws.bouts !== 1 ? "s" : ""}</span>
                        {ws.deaths > 0 && (
                          <span className="flex items-center gap-0.5 text-destructive">
                            <Skull className="h-3 w-3" /> {ws.deaths}
                          </span>
                        )}
                        {ws.injuries > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Heart className="h-3 w-3" /> {ws.injuries}
                          </span>
                        )}
                        {!hasEvents && ws.bouts > 0 && (
                          <span className="text-muted-foreground">— clean week</span>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-16 pb-2 space-y-1 text-xs text-muted-foreground border-l-2 border-border pl-3">
                        {ws.bouts === 0 && <p>No bouts this week.</p>}
                        {ws.deathNames.length > 0 && (
                          <p className="text-destructive">
                            ☠️ Fallen: {ws.deathNames.join(", ")}
                          </p>
                        )}
                        {ws.injuryNames.length > 0 && (
                          <p className="text-amber-500">
                            🩹 Injured: {ws.injuryNames.join(", ")}
                          </p>
                        )}
                        {ws.deaths === 0 && ws.injuries === 0 && ws.bouts > 0 && (
                          <p>All warriors fought without incident.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            <Button variant="outline" size="sm" onClick={() => setAutosimResult(null)} className="w-full text-xs">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

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


      {/* Challenge / Avoid Assistant */}
      {!running && !autosimming && results.length === 0 && matchCard.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Crosshair className="h-4 w-4 text-primary" /> Challenge / Avoid Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct your stable's matchmaking focus. The arena booking agent will heavily prioritize challenges and try to honor avoid requests, though no match is guaranteed.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-arena-pop">Challenges (Prioritize)</div>
                <div className="flex gap-2">
                  <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={challengeSelection}
                    onChange={e => setChallengeSelection(e.target.value)}
                  >
                    <option value="">Select target to challenge...</option>
                    {availableRivals.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.isStable ? `[Stable] ${r.name}` : `${r.name} (${r.stableName})`}
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" size="sm" onClick={addChallenge}>Add</Button>
                </div>
                {state.playerChallenges && state.playerChallenges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {state.playerChallenges.map(id => {
                      const entity = availableRivals.find(r => r.id === id);
                      return (
                        <Badge key={id} variant="outline" className="gap-1.5 text-xs">
                          <Crosshair className="h-3 w-3 text-arena-pop" />
                          {entity ? (entity.isStable ? `[Stable] ${entity.name}` : entity.name) : id}
                          <button onClick={() => removeChallenge(id)} className="text-muted-foreground hover:text-destructive ml-1" aria-label="Remove challenge">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-destructive">Avoid (Penalize)</div>
                <div className="flex gap-2">
                  <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={avoidSelection}
                    onChange={e => setAvoidSelection(e.target.value)}
                  >
                    <option value="">Select target to avoid...</option>
                    {availableRivals.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.isStable ? `[Stable] ${r.name}` : `${r.name} (${r.stableName})`}
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" size="sm" onClick={addAvoid}>Add</Button>
                </div>
                {state.playerAvoids && state.playerAvoids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {state.playerAvoids.map(id => {
                      const entity = availableRivals.find(r => r.id === id);
                      return (
                        <Badge key={id} variant="outline" className="gap-1.5 text-xs">
                          <Ban className="h-3 w-3 text-destructive" />
                          {entity ? (entity.isStable ? `[Stable] ${entity.name}` : entity.name) : id}
                          <button onClick={() => removeAvoid(id)} className="text-muted-foreground hover:text-destructive ml-1" aria-label="Remove avoid target">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <WarriorNameTag name={mp.playerWarrior.name} id={mp.playerWarrior.id} />
                    <StatBadge styleName={mp.playerWarrior.style} showFullName />
                    <span className="text-muted-foreground text-xs hidden sm:inline">Fame {mp.playerWarrior.fame}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-col px-2">
                    {mp.isRivalryBout && <Flame className="h-3.5 w-3.5 text-destructive" />}
                    <span className="text-muted-foreground font-medium">vs</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getLethalityHint(mp.playerWarrior, mp.rivalWarrior, state.crowdMood).color}`}>
                      {getLethalityHint(mp.playerWarrior, mp.rivalWarrior, state.crowdMood).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-muted-foreground text-xs">Fame {mp.rivalWarrior.fame}</span>
                    <StatBadge styleName={mp.rivalWarrior.style} showFullName />
                    <WarriorNameTag name={mp.rivalWarrior.name} id={mp.rivalWarrior.id} />
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
            <Link to="/stable/recruit">
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

      {/* Results moved to Resolution Phase Modal */}
    </div>
  );
}
