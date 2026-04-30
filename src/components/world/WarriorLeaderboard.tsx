import { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Surface } from '@/components/ui/Surface';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortHeader } from '@/components/ui/sort-header';
import { TrendingUp, Skull, Crown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface WarriorLeaderboardProps {
  rows: WarriorRow[];
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

interface WarriorLeaderboardFiltersProps {
  classes: string[];
  classFilter: string | null;
  setClassFilter: (v: string | null) => void;
  quickFilter: 'kills' | 'wins' | 'winRate' | null;
  setQuickFilter: (v: 'kills' | 'wins' | 'winRate' | null) => void;
  myWarriorsOnly: boolean;
  setMyWarriorsOnly: (v: boolean | ((prev: boolean) => boolean)) => void;
  onSort: (field: string) => void;
  isFiltered: boolean;
  clearFilters: () => void;
}

interface WarriorLeaderboardRowProps {
  row: WarriorRow;
  index: number;
  isFiltered: boolean;
}

function useWarriorLeaderboard(rows: WarriorRow[]) {
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<'kills' | 'wins' | 'winRate' | null>(null);
  const [myWarriorsOnly, setMyWarriorsOnly] = useState(false);

  const classes = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((r) => {
      if (r.style) seen.add(r.style);
    });
    return Array.from(seen).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = myWarriorsOnly ? rows.filter((r) => r.isPlayer) : rows;
    if (classFilter) result = result.filter((r) => r.style === classFilter);
    if (quickFilter === 'kills') result = [...result].sort((a, b) => b.kills - a.kills);
    else if (quickFilter === 'wins') result = [...result].sort((a, b) => b.wins - a.wins);
    else if (quickFilter === 'winRate') result = [...result].sort((a, b) => b.winRate - a.winRate);
    return result;
  }, [rows, classFilter, quickFilter, myWarriorsOnly]);

  const isFiltered = classFilter !== null || quickFilter !== null || myWarriorsOnly;

  const clearFilters = () => {
    setClassFilter(null);
    setQuickFilter(null);
    setMyWarriorsOnly(false);
  };

  return {
    classFilter,
    setClassFilter,
    quickFilter,
    setQuickFilter,
    myWarriorsOnly,
    setMyWarriorsOnly,
    classes,
    filtered,
    isFiltered,
    clearFilters,
  };
}

