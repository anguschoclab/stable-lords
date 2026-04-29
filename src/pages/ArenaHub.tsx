import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGameStore, reconstructGameState, type GameStore } from '@/state/useGameStore';
import { generatePairings } from '@/engine/bout/core/pairings';
import { isFightReady } from '@/engine/warriorStatus';
import { processWeekBouts, type BoutResult } from '@/engine/boutProcessor';
import { runAutosim, type AutosimResult } from '@/engine/autosim';
import type { RivalStableData } from '@/types/game';
import { toast } from 'sonner';
import { MatchCard } from '@/components/run-round/MatchCard';
import { AutosimConsole } from '@/components/run-round/AutosimConsole';
import { RunResults } from '@/components/run-round/RunResults';
import { useShallow } from 'zustand/react/shallow';
import { calculateStableStats } from '@/engine/stats/stableStats';
import type { Warrior } from '@/types/warrior.types';
import { STYLE_DISPLAY_NAMES, FightingStyle } from '@/types/shared.types';
import {
  MOOD_DESCRIPTIONS,
  MOOD_ICONS,
  getMoodModifiers,
  type CrowdMood,
} from '@/engine/crowdMood';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WarriorNameTag } from '@/components/ui/WarriorBadges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Trophy,
  Swords,
  Flame,
  Star,
  Skull,
  Zap,
  Eye,
  TrendingUp,
  Activity,
  Target,
  Shield,
  Info,
  BarChart3,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { PageHeader } from '@/components/ui/PageHeader';

// Unified Widgets
import { MedicalAuditWidget } from '@/components/dashboard/MedicalAuditWidget';
import { IntelligenceHubWidget } from '@/components/dashboard/IntelligenceHubWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

// ─── Crowd Mood Meter ──────────────────────────────────────────────────────

