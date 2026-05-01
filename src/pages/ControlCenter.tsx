/**
 * Stable Lords — Control Center
 * Phase 2: Replaces the draggable Dashboard with a fixed Command Grid.
 * Archetype: Command Grid — Hero KPI bar + 5 tabbed sections + 6-card grid.
 */
import React, { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@/lib/utils';

import { calculateStableStats } from '@/engine/stats/stableStats';
import { computeStableReputation } from '@/engine/stableReputation';

import { Surface } from '@/components/ui/Surface';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { Badge } from '@/components/ui/badge';
import { SeasonWidget } from '@/components/dashboard/SeasonWidget';
import { RecentBoutsWidget } from '@/components/dashboard/RecentBoutsWidget';
import { WeeklyDigestWidget } from '@/components/dashboard/WeeklyDigestWidget';
import { RivalryWidget } from '@/components/dashboard/RivalryWidget';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { STYLE_ABBREV } from '@/types/shared.types';

import {
  Swords,
  Crown,
  Coins,
  Star,
  Skull,
  TrendingUp,
  Shield,
  Activity,
  ChevronRight,
  Zap,
  Users,
  Trophy,
  Flame,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'roster' | 'rep';

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar() {
  const { roster, treasury, fame, arenaHistory } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      treasury: s.treasury,
      fame: s.fame,
      arenaHistory: s.arenaHistory,
    }))
  );

  const stats = useMemo(() => calculateStableStats(roster), [roster]);
  const totalBouts = arenaHistory.length;
  const killRate = totalBouts > 0 ? Math.round((stats.totalKills / totalBouts) * 100) : 0;

  const kpis = [
    {
      label: 'Treasury',
      value: `${(treasury ?? 0).toLocaleString()}g`,
      icon: Coins,
      color: 'text-arena-gold',
      glow: 'shadow-[0_0_10px_rgba(212,175,55,0.2)]',
    },
    {
      label: 'Influence',
      value: String(fame),
      icon: Crown,
      color: 'text-arena-fame',
      glow: 'shadow-[0_0_10px_rgba(180,100,220,0.2)]',
    },
    {
      label: 'Roster',
      value: String(stats.activeCount),
      icon: Users,
      color: 'text-arena-pop',
      glow: '',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      glow: 'shadow-[0_0_10px_rgba(255,0,0,0.2)]',
    },
    {
      label: 'Total Kills',
      value: String(stats.totalKills),
      icon: Skull,
      color: 'text-destructive',
      glow: '',
    },
    { label: 'Kill Rate', value: `${killRate}%`, icon: Flame, color: 'text-arena-blood', glow: '' },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(({ label, value, icon: Icon, color, glow }) => (
        <Surface key={label} variant="glass" className={cn('p-4 flex flex-col gap-2', glow)}>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              {label}
            </span>
          </div>
          <span
            className={cn('font-display font-black text-2xl tracking-tighter leading-none', color)}
          >
            {value}
          </span>
        </Surface>
      ))}
    </div>
  );
}

// ─── Rankings Bar ─────────────────────────────────────────────────────────────

function RankingsBar() {
  const { roster, fame, rivals, realmRankings } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      fame: s.fame,
      rivals: s.rivals,
      realmRankings: s.realmRankings,
    }))
  );

  const stableRank = useMemo(() => {
    if (!rivals || rivals.length === 0) return null;
    const higherCount = rivals.filter((r) => (r.fame ?? 0) > (fame ?? 0)).length;
    return higherCount + 1;
  }, [rivals, fame]);

  const topWarriorRank = useMemo(() => {
    if (!realmRankings || Object.keys(realmRankings).length === 0) return null;
    let best: number | null = null;
    for (const w of roster) {
      const entry = realmRankings[w.id];
      if (entry && entry.overallRank > 0) {
        if (best === null || entry.overallRank < best) {
          best = entry.overallRank;
        }
      }
    }
    return best;
  }, [roster, realmRankings]);

  const items = [
    {
      label: 'Stable Rank',
      value: stableRank !== null ? `#${stableRank}` : '—',
      icon: Trophy,
      color: stableRank === 1 ? 'text-arena-gold' : 'text-arena-fame',
      glow: stableRank === 1 ? 'shadow-[0_0_10px_rgba(212,175,55,0.15)]' : '',
      sub: stableRank !== null ? `of ${rivals.length + 1} stables` : 'No rivals yet',
    },
    {
      label: 'Top Warrior Rank',
      value: topWarriorRank !== null ? `#${topWarriorRank}` : '—',
      icon: Star,
      color: topWarriorRank !== null && topWarriorRank <= 10 ? 'text-arena-gold' : 'text-primary',
      glow:
        topWarriorRank !== null && topWarriorRank <= 3
          ? 'shadow-[0_0_10px_rgba(212,175,55,0.15)]'
          : '',
      sub: topWarriorRank !== null ? 'overall realm ranking' : 'Rankings not yet set',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, icon: Icon, color, glow, sub }) => (
        <Surface key={label} variant="glass" className={cn('p-4 flex items-center gap-4', glow)}>
          <Icon className={cn('h-5 w-5 shrink-0', color)} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
              {label}
            </span>
            <span
              className={cn(
                'font-display font-black text-2xl tracking-tighter leading-none',
                color
              )}
            >
              {value}
            </span>
            <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-wider">
              {sub}
            </span>
          </div>
        </Surface>
      ))}
    </div>
  );
}

