import { useMemo } from 'react';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/badge';
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
  Star,
  Swords,
  Target,
  Zap,
  TrendingUp,
  User,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeaderboardProps {
  allFights: import('@/types/game').FightSummary[];
}

export function GazetteLeaderboard({ allFights }: LeaderboardProps) {
  const leaderData = useMemo(() => {
    const registry = new Map<
      string,
      { w: number; l: number; k: number; fame: number; style: string }
    >();

    for (let i = 0; i < allFights.length; i++) {
      const f = allFights[i];
      if (!f) continue;

      let aData = registry.get(f.a);
      if (!aData) {
        aData = { w: 0, l: 0, k: 0, fame: f.fameA || 0, style: f.styleA };
        registry.set(f.a, aData);
      }

      let dData = registry.get(f.d);
      if (!dData) {
        dData = { w: 0, l: 0, k: 0, fame: f.fameD || 0, style: f.styleD };
        registry.set(f.d, dData);
      }

      if (f.winner === 'A') {
        aData.w++;
        dData.l++;
        const fA = f.fameA || 0;
        if (fA > aData.fame) aData.fame = fA;
        if (fA > dData.fame) dData.fame = fA;
        if (f.by === 'Kill') aData.k++;
      } else if (f.winner === 'D') {
        dData.w++;
        aData.l++;
        const fD = f.fameD || 0;
        if (fD > dData.fame) dData.fame = fD;
        if (fD > aData.fame) aData.fame = fD;
        if (f.by === 'Kill') dData.k++;
      }
    }

    // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan with bounded insertion sort (Top 5)
    const result: {
      name: string;
      w: number;
      l: number;
      k: number;
      fame: number;
      style: string;
      rate: number;
    }[] = [];
    for (const [name, data] of registry.entries()) {
      const rate = data.w / (data.w + data.l || 1);
      const entry = {
        name,
        w: data.w,
        l: data.l,
        k: data.k,
        fame: data.fame,
        style: data.style,
        rate,
      };

      let i = result.length - 1;
      while (i >= 0) {
        const current = result[i];
        if (
          current &&
          (entry.w > current.w || (entry.w === current.w && entry.rate > current.rate))
        ) {
          i--;
        } else {
          break;
        }
      }
      result.splice(i + 1, 0, entry);
      if (result.length > 5) result.pop();
    }

    return result;
  }, [allFights]);

  return (
    <Surface
      variant="glass"
      padding="none"
      className="border-border/10 bg-neutral-900/40 overflow-hidden shadow-2xl relative"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Trophy className="h-48 w-48 text-primary" />
      </div>

      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-neutral-900/60 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-black uppercase tracking-tight">
              Combatant_Efficiency_Registry
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              Elite_Performance // Ranking_Sync_Ready
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono font-black border-white/10 bg-white/5 text-muted-foreground/60 h-7 px-3 tracking-widest"
        >
          TOP_05_OPERATIVES
        </Badge>
      </div>

      <div className="overflow-x-auto relative z-10">
        <Table>
          <TableHeader className="bg-black/20">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4">
                Operative_ID
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/60 py-4">
                Martial_Discipline
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-muted-foreground/60 py-4">
                Engagement_Record
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right text-muted-foreground/60 py-4">
                Efficiency_Index
              </TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8 py-4">
                Fame_Manifest
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderData.map((w, idx) => (
              <TableRow
                key={w.name}
                className="border-white/5 group hover:bg-white/2 transition-colors"
              >
                <TableCell className="pl-8 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-black text-foreground/20">
                      #{idx + 1}
                    </span>
                    <span className="font-display font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                      {w.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-5">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black border-white/5 bg-secondary/20 text-muted-foreground/80 uppercase tracking-widest px-3"
                  >
                    {w.style}
                  </Badge>
                </TableCell>
                <TableCell className="text-center py-5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-3 text-xs font-mono font-black">
                        <span className="text-arena-pop">{w.w}W</span>
                        <span className="text-foreground/10">/</span>
                        <span className="text-destructive/60">{w.l}L</span>
                        <span className="text-foreground/10">|</span>
                        <span className="text-arena-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]">
                          {w.k}K
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-neutral-950 border-white/10 text-[9px] font-black tracking-widest">
                      Win / Loss / Kill Efficiency
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-right py-5">
                  <span className="text-xs font-mono font-black text-primary/80 group-hover:text-primary transition-colors">
                    {(w.rate * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right pr-8 py-5">
                  <div className="flex items-center justify-end gap-2 text-sm font-mono font-black text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                    <span>{w.fame.toLocaleString()}</span>
                    <Star className="h-3.5 w-3.5 text-arena-gold opacity-60" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}

export function BestByStyle({ allFights }: LeaderboardProps) {
  const styles = useMemo(
    () => ['Brawler', 'Technician', 'High-Flyer', 'Powerhouse', 'Grappler'],
    []
  );
  const bestData = useMemo(() => {
    return styles.map((style) => {
      const warriors: Record<string, number> = {};
      for (let i = 0; i < allFights.length; i++) {
        const f = allFights[i];
        if (!f) continue;
        let wStyle: string | null = null;
        let wName: string | null = null;

        if (f.winner === 'A') {
          wStyle = f.styleA;
          wName = f.a;
        } else if (f.winner === 'D') {
          wStyle = f.styleD;
          wName = f.d;
        }

        if (wStyle === style && wName) {
          warriors[wName] = (warriors[wName] || 0) + 1;
        }
      }
      let topName = 'No Data';
      let topWins = 0;
      for (const [name, wins] of Object.entries(warriors)) {
        if (wins > topWins) {
          topWins = wins;
          topName = name;
        }
      }
      return { style, name: topName, wins: topWins };
    });
  }, [allFights, styles]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Swords className="h-24 w-24 text-arena-gold" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-arena-gold/10 border border-arena-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <Zap className="h-5 w-5 text-arena-gold" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Discipline_Vanguard
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Style_Excellence // Master_Registry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {bestData.map((d) => (
          <Surface
            key={d.style}
            variant="paper"
            padding="sm"
            className="bg-white/[0.02] border-white/5 group hover:border-arena-gold/30 transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
                  {d.style}
                </span>
                <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-arena-gold transition-colors">
                  {d.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-arena-gold">
                  <span className="text-sm font-mono font-black">{d.wins}W</span>
                  <Target className="h-3 w-3 opacity-40" />
                </div>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </Surface>
  );
}

export function RisingStars({ allFights }: LeaderboardProps) {
  const stars = useMemo(() => {
    const history = new Map<string, { wins: number; matches: number; firstWeek: number }>();

    for (let i = 0; i < allFights.length; i++) {
      const f = allFights[i];
      if (!f) continue;

      let aData = history.get(f.a);
      if (!aData) {
        aData = { wins: 0, matches: 0, firstWeek: f.week };
        history.set(f.a, aData);
      }

      let dData = history.get(f.d);
      if (!dData) {
        dData = { wins: 0, matches: 0, firstWeek: f.week };
        history.set(f.d, dData);
      }

      aData.matches++;
      dData.matches++;

      if (f.winner === 'A') aData.wins++;
      else if (f.winner === 'D') dData.wins++;
    }

    // ⚡ Bolt: Reduced O(N log N) sort to O(N) linear scan with bounded insertion sort (Top 3)
    const result: { name: string; wins: number; matches: number; firstWeek: number }[] = [];
    for (const [name, data] of history.entries()) {
      if (data.matches <= 5 && data.wins >= 3) {
        const entry = { name, wins: data.wins, matches: data.matches, firstWeek: data.firstWeek };
        let i = result.length - 1;
        while (i >= 0) {
          const current = result[i];
          if (current && entry.wins > current.wins) {
            i--;
          } else {
            break;
          }
        }
        result.splice(i + 1, 0, entry);
        if (result.length > 3) result.pop();
      }
    }

    return result;
  }, [allFights]);

  return (
    <Surface
      variant="glass"
      className="border-border/10 bg-neutral-900/40 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <TrendingUp className="h-24 w-24 text-primary" />
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 rounded-none bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base font-black uppercase tracking-tight">
            Emerging_Operatives
          </h3>
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
            Rising_Potential // Talent_Scan
          </p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {stars.length === 0 ? (
          <div className="py-12 text-center opacity-20 italic">
            <span className="text-[10px] uppercase tracking-widest">
              No breakthrough signals detected...
            </span>
          </div>
        ) : (
          stars.map((s) => (
            <Surface
              key={s.name}
              variant="paper"
              padding="sm"
              className="bg-primary/5 border border-primary/10 group hover:border-primary/40 transition-all"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-display font-black uppercase text-foreground group-hover:text-primary transition-colors">
                    {s.name}
                  </span>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                    ESTABLISHED: WK_{s.firstWeek}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono font-black border-primary/20 bg-primary/10 text-primary"
                    >
                      {s.wins}-{s.matches - s.wins}
                    </Badge>
                    <ShieldCheck className="h-3 w-3 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </Surface>
          ))
        )}
      </div>
    </Surface>
  );
}