function CrowdMoodWidget() {
  const { crowdMood } = useGameStore();
  const mood = crowdMood as CrowdMood;
  const mods = getMoodModifiers(mood);

  return (
    <Surface
      variant="glass"
      className="flex items-center gap-8 p-5 border-l-4 border-l-accent/50 animate-in fade-in zoom-in-95 duration-500"
    >
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {MOOD_ICONS[mood]}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
              Crowd Temperament
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground italic leading-tight max-w-[200px] mt-1">
            {MOOD_DESCRIPTIONS[mood]}
          </p>
        </div>
      </div>

      <div className="h-10 w-px bg-white/5 shrink-0" />

      <div className="flex items-center gap-6 overflow-x-auto thin-scrollbar">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05]">
              <div className="text-right">
                <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
                  FAME MULT
                </div>
                <div
                  className={cn(
                    'text-lg font-display font-black tracking-tighter leading-none',
                    mods.fameMultiplier > 1 ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  ×{mods.fameMultiplier.toFixed(1)}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
            Multiplies all fame gains from this week's bouts.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.05]">
              <div className="text-right">
                <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">
                  LETHALITY
                </div>
                <div
                  className={cn(
                    'text-lg font-display font-black tracking-tighter leading-none',
                    mods.killChanceBonus > 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {mods.killChanceBonus > 0 ? '+' : ''}
                  {(mods.killChanceBonus * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] uppercase font-black tracking-widest">
            Probability bonus added to all fatal blow checks.
          </TooltipContent>
        </Tooltip>
      </div>

      <Badge
        variant="outline"
        className="ml-auto border-accent/40 bg-accent/5 text-accent text-[9px] font-black tracking-widest shrink-0"
      >
        {mood.toUpperCase()}
      </Badge>
    </Surface>
  );
}

// ─── Arena Leaderboard ────────────────────────────────────────────────────

function ArenaLeaderboard() {
  const { roster, rivals, player } = useGameStore();

  const allWarriors = useMemo(() => {
    type Entry = { warrior: Warrior; stableName: string; isPlayer: boolean };
    const top10: Entry[] = [];

    const insert = (entry: Entry) => {
      const fame = entry.warrior.fame;
      if (top10.length === 10 && fame <= top10[9].warrior.fame) {
        return;
      }

      let i = top10.length - 1;
      while (i >= 0 && top10[i].warrior.fame < fame) {
        i--;
      }

      top10.splice(i + 1, 0, entry);
      if (top10.length > 10) {
        top10.pop();
      }
    };

    const playerStable = player.stableName;
    for (let i = 0; i < roster.length; i++) {
      const w = roster[i];
      if (w.status === 'Active') {
        insert({ warrior: w, stableName: playerStable, isPlayer: true });
      }
    }

    if (rivals) {
      for (let i = 0; i < rivals.length; i++) {
        const r = rivals[i];
        const rivalStable = r.owner.stableName;
        for (let j = 0; j < r.roster.length; j++) {
          const w = r.roster[j];
          if (w.status === 'Active') {
            insert({ warrior: w, stableName: rivalStable, isPlayer: false });
          }
        }
      }
    }

    return top10;
  }, [roster, rivals, player.stableName]);

  return (
    <Surface
      variant="glass"
      className="overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
    >
      <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            Global Power Rankings
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
          <Activity className="h-3 w-3 text-primary" /> LIVE ARENA FEED
        </div>
      </div>
      <Table>
        <TableHeader className="bg-white/[0.03]">
          <TableRow className="h-10 hover:bg-transparent border-white/5">
            <TableHead className="w-12 pl-6 text-[9px] font-black uppercase tracking-widest">
              RANK
            </TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest">
              WARRIOR
            </TableHead>
            <TableHead className="text-[9px] font-black uppercase tracking-widest">
              STABLE
            </TableHead>
            <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">
              W / L / K
            </TableHead>
            <TableHead className="pr-6 text-right text-[9px] font-black uppercase tracking-widest">
              FAME
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allWarriors.map((entry, i) => {
            const w = entry.warrior;
            return (
              <TableRow
                key={w.id}
                className={cn(
                  'h-12 border-white/5 transition-colors',
                  entry.isPlayer
                    ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                    : 'hover:bg-white/[0.02]'
                )}
              >
                <TableCell className="pl-6 font-mono text-[10px] font-black text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </TableCell>
                <TableCell>
                  <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic">
                  {entry.stableName}
                </TableCell>
                <TableCell className="text-center font-mono text-[10px]">
                  <span className="text-primary font-bold">{w.career.wins}</span>
                  <span className="mx-1 opacity-20">/</span>
                  <span className="text-destructive font-bold">{w.career.losses}</span>
                  <span className="mx-1 opacity-20">/</span>
                  <span className="text-arena-blood font-black">{w.career.kills}</span>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <span className="font-display font-black text-arena-fame text-lg tracking-tighter">
                    {w.fame}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Surface>
  );
}

// ─── Main Hub Page ────────────────────────────────────────────────────────────

export default function ArenaHub() {
  const store = useGameStore();
  const { roster, player, setState, doAdvanceDay, doAdvanceWeek, setSimulating } = store;
  const { week, isTournamentWeek } = useGameStore(
    useShallow((s) => ({ week: s.week, isTournamentWeek: s.isTournamentWeek }))
  );
  const navigate = useNavigate();
  const gameState = useMemo(() => reconstructGameState(store), [store]);

  const [showCombat, setShowCombat] = useState(false);
  const [results, setResults] = useState<BoutResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autosimming, setAutosimming] = useState(false);
  const [autosimProgress, setAutosimProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [autosimResult, setAutosimResult] = useState<AutosimResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fightReady = useMemo(
    () => gameState.roster.filter((w: Warrior) => isFightReady(w)),
    [gameState.roster]
  );
  const matchCard = useMemo(
    () =>
      generatePairings(gameState).map((p) => ({
        playerWarrior: p.a,
        rivalWarrior: p.d,
        rivalStable:
          gameState.rivals.find((r: RivalStableData) => r.owner.id === p.rivalStableId) ||
          ({ owner: { id: p.rivalStableId, stableName: p.rivalStable } } as RivalStableData),
        isRivalryBout: p.isRivalry,
      })),
    [gameState]
  );

  const handleExecuteCycle = useCallback(() => {
    if (running) return;
    setRunning(true);
    if (matchCard.length === 0 && fightReady.length < 2) {
      setRunning(false);
      toast.error('No valid pairings available for this mission.');
      return;
    }
    const processed = processWeekBouts(gameState);
    setResults(processed.results);
    if (gameState.isTournamentWeek) {
      doAdvanceDay(
        undefined,
        processed.results,
        processed.summary.deathNames,
        processed.summary.injuryNames
      );
      toast.success(`Empire Day ${gameState.day + 1} concluded.`);
    } else {
      doAdvanceWeek(
        undefined,
        processed.results,
        processed.summary.deathNames,
        processed.summary.injuryNames
      );
      toast.success(`Week ${gameState.week} concluded.`);
    }
    setRunning(false);
    setExpandedId(null);
  }, [gameState, running, matchCard.length, fightReady.length, doAdvanceDay, doAdvanceWeek]);

  const handleStartAutosim = useCallback(
    async (weeks: number) => {
      if (autosimming) return;
      setAutosimming(true);
      setSimulating(true);
      setAutosimResult(null);
      try {
        const result = await runAutosim(gameState, weeks, (currentWeek: number) => {
          setAutosimProgress({ current: currentWeek, total: weeks });
        });
        setAutosimResult(result);
        setState((draft: GameStore) => {
          Object.assign(draft, result.finalState);
        });
      } catch (err) {
        console.error('Autosim failed', err);
        toast.error('Auto-simulation encountered an archive corruption.');
      } finally {
        setAutosimming(false);
        setSimulating(false);
      }
    },
    [gameState, setState, autosimming, setSimulating]
  );

  const lifetimeKills = useMemo(
    () => roster.reduce((s, w) => s + (w.career?.kills || 0), 0),
    [roster]
  );
  const stableStats = useMemo(() => calculateStableStats(roster), [roster]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader
        title="Arena Command Hub"
        subtitle="ARENA \u00b7 SPECTACLE ENGINE \u00b7 WORLD STATE"
        icon={Swords}
        actions={
          <div className="flex gap-3">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1"
            >
              {roster.filter((w) => w.status === 'Active').length} UNITS ACTIVE
            </Badge>
          </div>
        }
      />

      {/* Band 2 — Crowd Mood full-width strip */}
      <CrowdMoodWidget />

      {/* Execute Week CTA */}
      <Surface
        variant="glass"
        className="flex flex-row items-center gap-6 p-5 border-l-4 border-l-primary/50"
      >
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
            {isTournamentWeek ? 'Tournament Day' : `Week ${week}`}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Execute all bouts for this week
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCombat(true);
            setResults([]);
            setAutosimResult(null);
          }}
          disabled={showCombat}
          className="bg-primary text-primary-foreground font-black uppercase tracking-widest shrink-0"
        >
          <Zap className="h-4 w-4 mr-2" />
          {isTournamentWeek ? 'EXECUTE TOURNAMENT DAY →' : `EXECUTE WEEK ${week} →`}
        </Button>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Primary Intel Channel */}
        <div className="lg:col-span-8 space-y-8">
          <IntelligenceHubWidget />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <NextBoutWidget />
            <MedicalAuditWidget />
          </div>
        </div>

        {/* Tactical Feed Side Pane */}
        <div className="lg:col-span-4 space-y-8">
          <WeatherWidget />
          <MetaDriftWidget />

          <Surface
            variant="glass"
            className="p-6 space-y-6 bg-gradient-to-br from-white/[0.01] to-white/[0.03]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                  Arena Analytics
                </span>
              </div>
              <Activity className="h-3 w-3 text-primary animate-pulse" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  Stable Renown
                </span>
                <span className="font-display font-black text-xl text-arena-fame tracking-tighter">
                  {player.renown}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  Lifetime Kills
                </span>
                <span className="font-display font-black text-xl text-destructive tracking-tighter">
                  {lifetimeKills}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  Combat Yield
                </span>
                <span className="font-display font-black text-xl text-primary tracking-tighter">
                  {Math.round(stableStats.winRate * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-muted-foreground/60 leading-relaxed uppercase tracking-wider font-mono">
                All metrics updated in real-time. Combat performance influences world-state drift.
              </p>
            </div>
          </Surface>
        </div>
      </div>

      {/* Global Rankings Channel */}
      <ArenaLeaderboard />

      {/* Immersive Operational Strip */}
      <div className="py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-30 px-6 border-t border-white/5">
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
          <Skull className="h-3.5 w-3.5 text-destructive" /> Blood Shed Protocols: V1.4
        </div>
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
          <TrendingUp className="h-3.5 w-3.5 text-primary" /> Market Drift: Synchronized
        </div>
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
          <Star className="h-3.5 w-3.5 text-arena-gold" /> Fame Coefficient Active
        </div>
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
          <Shield className="h-3.5 w-3.5 text-accent" /> Integrity Hash Verified
        </div>
      </div>

      {/* ── Inline Combat Execution Panel ── */}
      {showCombat && (
        <div className="space-y-8 border-t-2 border-primary/20 pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                Engagement Console
              </span>
            </div>
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCombat(false);
                  setResults([]);
                  setAutosimResult(null);
                }}
                className="text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5"
              >
                Close Results
              </Button>
            )}
          </div>

          {/* Readiness Strip */}
          <Surface
            variant="glass"
            className="flex items-center gap-10 p-5 border-l-4 border-l-primary/50"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                Stable Readiness
              </span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                  Mission Ready
                </span>
                <span className="font-display font-black text-xl text-primary leading-none mt-1">
                  {fightReady.length}
                </span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">
                  Combat Paired
                </span>
                <span className="font-display font-black text-xl text-arena-gold leading-none mt-1">
                  {matchCard.length}
                </span>
              </div>
            </div>
            {!autosimming && !autosimResult && results.length === 0 && (
              <div className="ml-auto">
                <Button
                  onClick={handleExecuteCycle}
                  disabled={running || (matchCard.length === 0 && fightReady.length < 2)}
                  className="h-10 px-8 gap-3 font-black uppercase text-[12px] tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  {isTournamentWeek
                    ? `EXECUTE DAY ${gameState.day + 1} ›`
                    : `EXECUTE WEEK ${gameState.week} ›`}
                </Button>
              </div>
            )}
          </Surface>

          {/* Match Card / Results */}
          <div className="max-w-3xl mx-auto space-y-8">
            {results.length > 0 ? (
              <RunResults
                results={results}
                expandedId={expandedId}
                onToggleExpand={setExpandedId}
              />
            ) : (
              <Surface variant="glass" className="p-0 border-accent/20">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">
                      Active Combat Manifest
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-white/10">
                    {matchCard.length} PAIRINGS
                  </Badge>
                </div>
                <div className="p-6 space-y-4">
                  {matchCard.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {matchCard.map((p, i) => (
                        <MatchCard
                          key={i}
                          pairing={{
                            a: p.playerWarrior,
                            d: p.rivalWarrior,
                            rivalStable: p.rivalStable?.owner?.stableName || 'Rival Stable',
                            isRivalry: p.isRivalryBout,
                          }}
                          crowdMood={gameState.crowdMood}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted-foreground/30">
                      <Skull className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                        Zero Engagement Pairs Detected
                        <br />
                        <span className="text-[9px] opacity-60">
                          Warriors may be resting or in training
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </Surface>
            )}

            {/* Autosim */}
            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 px-2 mb-6">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  Auto Simulation Bridge
                </h3>
                <div className="h-px flex-1 bg-border/20" />
              </div>
              <AutosimConsole
                isSimulating={autosimming}
                progress={autosimProgress}
                result={autosimResult}
                onStart={handleStartAutosim}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