// ─── Hero Panel ───────────────────────────────────────────────────────────────

function HeroPanel() {
  const { player, roster, week, season, isTournamentWeek } = useGameStore(
    useShallow((s) => ({
      player: s.player,
      roster: s.roster,
      week: s.week,
      season: s.season,
      isTournamentWeek: s.isTournamentWeek,
    }))
  );

  const stats = useMemo(() => calculateStableStats(roster), [roster]);
  const seasonName = `Season ${season}`;

  return (
    <Surface
      variant="glass"
      className="p-6 flex items-start justify-between gap-6 border-primary/10"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.2)]">
            <Swords className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl tracking-tighter uppercase leading-none">
              {player?.stableName ?? 'Your Stable'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">
              {player?.name ?? 'Commander'} · {seasonName} · Week {week}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isTournamentWeek && (
            <Badge className="bg-arena-blood/20 text-arena-blood border-arena-blood/30 text-[9px] font-black uppercase tracking-widest rounded-none">
              <Trophy className="h-2.5 w-2.5 mr-1" /> Tournament Week
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-[9px] font-black uppercase tracking-widest rounded-none border-white/10"
          >
            {stats.activeCount} Active Warriors
          </Badge>
          {stats.topWarrior && (
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest rounded-none border-primary/20 text-primary"
            >
              <Star className="h-2.5 w-2.5 mr-1" />
              {stats.topWarrior.name} — Top Fighter
            </Badge>
          )}
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-end gap-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
          Overall Record
        </span>
        <span className="font-display font-black text-4xl tracking-tighter leading-none">
          <span className="text-primary">{stats.totalWins}</span>
          <span className="text-muted-foreground/30 mx-1">—</span>
          <span className="text-muted-foreground/60">{stats.totalLosses}</span>
        </span>
        <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
          W — L
        </span>
      </div>
    </Surface>
  );
}

// ─── Roster Snapshot Tab ──────────────────────────────────────────────────────

