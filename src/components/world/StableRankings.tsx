import { Link } from '@tanstack/react-router';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SortHeader } from '@/components/ui/sort-header';
import { Trophy, Star, Swords, Skull, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatBattery } from '@/components/ui/StatBattery';

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
  philosophy: string;
  motto: string;
  isPlayer: boolean;
}

const TIER_ACCENTS: Record<string, string> = {
  Legendary: 'bg-arena-gold text-black border-arena-gold/30',
  Major: 'bg-primary/20 text-primary border-primary/30',
  Established: 'bg-stone-500/10 text-stone-400 border-stone-500/20',
  Minor: 'bg-neutral-900/40 text-muted-foreground border-white/5',
  Player: 'bg-primary text-primary-foreground border-primary',
};

interface StableRankingsProps {
  rows: StableRow[];
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
}

export function StableRankings({ rows, sort, onSort }: StableRankingsProps) {
  return (
    <Surface variant="glass" padding="none" className="border-border/40 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/20 border border-primary/30">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black uppercase tracking-tight">
              Eminent Stables
            </h3>
            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
              League Table // National Commission Rankings
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5 bg-black/20">
              <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest opacity-40">
                #
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Commission Unit"
                  active={sort.field === 'name'}
                  dir={sort.dir}
                  onClick={() => onSort('name')}
                />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortHeader
                  label="Tier"
                  active={sort.field === 'tier'}
                  dir={sort.dir}
                  onClick={() => onSort('tier')}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Prestige"
                  active={sort.field === 'fame'}
                  dir={sort.dir}
                  onClick={() => onSort('fame')}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Victories"
                  active={sort.field === 'wins'}
                  dir={sort.dir}
                  onClick={() => onSort('wins')}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Losses"
                  active={sort.field === 'losses'}
                  dir={sort.dir}
                  onClick={() => onSort('losses')}
                />
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                <SortHeader
                  label="W%"
                  active={sort.field === 'winRate'}
                  dir={sort.dir}
                  onClick={() => onSort('winRate')}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Fatalities"
                  active={sort.field === 'kills'}
                  dir={sort.dir}
                  onClick={() => onSort('kills')}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.id}
                className={cn(
                  'border-white/5 transition-colors group',
                  row.isPlayer ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'
                )}
              >
                <TableCell className="text-center">
                  <span
                    className={cn(
                      'font-mono text-xs font-black',
                      i === 0
                        ? 'text-arena-gold'
                        : i === 1
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/30'
                    )}
                  >
                    {i + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          {row.isPlayer ? (
                            <Link
                              to="/command/roster"
                              className="font-display font-black uppercase text-xs tracking-tight transition-all text-primary hover:text-white"
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <Link
                              to="/world/stable/$id"
                              params={{ id: row.id }}
                              className="font-display font-black uppercase text-xs tracking-tight transition-all text-foreground hover:text-primary"
                            >
                              {row.name}
                            </Link>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40 leading-none">
                              Commanded by {row.ownerName}
                            </span>
                            {row.isPlayer && (
                              <Badge
                                variant="outline"
                                className="text-[8px] font-black border-primary/20 bg-primary/10 text-primary py-0 px-1 leading-none h-3"
                              >
                                ACTIVE PLAYER
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {row.motto && (
                        <TooltipContent
                          side="right"
                          className="text-[10px] font-black uppercase tracking-widest bg-neutral-950 border-white/10 p-3 shadow-xl"
                        >
                          <div className="text-primary mb-1">Motto:</div>
                          <div className="italic opacity-80">"{row.motto}"</div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[8px] font-black py-0.5 px-2 rounded-none',
                      TIER_ACCENTS[row.tier] || TIER_ACCENTS.Minor
                    )}
                  >
                    {row.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-black text-xs text-arena-gold">
                      {row.fame.toLocaleString()}
                    </span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase opacity-30 tracking-widest">
                      Prestige
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-primary">
                  {row.wins}
                </TableCell>
                <TableCell className="text-right font-mono font-black text-xs text-muted-foreground/40">
                  {row.losses}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  <div className="flex flex-col items-end w-20 ml-auto">
                    <StatBattery
                      label="WR"
                      value={row.winRate}
                      max={100}
                      labelValue={`${row.winRate}%`}
                      colorClass="bg-primary"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={cn(
                        'font-mono font-black text-xs',
                        row.kills > 0 ? 'text-destructive' : 'text-muted-foreground/30'
                      )}
                    >
                      {row.kills}
                    </span>
                    <Skull
                      className={cn(
                        'h-3 w-3',
                        row.kills > 0 ? 'text-destructive/40' : 'text-muted-foreground/10'
                      )}
                    />
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
