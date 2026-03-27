/**
 * Stable Ledger — 5-tab management interface.
 * Design Bible v1.6.0 §8: Overview, Tokens, Contracts, Chronicle, Hall of Warriors
 */
import React, { useState, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { Link } from "@tanstack/react-router";
import { STYLE_DISPLAY_NAMES, type InsightToken, type TrainerData, type LedgerEntry } from "@/types/game";
import { computeWeeklyBreakdown } from "@/engine/economy";
import { TIER_COST as TRAINER_TIER_COST, TRAINER_WEEKLY_SALARY } from "@/engine/trainers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WarriorLink } from "@/components/EntityLink";
import { WarriorNameTag } from "@/components/ui/WarriorNameTag";
import { StatBadge } from "@/components/ui/StatBadge";
import {
  BookOpen, Coins, FileText, ScrollText, Skull, Shield,
  Trophy, Star, Swords, Heart, Zap, GraduationCap,
  ArrowUpRight, ArrowDownRight, Sparkles, Target,
} from "lucide-react";

// ─── Tab: Overview ────────────────────────────────────────────────────────

function OverviewTab() {
  const { state } = useGameStore();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.gold ?? 0;
  const activeWarriors = state.roster.filter(w => w.status === "Active");
  const { wins: totalWins, losses: totalLosses, kills: totalKills } = state.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );

  // Recent ledger entries
  const recentLedger = (state.ledger ?? []).slice(-10).reverse();

  return (
    <div className="space-y-4">
      {/* Treasury */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/40 shadow-sm bg-background">
          <CardContent className="py-4 px-4 text-center bg-secondary/5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Treasury</div>
            <div className="text-3xl font-mono font-bold text-arena-gold leading-none">{gold.toLocaleString()}G</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm bg-background">
          <CardContent className="py-4 px-4 text-center bg-secondary/5">
             <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Roster</div>
            <div className="text-3xl font-mono font-bold leading-none text-foreground">{activeWarriors.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm bg-background">
          <CardContent className="py-4 px-4 text-center bg-secondary/5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Victories</div>
            <div className="text-3xl font-mono font-bold text-arena-pop leading-none">{totalWins}</div>
          </CardContent>
        </Card>
        <Card className="border-border/40 shadow-sm bg-background">
          <CardContent className="py-4 px-4 text-center bg-secondary/5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Fatalities</div>
            <div className="text-3xl font-mono font-bold text-destructive leading-none">{totalKills}</div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly projection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Coins className="h-4 w-4 text-arena-gold" /> Weekly Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Income</h4>
              {breakdown.income.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-arena-pop font-mono">+{item.amount}g</span>
                </div>
              ))}
              {breakdown.income.length === 0 && <span className="text-xs text-muted-foreground">No income</span>}
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Expenses</h4>
              {breakdown.expenses.map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-destructive font-mono">-{item.amount}g</span>
                </div>
              ))}
              {breakdown.expenses.length === 0 && <span className="text-xs text-muted-foreground">No expenses</span>}
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Net</span>
            <span className={`font-mono ${breakdown.net >= 0 ? "text-arena-pop" : "text-destructive"}`}>
              {breakdown.net >= 0 ? "+" : ""}{breakdown.net}g
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentLedger.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Week</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLedger.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{entry.week}</TableCell>
                    <TableCell className="text-xs">{entry.label}</TableCell>
                    <TableCell className={`text-right font-mono text-xs ${entry.amount >= 0 ? "text-arena-pop" : "text-destructive"}`}>
                      {entry.amount >= 0 ? "+" : ""}{entry.amount}g
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Tokens ──────────────────────────────────────────────────────────