function WarriorLeaderboardFilters({
  classes,
  classFilter,
  setClassFilter,
  quickFilter,
  setQuickFilter,
  myWarriorsOnly,
  setMyWarriorsOnly,
  onSort,
  isFiltered,
  clearFilters,
}: WarriorLeaderboardFiltersProps) {
  return (
    <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex flex-wrap items-center gap-2">
      <button
        onClick={() => setMyWarriorsOnly((v) => !v)}
        aria-label="Toggle My Warriors"
        className={cn(
          'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border transition-colors flex items-center gap-1',
          myWarriorsOnly
            ? 'bg-primary/20 text-primary border-primary/40'
            : 'bg-white/5 text-muted-foreground/50 border-white/10 hover:text-foreground hover:border-white/20'
        )}
      >
        <Crown className="h-3 w-3" /> My Warriors
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">
        Class
      </span>
      {classes.map((cls) => (
        <button
          key={cls}
          onClick={() => setClassFilter(classFilter === cls ? null : cls)}
          aria-label={`Filter by ${cls}`}
          className={cn(
            'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border transition-colors',
            classFilter === cls
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'bg-white/5 text-muted-foreground/50 border-white/10 hover:text-foreground hover:border-white/20'
          )}
        >
          {cls}
        </button>
      ))}

      <div className="w-px h-4 bg-white/10 mx-1" />

      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">
        Sort by
      </span>
      {(['kills', 'wins', 'winRate'] as const).map((f) => (
        <button
          key={f}
          onClick={() => {
            setQuickFilter(quickFilter === f ? null : f);
            if (quickFilter !== f) onSort(f);
          }}
          aria-label={`Sort by ${f}`}
          className={cn(
            'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border transition-colors',
            quickFilter === f
              ? 'bg-primary/20 text-primary border-primary/40'
              : 'bg-white/5 text-muted-foreground/50 border-white/10 hover:text-foreground hover:border-white/20'
          )}
        >
          {f === 'winRate' ? 'W%' : f === 'kills' ? 'Kills' : 'Wins'}
        </button>
      ))}

      {isFiltered && (
        <button
          onClick={clearFilters}
          aria-label="Clear filters"
          className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-destructive transition-colors"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}

function WarriorLeaderboardRow({ row, index, isFiltered }: WarriorLeaderboardRowProps) {
  return (
    <TableRow
      className={cn(
        'border-white/5 transition-colors group',
        row.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'
      )}
    >
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-0.5">
          <div
            className={cn(
              'font-mono text-xs font-black p-1 rounded-none border inline-block min-w-6',
              row.officialRank <= 64
                ? 'bg-arena-gold/10 text-arena-gold border-arena-gold/20'
                : row.officialRank <= 128
                  ? 'bg-slate-400/10 text-slate-400 border-slate-400/20'
                  : 'bg-neutral-800 text-muted-foreground border-border/10'
            )}
          >
            {isFiltered ? `#${index + 1}` : `#${row.officialRank}`}
          </div>
          {isFiltered && (
            <span className="text-[8px] font-mono text-muted-foreground/30">
              #{row.officialRank}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          {row.isPlayer ? (
            <Link
              to="/warrior/$id"
              params={{ id: row.id }}
              className="font-display font-black uppercase text-xs tracking-tight text-primary hover:text-white transition-all flex items-center gap-2"
            >
              {row.name}
              {row.officialRank === 1 && <Crown className="h-3 w-3 text-arena-gold" />}
            </Link>
          ) : (
            <div className="font-display font-black uppercase text-xs tracking-tight text-foreground flex items-center gap-2">
              {row.name}
              {row.officialRank === 1 && <Crown className="h-3 w-3 text-arena-gold" />}
            </div>
          )}
          <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mt-0.5">
            STATUS // ACTIVE DUTY
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {row.isPlayer ? (
          <Link
            to="/command/roster"
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="text-[10px] opacity-20">PATRON:</span> {row.stableName}
          </Link>
        ) : (
          <Link
            to="/world/stable/$id"
            params={{ id: row.stableId }}
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="text-[10px] opacity-20">PATRON:</span> {row.stableName}
          </Link>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        {row.style}
      </TableCell>
      <TableCell className="text-center font-mono font-black text-xs text-primary">
        {Math.round(row.compositeScore)}
      </TableCell>
      <TableCell className="text-center font-mono font-black text-xs text-arena-gold">
        {row.fame.toLocaleString()}
      </TableCell>
      <TableCell className="text-center font-mono font-black text-xs text-foreground/70">
        {row.wins}
      </TableCell>
      <TableCell className="text-center hidden sm:table-cell">
        <span className="font-mono font-black text-xs">{row.winRate}%</span>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span
            className={cn(
              'font-mono font-black text-xs',
              row.kills > 0 ? 'text-destructive' : 'text-muted-foreground/20'
            )}
          >
            {row.kills}
          </span>
          <Skull
            className={cn(
              'h-3 w-3',
              row.kills > 0 ? 'text-destructive/40' : 'text-muted-foreground/5'
            )}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function WarriorLeaderboard({ rows, sort, onSort }: WarriorLeaderboardProps) {
  const {
    classes,
    classFilter,
    setClassFilter,
    quickFilter,
    setQuickFilter,
    myWarriorsOnly,
    setMyWarriorsOnly,
    filtered,
    isFiltered,
    clearFilters,
  } = useWarriorLeaderboard(rows);

  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/20 border border-primary/30">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black uppercase tracking-tight">
              Vanguard Rankings
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              Elite Combatant Directory // Global Performance Index
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] uppercase font-mono py-1 px-3 border-primary/20 text-primary"
        >
          {isFiltered ? `${filtered.length} Filtered` : 'Meritocracy Cycle Active'}
        </Badge>
      </div>

      <WarriorLeaderboardFilters
        classes={classes}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        myWarriorsOnly={myWarriorsOnly}
        setMyWarriorsOnly={setMyWarriorsOnly}
        onSort={onSort}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 bg-black/20">
              <TableHead className="w-16 text-center">
                <SortHeader
                  label="Rank"
                  active={sort.field === 'officialRank'}
                  dir={sort.dir}
                  onClick={() => onSort('officialRank')}
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Combatant"
                  active={sort.field === 'name'}
                  dir={sort.dir}
                  onClick={() => onSort('name')}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortHeader
                  label="Patron Stable"
                  active={sort.field === 'stable'}
                  dir={sort.dir}
                  onClick={() => onSort('stable')}
                />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortHeader
                  label="Class"
                  active={sort.field === 'style'}
                  dir={sort.dir}
                  onClick={() => onSort('style')}
                />
              </TableHead>
              <TableHead className="text-center">
                <SortHeader
                  label="Composite Pts"
                  active={sort.field === 'compositeScore'}
                  dir={sort.dir}
                  onClick={() => onSort('compositeScore')}
                />
              </TableHead>
              <TableHead className="text-center">
                <SortHeader
                  label="Fame"
                  active={sort.field === 'fame'}
                  dir={sort.dir}
                  onClick={() => onSort('fame')}
                />
              </TableHead>
              <TableHead className="text-center">
                <SortHeader
                  label="Wins"
                  active={sort.field === 'wins'}
                  dir={sort.dir}
                  onClick={() => onSort('wins')}
                />
              </TableHead>
              <TableHead className="text-center hidden sm:table-cell">
                <SortHeader
                  label="W%"
                  active={sort.field === 'winRate'}
                  dir={sort.dir}
                  onClick={() => onSort('winRate')}
                />
              </TableHead>
              <TableHead className="text-center">
                <SortHeader
                  label="Kills"
                  active={sort.field === 'kills'}
                  dir={sort.dir}
                  onClick={() => onSort('kills')}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((row, i) => (
              <WarriorLeaderboardRow key={row.id} row={row} index={i} isFiltered={isFiltered} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Surface>
  );
}
