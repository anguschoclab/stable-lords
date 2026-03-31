import { SortHeader } from "@/components/ui/sort-header";
import { useState, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, Crown, Skull, Swords, TrendingUp, Trophy, Activity, Brain, Shield, Zap, Eye, Target, Quote } from "lucide-react";
import type { RivalStableData, Warrior, FightingStyle } from "@/types/game";
import { getStableTemplates } from "@/engine/rivals";
import { MetaDriftWidget } from "@/components/widgets/MetaDriftWidget";
import { STYLE_DISPLAY_NAMES } from "@/types/game";
import { cn } from "@/lib/utils";

type SortDir = "asc" | "desc";

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

const TIER_ACCENTS: Record<string, string> = {
  Legendary: "border-arena-gold text-arena-gold bg-arena-gold/10 shadow-[0_0_15px_-5px_hsl(var(--arena-gold)/0.4)]",
  Major: "border-purple-500/50 text-purple-400 bg-purple-500/10",
  Established: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  Minor: "border-border/40 text-muted-foreground bg-secondary/20",
  Player: "border-primary text-primary bg-primary/10 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]",
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "STABLES", value: stableRows.length, color: "text-arena-gold" },
          { icon: Swords, label: "ACTIVE WARRIORS", value: totalWarriors, color: "text-primary" },
          { icon: Skull, label: "TOTAL KILLS", value: totalKills, color: "text-destructive" },
          { icon: Crown, label: "TOP STABLE", value: topStable?.name ?? "—", color: "text-arena-gold", smallValue: true },
        ].map((item, idx) => (
          <Card key={idx} className="bg-glass-card border-border/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <item.icon className={cn("h-12 w-12", item.color)} />
            </div>
            <CardContent className="p-4 flex flex-col justify-center min-h-[80px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{item.label}</span>
              <p className={cn(
                "font-display font-black truncate",
                item.smallValue ? "text-sm" : "text-2xl"
              )}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="stables">
        <TabsList>
          <TabsTrigger value="stables">Stable Rankings</TabsTrigger>
          <TabsTrigger value="warriors">Warrior Leaderboard</TabsTrigger>
          <TabsTrigger value="intel">Intelligence</TabsTrigger>
        </TabsList>

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
                      <SortHeader label="Stable" active={stableSort.field === "name"} dir={stableSort.dir} onClick={() => toggleStableSort("name")} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Tier</TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Fame" active={stableSort.field === "fame"} dir={stableSort.dir} onClick={() => toggleStableSort("fame")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="W" active={stableSort.field === "wins"} dir={stableSort.dir} onClick={() => toggleStableSort("wins")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="L" active={stableSort.field === "losses"} dir={stableSort.dir} onClick={() => toggleStableSort("losses")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Win%" active={stableSort.field === "winRate"} dir={stableSort.dir} onClick={() => toggleStableSort("winRate")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Kills" active={stableSort.field === "kills"} dir={stableSort.dir} onClick={() => toggleStableSort("kills")} />
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      <SortHeader label="Roster" active={stableSort.field === "roster"} dir={stableSort.dir} onClick={() => toggleStableSort("roster")} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stableRows.map((row, i) => (
                    <TableRow key={row.id} className={cn(row.isPlayer ? "bg-primary/5" : "hover:bg-secondary/20")}>
                      <TableCell className="font-mono text-muted-foreground text-[10px] font-black">{i + 1}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={row.isPlayer ? "/" : `/stable/${row.id}` as any}
                                className={cn("font-display font-black uppercase text-xs tracking-tight transition-colors", row.isPlayer ? "text-primary" : "text-foreground hover:text-primary")}
                              >
                                {row.name}
                                {row.isPlayer && <span className="ml-1.5 text-[9px] font-bold opacity-50">(STAFF)</span>}
                              </Link>
                            </TooltipTrigger>
                            {row.motto && (
                              <TooltipContent side="right" className="text-[10px] italic max-w-48 bg-glass-card font-bold border-primary/20">
                                "{row.motto}"
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">{row.ownerName}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0", TIER_ACCENTS[row.tier] || TIER_ACCENTS.Minor)}>
                          {row.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">{row.fame}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-primary">{row.wins}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-muted-foreground/40">{row.losses}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {row.winRate > 0 ? `${row.winRate}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-destructive">{row.kills}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs hidden sm:table-cell">{row.roster}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
                      <SortHeader label="Warrior" active={warriorSort.field === "name"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("name")} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <SortHeader label="Stable" active={warriorSort.field === "stable"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("stable")} />
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <SortHeader label="Style" active={warriorSort.field === "style"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("style")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Fame" active={warriorSort.field === "fame"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("fame")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="W" active={warriorSort.field === "wins"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("wins")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="L" active={warriorSort.field === "losses"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("losses")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Win%" active={warriorSort.field === "winRate"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("winRate")} />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Kills" active={warriorSort.field === "kills"} dir={warriorSort.dir} onClick={() => toggleWarriorSort("kills")} />
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <MetaDriftWidget />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> Rival Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-0">
                  <div className="space-y-0 text-left">
                    {state.rivals?.map((rival) => (
                      <div key={rival.owner.id} className="px-5 py-4 border-b border-border/20 last:border-0 hover:bg-primary/5 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4 text-left">
                             <div className="w-10 h-10 rounded-lg bg-secondary/40 border border-border/20 flex items-center justify-center font-display font-black text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                {rival.owner.stableName.charAt(0)}
                             </div>
                             <div>
                                <h4 className="font-display font-black uppercase text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{rival.owner.stableName}</h4>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">OWNER: {rival.owner.name} · {rival.owner.personality || "Neutral"}</p>
                             </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] py-0.5 border-primary/20 bg-primary/5 text-primary">
                            {rival.owner.metaAdaptation || "STABLE"} INTEL
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pl-14 text-left">
                          <div className="relative">
                             <Quote className="h-4 w-4 text-primary/10 absolute -top-2 -left-3" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">RIVAL PHILOSOPHY</span>
                             <p className="text-[11px] leading-relaxed italic border-l-2 border-primary/20 pl-3">"{rival.philosophy || "Focusing on core martial excellence."}"</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">STRATEGIC STATE</span>
                              <div className="flex items-center gap-2">
                                <Badge className={cn(
                                  "text-[9px] font-black border-none uppercase tracking-widest px-2 py-0.5",
                                  rival.strategy?.intent === "VENDETTA" ? "bg-red-500/20 text-red-400" :
                                  rival.strategy?.intent === "EXPANSION" ? "bg-blue-500/20 text-blue-400" :
                                  rival.strategy?.intent === "RECOVERY" ? "bg-orange-500/20 text-orange-400" :
                                  "bg-emerald-500/20 text-emerald-400"
                                )}>
                                  {rival.strategy?.intent || "STABLE"}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">Week {5 - (rival.strategy?.planWeeksRemaining || 0)}/4</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">ECONOMIC HEALTH</span>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full animate-pulse",
                                  rival.gold < 150 ? "bg-destructive shadow-[0_0_8px_red]" : 
                                  rival.gold < 500 ? "bg-orange-500 shadow-[0_0_8px_orange]" : 
                                  "bg-emerald-500 shadow-[0_0_8px_green]"
                                )} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">
                                  {rival.gold < 150 ? "At Risk" : rival.gold < 500 ? "Poor" : rival.gold < 1200 ? "Stable" : "Wealthy"}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                                  {rival.trainers?.length || 0} Staff
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">FAVORED DOCTRINES</span>
                            <div className="flex flex-wrap gap-1.5">
                              {rival.owner.favoredStyles && (rival.owner.favoredStyles as FightingStyle[]).length > 0 ? (
                                (rival.owner.favoredStyles as FightingStyle[]).map((s) => (
                                  <Badge key={s} variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-background/40 border-border/40">
                                    {STYLE_DISPLAY_NAMES[s]}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Adaptive style focus</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Scouting Perspective:</span> Rival owners move with the meta at different speeds. **Innovators** will pivot their training programs weeks before a style becomes dominant, while **Traditionalists** may stubbornly stick to declining styles. Use this intel to predict who will be "meta-ready" in future tournaments.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
