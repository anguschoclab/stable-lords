import { SortHeader } from "@/components/ui/sort-header";
import { useState, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, Crown, Skull, Swords, TrendingUp, Trophy } from "lucide-react";
import type { RivalStableData, Warrior } from "@/types/game";
import { getStableTemplates } from "@/engine/rivals";

type SortDir = "asc" | "desc";

function SortHeader({ label, field, active, dir, onClick }: {
  label: string;
  field: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
    </button>
  );
}

type SortField = "rank" | "name" | "fame" | "wins" | "losses" | "kills" | "winRate" | "roster" | "tier";

type WarriorSortField = "name" | "stable" | "fame" | "wins" | "losses" | "kills" | "winRate" | "style";

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
}

const TIER_COLORS: Record<string, string> = {
  Legendary: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Major: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  Established: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  Minor: "bg-muted text-muted-foreground border-border",
};

export default function WorldOverview() {
  const { state } = useGameStore();
  const [stableSort, setStableSort] = useState<{ field: SortField; dir: SortDir }>({ field: "fame", dir: "desc" });
  const [warriorSort, setWarriorSort] = useState<{ field: WarriorSortField; dir: SortDir }>({ field: "fame", dir: "desc" });

  const templates = useMemo(() => getStableTemplates(), []);

  const stableRows = useMemo((): StableRow[] => {
    const rows: StableRow[] = [];

    // Player stable
    const pWins = state.roster.reduce((s, w) => s + w.career.wins, 0);
    const pLosses = state.roster.reduce((s, w) => s + w.career.losses, 0);
    const pKills = state.roster.reduce((s, w) => s + w.career.kills, 0);
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
      roster: state.roster.filter(w => w.status === "Active").length,
      tier: "Player",
      philosophy: "Your strategy",
      motto: "",
      isPlayer: true,
    });

    // Rival stables
    for (const r of state.rivals || []) {
      const rWins = r.roster.reduce((s, w) => s + w.career.wins, 0);
      const rLosses = r.roster.reduce((s, w) => s + w.career.losses, 0);
      const rKills = r.roster.reduce((s, w) => s + w.career.kills, 0);
      const rTotal = rWins + rLosses;
      const tmpl = templates.find(t => t.stableName === r.owner.stableName);
      rows.push({
        id: r.owner.id,
        name: r.owner.stableName,
        ownerName: r.owner.name,
        fame: r.owner.fame,
        wins: rWins,
        losses: rLosses,
        kills: rKills,
        winRate: rTotal > 0 ? Math.round((rWins / rTotal) * 100) : 0,
        roster: r.roster.filter(w => w.status === "Active").length,
        tier: r.tier || "Minor",
        philosophy: r.philosophy || "",
        motto: tmpl?.motto ?? "",
        isPlayer: false,
      });
    }

    return rows.sort((a, b) => {
      const f = stableSort.field;
      const dir = stableSort.dir === "asc" ? 1 : -1;
      if (f === "name") return a.name.localeCompare(b.name) * dir;
      if (f === "tier") return a.tier.localeCompare(b.tier) * dir;
      const va = a[f as keyof StableRow] as number;
      const vb = b[f as keyof StableRow] as number;
      return (va - vb) * dir;
    });
  }, [state, stableSort, templates]);

  const warriorRows = useMemo((): WarriorRow[] => {
    const rows: WarriorRow[] = [];

    const addWarriors = (warriors: Warrior[], stableName: string, stableId: string, isPlayer: boolean) => {
      for (const w of warriors) {
        if (w.status !== "Active") continue;
        const total = w.career.wins + w.career.losses;
        rows.push({
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
        });
      }
    };

    addWarriors(state.roster, state.player.stableName, state.player.id, true);
    for (const r of state.rivals || []) {
      addWarriors(r.roster, r.owner.stableName, r.owner.id, false);
    }

    return rows.sort((a, b) => {
      const f = warriorSort.field;
      const dir = warriorSort.dir === "asc" ? 1 : -1;
      if (f === "name" || f === "stable" || f === "style") {
        const va = f === "stable" ? a.stableName : a[f];
        const vb = f === "stable" ? b.stableName : b[f];
        return String(va).localeCompare(String(vb)) * dir;
      }
      return ((a[f] as number) - (b[f] as number)) * dir;
    });
  }, [state, warriorSort]);

  const toggleStableSort = (field: SortField) => {
    setStableSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  const toggleWarriorSort = (field: WarriorSortField) => {
    setWarriorSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc",
    }));
  };



  // Summary stats
  const totalWarriors = stableRows.reduce((s, r) => s + r.roster, 0);
  const totalKills = stableRows.reduce((s, r) => s + r.kills, 0);
  const topStable = stableRows[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">World Overview</h1>
        <p className="text-sm text-muted-foreground">
          Week {state.week} · {state.season} — {stableRows.length} stables, {totalWarriors} active warriors
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Stables</p>
              <p className="text-xl font-bold font-mono">{stableRows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Swords className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Active Warriors</p>
              <p className="text-xl font-bold font-mono">{totalWarriors}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Skull className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Total Kills</p>
              <p className="text-xl font-bold font-mono">{totalKills}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Top Stable</p>
              <p className="text-sm font-semibold truncate">{topStable?.name ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stables">
        <TabsList>
          <TabsTrigger value="stables">Stable Rankings</TabsTrigger>
          <TabsTrigger value="warriors">Warrior Leaderboard</TabsTrigger>
        </TabsList>

        {/* ── Stable League Table ── */}
        <TabsContent value="stables">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">League Table</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>
                      <SortHeader label="Stable" field="name" active={stableSort.field === "name"} dir={stableSort.dir} onClick={() => toggleStableSort("name")} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Tier</TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Fame" field="fame" active={stableSort.field === "fame"} dir={stableSort.dir} onClick={() => toggleStableSort("fame")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="W" field="wins" active={stableSort.field === "wins"} dir={stableSort.dir} onClick={() => toggleStableSort("wins")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="L" field="losses" active={stableSort.field === "losses"} dir={stableSort.dir} onClick={() => toggleStableSort("losses")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Win%" field="winRate" active={stableSort.field === "winRate"} dir={stableSort.dir} onClick={() => toggleStableSort("winRate")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Kills" field="kills" active={stableSort.field === "kills"} dir={stableSort.dir} onClick={() => toggleStableSort("kills")} />
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      <SortHeader label="Roster" field="roster" active={stableSort.field === "roster"} dir={stableSort.dir} onClick={() => toggleStableSort("roster")} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stableRows.map((row, i) => (
                    <TableRow key={row.id} className={row.isPlayer ? "bg-primary/5" : ""}>
                      <TableCell className="font-mono text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={row.isPlayer ? "/" : `/stable/${row.id}` as any}
                                className="font-semibold hover:text-primary transition-colors"
                              >
                                {row.name}
                                {row.isPlayer && <span className="ml-1.5 text-[10px] text-primary">(You)</span>}
                              </Link>
                            </TooltipTrigger>
                            {row.motto && (
                              <TooltipContent side="right" className="text-xs italic max-w-48">
                                "{row.motto}"
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-[11px] text-muted-foreground">{row.ownerName}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[row.tier] || TIER_COLORS.Minor}`}>
                          {row.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.fame}</TableCell>
                      <TableCell className="text-right font-mono text-green-400">{row.wins}</TableCell>
                      <TableCell className="text-right font-mono text-red-400">{row.losses}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.winRate > 0 ? `${row.winRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">{row.kills}</TableCell>
                      <TableCell className="text-right font-mono hidden sm:table-cell">{row.roster}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Warrior Leaderboard ── */}
        <TabsContent value="warriors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Warriors — All Stables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>
                      <SortHeader label="Warrior" field="name" active={warriorSort.field === "name"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("name")} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <SortHeader label="Stable" field="stable" active={warriorSort.field === "stable"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("stable")} />
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <SortHeader label="Style" field="style" active={warriorSort.field === "style"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("style")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Fame" field="fame" active={warriorSort.field === "fame"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("fame")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="W" field="wins" active={warriorSort.field === "wins"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("wins")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="L" field="losses" active={warriorSort.field === "losses"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("losses")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Win%" field="winRate" active={warriorSort.field === "winRate"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("winRate")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Kills" field="kills" active={warriorSort.field === "kills"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("kills")} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warriorRows.slice(0, 50).map((row, i) => (
                    <TableRow key={row.id} className={row.isPlayer ? "bg-primary/5" : ""}>
                      <TableCell className="font-mono text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        {row.isPlayer ? (
                          <Link to={`/warrior/${row.id}` as any} className="font-semibold hover:text-primary transition-colors">
                            {row.name}
                          </Link>
                        ) : (
                          <span className="font-semibold">{row.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Link
                          to={row.isPlayer ? "/" : `/stable/${row.stableId}` as any}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {row.stableName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{row.style}</TableCell>
                      <TableCell className="text-right font-mono">{row.fame}</TableCell>
                      <TableCell className="text-right font-mono text-green-400">{row.wins}</TableCell>
                      <TableCell className="text-right font-mono text-red-400">{row.losses}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.winRate > 0 ? `${row.winRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">{row.kills}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {warriorRows.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Showing top 50 of {warriorRows.length} warriors
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