function TokensTab() {
  const { state } = useGameStore();
  const tokens = state.insightTokens ?? [];
  const weaponTokens = tokens.filter(t => t.type === "Weapon");
  const rhythmTokens = tokens.filter(t => t.type === "Rhythm");
  const statTokens = tokens.filter(t => t.type === "Attribute");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-arena-gold" /> Insight Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Insight Tokens are discovered through combat. When a warrior fights with their
            favorite weapon or at their preferred rhythm, hints appear. Discover enough and
            the insight is revealed, granting permanent combat bonuses.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Stat Hints */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Rival Secrets ({statTokens.length})
              </h4>
              {statTokens.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No rival secrets deduced.</p>
              ) : (
                <div className="space-y-2">
                  {statTokens.map(t => (
                    <div key={t.id} className="text-xs bg-muted/50 p-2 rounded border flex flex-col gap-1">
                      <div className="font-semibold flex justify-between items-center">
                        <span className="text-arena-gold">{t.warriorName}</span>
                        <Badge variant="outline" className="text-[9px] py-0 h-4">W{t.discoveredWeek}</Badge>
                      </div>
                      <div className="text-muted-foreground">{t.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weapon Insights */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" /> Weapon Insights ({weaponTokens.length})
              </h4>
              {weaponTokens.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No weapon insights discovered yet.</p>
              ) : (
                <div className="space-y-2">
                  {weaponTokens.map(t => (
                    <div key={t.id} className="rounded-lg bg-secondary/60 p-2 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{t.warriorName}</span>
                        <Badge variant="outline" className="text-[9px]">Wk {t.discoveredWeek}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rhythm Insights */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Rhythm Insights ({rhythmTokens.length})
              </h4>
              {rhythmTokens.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No rhythm insights discovered yet.</p>
              ) : (
                <div className="space-y-2">
                  {rhythmTokens.map(t => (
                    <div key={t.id} className="rounded-lg bg-secondary/60 p-2 border border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{t.warriorName}</span>
                        <Badge variant="outline" className="text-[9px]">Wk {t.discoveredWeek}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token summary */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-display font-bold">{tokens.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Total Tokens</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-arena-gold">{weaponTokens.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Weapon</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-primary">{rhythmTokens.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Rhythm</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Contracts ───────────────────────────────────────────────────────

function ContractsTab() {
  const { state } = useGameStore();
  const trainers = state.trainers ?? [];
  const activeTrainers = trainers.filter(t => t.contractWeeksLeft > 0);
  const expiredTrainers = trainers.filter(t => t.contractWeeksLeft <= 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Active Contracts ({activeTrainers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeTrainers.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">
              No active trainer contracts. <Link to="/stable/trainers" className="text-primary hover:underline">Hire trainers</Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Focus</TableHead>
                  <TableHead className="text-center">Weeks Left</TableHead>
                  <TableHead className="text-right">Salary/wk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTrainers.map(t => {
                  const weeksLeft = t.contractWeeksLeft;
                  const pct = (weeksLeft / 52) * 100;
                  const isExpiring = weeksLeft <= 4;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <span className="font-display font-semibold text-sm">{t.name}</span>
                        {t.retiredFromWarrior && (
                          <span className="text-[10px] text-muted-foreground ml-1">(ex-{t.retiredFromWarrior})</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{t.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.focus}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={pct} className="h-1.5 w-16" />
                          <span className={`text-xs font-mono ${isExpiring ? "text-destructive" : ""}`}>
                            {weeksLeft}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {TRAINER_WEEKLY_SALARY[t.tier] ?? 35}g
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contract costs summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly trainer expense</span>
            <span className="font-mono font-bold text-destructive">
              -{activeTrainers.reduce((sum, t) => sum + (TRAINER_WEEKLY_SALARY[t.tier] ?? 35), 0)}g
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Contracts expiring within 4 weeks</span>
            <span className="font-mono font-bold text-amber-500">
              {activeTrainers.filter(t => t.contractWeeksLeft <= 4).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Chronicle ───────────────────────────────────────────────────────

function ChronicleTab() {
  const { state } = useGameStore();
  const news = useMemo(
    () => [...state.newsletter].reverse().slice(0, 20),
    [state.newsletter]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        A chronological record of your stable's journey through the arena.
      </p>
      {news.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No chronicle entries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {news.map((n, i) => (
            <Card key={i}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-display font-semibold">{n.title}</h4>
                  <Badge variant="outline" className="text-[9px] font-mono">Wk {n.week}</Badge>
                </div>
                <ul className="space-y-0.5">
                  {n.items.map((item, j) => (
                    <li key={j} className="text-xs text-foreground/80 pl-2.5 border-l-2 border-primary/30">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Hall of Warriors ────────────────────────────────────────────────

function HallTab() {
  const { state } = useGameStore();
  const graveyard = state.graveyard ?? [];
  const retired = state.retired ?? [];

  return (
    <div className="space-y-4">
      {/* Retired */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Trophy className="h-4 w-4 text-arena-gold" /> Retired Legends ({retired.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {retired.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No warriors have retired yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead className="text-center">Record</TableHead>
                  <TableHead className="text-right">Fame</TableHead>
                  <TableHead className="text-right">Retired</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retired.map(w => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                    </TableCell>
                    <TableCell>
                      <StatBadge styleName={w.style} />
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {w.career.wins}W-{w.career.losses}L-{w.career.kills}K
                    </TableCell>
                    <TableCell className="text-right text-arena-fame font-mono text-xs">{w.fame}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      Wk {w.retiredWeek ?? "?"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fallen */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-destructive">
            <Skull className="h-4 w-4" /> The Fallen ({graveyard.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {graveyard.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No warriors have fallen. May it stay that way.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead className="text-center">Record</TableHead>
                  <TableHead>Cause</TableHead>
                  <TableHead className="text-right">Week</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {graveyard.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="text-destructive/80">
                      <WarriorNameTag id={w.id} name={w.name} isChampion={w.champion} />
                    </TableCell>
                    <TableCell>
                      <StatBadge styleName={w.style} />
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {w.career.wins}W-{w.career.losses}L-{w.career.kills}K
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.deathCause ?? "Unknown"}{w.killedBy ? ` (by ${w.killedBy})` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      Wk {w.deathWeek ?? "?"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function StableLedger() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Stable Ledger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your complete management records — finances, tokens, contracts, and legacy.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="overview" className="text-xs gap-1">
            <Coins className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="tokens" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" /> Tokens
          </TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs gap-1">
            <GraduationCap className="h-3 w-3" /> Contracts
          </TabsTrigger>
          <TabsTrigger value="chronicle" className="text-xs gap-1">
            <ScrollText className="h-3 w-3" /> Chronicle
          </TabsTrigger>
          <TabsTrigger value="hall" className="text-xs gap-1">
            <Skull className="h-3 w-3" /> Hall
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="tokens"><TokensTab /></TabsContent>
        <TabsContent value="contracts"><ContractsTab /></TabsContent>
        <TabsContent value="chronicle"><ChronicleTab /></TabsContent>
        <TabsContent value="hall"><HallTab /></TabsContent>
      </Tabs>
    </div>
  );
}