function RosterSnapshot() {
  const { roster } = useGameStore(useShallow((s) => ({ roster: s.roster })));

  const active = useMemo(() => roster.filter((w) => w.status === 'Active'), [roster]);

  return (
    <div className="flex flex-col gap-3">
      {active.length === 0 && (
        <div className="text-center py-12 text-muted-foreground/40 text-sm font-black uppercase tracking-widest">
          No Active Warriors
        </div>
      )}
      {active.map((w) => {
        return (
          <Link key={w.id} to="/ops/overview" className="block group">
            <Surface variant="glass" className="p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-none bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-black text-sm uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                      {w.name}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                      <span>{STYLE_ABBREV[w.style] ?? w.style}</span>
                      <span className="opacity-30">·</span>
                      <span className="text-arena-gold">{w.fame} fame</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Record
                    </div>
                    <div className="font-mono font-black text-xs">
                      <span className="text-primary">{w.career?.wins ?? 0}</span>
                      <span className="text-muted-foreground/30 mx-0.5">-</span>
                      <span className="text-muted-foreground/60">{w.career?.losses ?? 0}</span>
                      {(w.career?.kills ?? 0) > 0 && (
                        <span className="text-destructive ml-1 text-[9px]">/{w.career.kills}K</span>
                      )}
                    </div>
                  </div>

                  {w.fatigue !== undefined && (
                    <div className="text-right hidden md:block">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Fatigue
                      </div>
                      <div
                        className={cn(
                          'font-mono font-black text-xs',
                          w.fatigue > 70
                            ? 'text-destructive'
                            : w.fatigue > 40
                              ? 'text-arena-gold'
                              : 'text-primary'
                        )}
                      >
                        {w.fatigue}%
                      </div>
                    </div>
                  )}

                  <FormSparkline warriorId={w.id} limit={6} />

                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Surface>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Reputation Tab ───────────────────────────────────────────────────────────

function ReputationTab() {
  const worldState = useWorldState();
  const rep = useMemo(() => computeStableReputation(worldState), [worldState]);

  const dims: {
    key: keyof typeof rep;
    label: string;
    color: string;
    icon: React.ElementType;
    desc: string;
    effect: string;
  }[] = [
    {
      key: 'fame',
      label: 'Fame',
      color: 'text-arena-gold',
      icon: Star,
      desc: 'Public acclaim from victories and showmanship.',
      effect: 'Attracts better promoter offers and higher purses.',
    },
    {
      key: 'notoriety',
      label: 'Notoriety',
      color: 'text-destructive',
      icon: Skull,
      desc: 'Feared reputation built on kills and ruthlessness.',
      effect: 'Rivals think twice before accepting your bouts.',
    },
    {
      key: 'honor',
      label: 'Honor',
      color: 'text-primary',
      icon: Shield,
      desc: 'Moral standing and respect from the arena elite.',
      effect: 'Unlocks Honorable promoter preference and trainer discounts.',
    },
    {
      key: 'adaptability',
      label: 'Adaptability',
      color: 'text-arena-pop',
      icon: Zap,
      desc: 'Strategic responsiveness to the shifting combat meta.',
      effect: 'Earns higher hype bonuses in style-clash matchups.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {dims.map(({ key, label, color, icon: Icon, desc, effect }) => {
        const val = rep[key] as number;
        return (
          <Surface key={key} variant="glass" className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {label}
              </span>
            </div>
            <div
              className={cn(
                'font-display font-black text-4xl tracking-tighter leading-none',
                color
              )}
            >
              {val}
              <span className="text-lg text-muted-foreground/30 ml-1">/100</span>
            </div>
            <div className="h-1 bg-white/5 rounded-none overflow-hidden">
              <div
                className={cn('h-full rounded-none transition-all', color.replace('text-', 'bg-'))}
                style={{ width: `${val}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{desc}</p>
            <p className="text-[9px] text-muted-foreground/55 italic leading-relaxed">{effect}</p>
          </Surface>
        );
      })}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'roster', label: 'Roster', icon: Users },
  { id: 'rep', label: 'Reputation', icon: Crown },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ControlCenter() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { player, week, season, arenaHistory, boutOffers } = useGameStore(
    useShallow((s) => ({
      player: s.player,
      week: s.week,
      season: s.season,
      arenaHistory: s.arenaHistory,
      boutOffers: s.boutOffers,
    }))
  );

  return (
    <PageFrame maxWidth="xl" className="pb-32">
      <PageHeader
        icon={Swords}
        eyebrow="Command & Strategy"
        title={player?.stableName ?? 'Command Center'}
        subtitle="HQ · CENTRAL OPERATIONAL ARCHIVE"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Operational Status
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Active Cycle
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: High Density Intel */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <KpiBar />

          <div className="space-y-6">
            <SectionDivider label="Registry Intelligence" variant="gold" />
            <RankingsBar />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-1 border-b border-white/5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'relative flex items-center gap-3 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                    activeTab === id
                      ? 'text-primary bg-primary/5 border-b-2 border-primary -mb-px shadow-[inset_0_-10px_20px_-10px_rgba(135,34,40,0.2)]'
                      : 'text-muted-foreground/40 hover:text-foreground/70 border-b-2 border-transparent -mb-px'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-[400px] animate-in fade-in duration-500">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SeasonWidget />
                  <WeeklyDigestWidget
                    week={week}
                    season={season}
                    arenaHistory={arenaHistory}
                    boutOffers={boutOffers ?? {}}
                    currentWeek={week}
                  />
                  <div className="md:col-span-2">
                    <RecentBoutsWidget />
                  </div>
                </div>
              )}
              {activeTab === 'roster' && <RosterSnapshot />}
              {activeTab === 'rep' && (
                <div className="grid grid-cols-1 gap-8">
                  <ReputationQuadrant />
                  <ReputationTab />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Monitoring */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <div className="space-y-6">
            <SectionDivider label="Metagame & Rivalries" />
            <RivalryWidget />
          </div>
          <div className="space-y-6">
            <SectionDivider label="Meta Pulse" />
            <MetaDriftWidget />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
