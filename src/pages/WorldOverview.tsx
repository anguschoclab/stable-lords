import { useState, useMemo, useEffect } from 'react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { Globe, Trophy, Swords, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { WorldStats } from '@/components/world/WorldStats';
import { StableRankings } from '@/components/world/StableRankings';
import { WarriorLeaderboard } from '@/components/world/WarriorLeaderboard';
import { RivalIntelligence } from '@/components/world/RivalIntelligence';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { getStableTemplates } from '@/engine/rivals';
import type { Warrior } from '@/types/game';

type SortField =
  | 'rank'
  | 'name'
  | 'fame'
  | 'wins'
  | 'losses'
  | 'kills'
  | 'winRate'
  | 'roster'
  | 'tier';
type WarriorSortField =
  | 'name'
  | 'stable'
  | 'fame'
  | 'wins'
  | 'losses'
  | 'kills'
  | 'winRate'
  | 'style'
  | 'officialRank'
  | 'compositeScore';

interface StableRow {
  id: string;
  name: string;
  ownerName: string;
  fame: number;
  wins: number;
  losses: number;
  kills: number;
  winRate: number;
  roster: number;
  tier: string;
  motto: string;
  isPlayer: boolean;
}

export default function WorldOverview() {
  const state = useWorldState();
  const [stableSort, setStableSort] = useState<{ field: SortField; dir: 'asc' | 'desc' }>({
    field: 'fame',
    dir: 'desc',
  });
  const [warriorSort, setWarriorSort] = useState<{ field: WarriorSortField; dir: 'asc' | 'desc' }>({
    field: 'fame',
    dir: 'desc',
  });
  const [syncing, setSyncing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSyncing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const templates = useMemo(() => getStableTemplates(), []);

  const stableRows = useMemo<StableRow[]>(() => {
    const rows: StableRow[] = [];
    let pWins = 0;
    let pLosses = 0;
    let pKills = 0;
    let pActive = 0;
    for (let i = 0; i < state.roster.length; i++) {
      const w = state.roster[i];
      pWins += w.career.wins;
      pLosses += w.career.losses;
      pKills += w.career.kills;
      if (w.status === 'Active') pActive++;
    }
    const pTotal = pWins + pLosses;

    rows.push({
      id: state.player.id,
      name: state.player.stableName,
      ownerName: state.player.name,
      fame: state.fame,
      wins: pWins,
      losses: pLosses,
      kills: pKills,
      winRate: pTotal > 0 ? Math.round((pWins / pTotal) * 100) : 0,
      roster: pActive,
      tier: 'Player',
      motto: '',
      isPlayer: true,
    });

    for (const r of state.rivals || []) {
      let rWins = 0;
      let rLosses = 0;
      let rKills = 0;
      let rActive = 0;
      for (let i = 0; i < r.roster.length; i++) {
        const w = r.roster[i];
        rWins += w.career.wins;
        rLosses += w.career.losses;
        rKills += w.career.kills;
        if (w.status === 'Active') rActive++;
      }
      const rTotal = rWins + rLosses;
      const tmpl = templates.find((t) => t.stableName === r.owner.stableName);
      rows.push({
        id: r.owner.id,
        name: r.owner.stableName,
        ownerName: r.owner.name,
        fame: r.owner.fame,
        wins: rWins,
        losses: rLosses,
        kills: rKills,
        winRate: rTotal > 0 ? Math.round((rWins / rTotal) * 100) : 0,
        roster: rActive,
        tier: r.tier || 'Minor',
        motto: tmpl?.motto ?? '',
        isPlayer: false,
      });
    }

    return rows.sort((a, b) => {
      const f = stableSort.field;
      const dir = stableSort.dir === 'asc' ? 1 : -1;
      if (f === 'name') return a.name.localeCompare(b.name) * dir;
      if (f === 'tier') return a.tier.localeCompare(b.tier) * dir;
      const va = a[f as keyof StableRow] as number;
      const vb = b[f as keyof StableRow] as number;
      return (va - vb) * dir;
    });
  }, [state, stableSort, templates]);

  interface WarriorRow {
    id: string;
    name: string;
    stableName: string;
    stableId: string;
    fame: number;
    wins: number;
    losses: number;
    kills: number;
    winRate: number;
    style: string;
    isPlayer: boolean;
    officialRank: number;
    compositeScore: number;
  }

  const warriorRows = useMemo<WarriorRow[]>(() => {
    const mapWarrior = (
      w: Warrior,
      stableName: string,
      stableId: string,
      isPlayer: boolean
    ): WarriorRow => {
      const total = w.career.wins + w.career.losses;
      const ranking = state.realmRankings?.[w.id];
      return {
        id: w.id,
        name: w.name,
        stableName,
        stableId,
        fame: w.fame,
        wins: w.career.wins,
        losses: w.career.losses,
        kills: w.career.kills,
        winRate: total > 0 ? Math.round((w.career.wins / total) * 100) : 0,
        style: w.style,
        isPlayer,
        officialRank: ranking?.overallRank || 999,
        compositeScore: ranking?.compositeScore || 0,
      };
    };

    const rows: WarriorRow[] = state.roster.reduce((acc: WarriorRow[], w: Warrior) => {
      if (w.status === 'Active') {
        acc.push(mapWarrior(w, state.player.stableName, state.player.id, true));
      }
      return acc;
    }, []);

    if (state.rivals) {
      for (let i = 0; i < state.rivals.length; i++) {
        const r = state.rivals[i];
        const rRoster = r.roster;
        const rName = r.owner.stableName;
        const rId = r.owner.id;
        for (let j = 0; j < rRoster.length; j++) {
          const w = rRoster[j];
          if (w.status === 'Active') {
            rows.push(mapWarrior(w, rName, rId, false));
          }
        }
      }
    }

    // Sort by official rank by default, or the selected field
    return rows.sort((a, b) => {
      const f = warriorSort.field;
      const dir = warriorSort.dir === 'asc' ? 1 : -1;

      // If default (fame), use official rank instead for better meritocracy
      if (f === 'fame' && dir === -1) {
        return a.officialRank - b.officialRank;
      }

      if (f === 'name' || f === 'stable' || f === 'style') {
        const va = f === 'stable' ? a.stableName : (a as any)[f];
        const vb = f === 'stable' ? b.stableName : (b as any)[f];
        return String(va).localeCompare(String(vb)) * dir;
      }
      return (((a as any)[f] as number) - ((b as any)[f] as number)) * dir;
    });
  }, [state, warriorSort]);

  const totalWarriors = stableRows.reduce((s, r) => s + r.roster, 0);
  const totalKills = stableRows.reduce((s, r) => s + (r.kills || 0), 0);
  const topStable = stableRows[0]?.name ?? '—';

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader
        title="World Overview"
        subtitle={`WORLD \u00b7 ${state.season} \u00b7 NATIONAL COMMISSION ARCHIVE`}
        icon={Globe}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.34em] text-muted-foreground opacity-60">
            <span>Lords Connected: {stableRows.length}</span>
            <div className="h-4 w-px bg-border/40" />
            {syncing ? (
              <span className="text-primary italic animate-pulse">Syncing Arena Data...</span>
            ) : (
              <span className="text-primary">Arena Data Live</span>
            )}
          </div>
        }
      />

      <WorldStats
        stableCount={stableRows.length}
        warriorCount={totalWarriors}
        killCount={totalKills}
        topStable={topStable}
      />

      <Tabs defaultValue="stables" className="w-full">
        <TabsList className="bg-neutral-900/60 border border-white/5 p-1 mb-6">
          <TabsTrigger
            value="stables"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Trophy className="h-3 w-3 mr-2" /> Stables
          </TabsTrigger>
          <TabsTrigger
            value="warriors"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Swords className="h-3 w-3 mr-2" /> Warriors
          </TabsTrigger>
          <TabsTrigger
            value="intel"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Brain className="h-3 w-3 mr-2" /> Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stables" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              LEAGUE RANKINGS
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
          </div>
          <StableRankings
            rows={stableRows}
            sort={stableSort}
            onSort={(field: SortField) =>
              setStableSort((prev) => ({
                field: field as SortField,
                dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
              }))
            }
          />
        </TabsContent>

        <TabsContent value="warriors" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              VANGUARD BOARD
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
          </div>
          <WarriorLeaderboard
            rows={warriorRows}
            sort={warriorSort}
            onSort={(field: WarriorSortField) =>
              setWarriorSort((prev) => ({
                field: field as WarriorSortField,
                dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
              }))
            }
          />
        </TabsContent>

        <TabsContent value="intel" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              RIVAL SURVEILLANCE
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RivalIntelligence rivals={state.rivals || []} />
            </div>
            <ReputationQuadrant />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
