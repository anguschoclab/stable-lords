import React, { useMemo, useState } from "react";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, type Warrior } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import TagBadge from "@/components/TagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, Users, Flame, Star, TrendingUp, UserPlus, LayoutDashboard, ScrollText, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { MOOD_DESCRIPTIONS, MOOD_ICONS } from "@/engine/crowdMood";
import { computeMetaDrift, getMetaLabel, getMetaColor } from "@/engine/metaDrift";
import { computeWeeklyBreakdown } from "@/engine/economy";
import SubNav, { type SubNavTab } from "@/components/SubNav";

const TABS: SubNavTab[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: "roster", label: "Roster", icon: <Swords className="h-3.5 w-3.5" /> },
  { id: "gazette", label: "Gazette", icon: <ScrollText className="h-3.5 w-3.5" /> },
];

function StatChip({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 border border-border">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function WarriorRow({ warrior, onClick }: { warrior: Warrior; onClick: () => void }) {
  const record = `${warrior.career.wins}-${warrior.career.losses}-${warrior.career.kills}`;
  return (
    <tr
      className="border-t border-border hover:bg-secondary/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-foreground">{warrior.name}</span>
          {warrior.champion && (
            <Trophy className="h-3.5 w-3.5 text-arena-gold" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs font-mono">
          {STYLE_ABBREV[warrior.style]}
        </Badge>
        <span className="ml-2 text-sm text-muted-foreground">
          {STYLE_DISPLAY_NAMES[warrior.style]}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-sm">{record}</td>
      <td className="px-4 py-3">
        <span className="text-arena-fame font-semibold">{warrior.fame}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-arena-pop font-semibold">{warrior.popularity}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {warrior.flair.map((f) => (
            <TagBadge key={f} tag={f} type="flair" className="text-xs" />
          ))}
          {warrior.injuries.map((i) => (
            <TagBadge key={i} tag={i} type="injury" className="text-xs" />
          ))}
        </div>
      </td>
    </tr>
  );
}

function FinancesPanel() {
  const { state } = useGame();
  const breakdown = useMemo(() => computeWeeklyBreakdown(state), [state]);
  const gold = state.gold ?? 0;
  const recentLedger = (state.ledger ?? []).filter((e) => e.week >= state.week - 3).slice(-8).reverse();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Coins className="h-5 w-5 text-arena-gold" /> Stable Finances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div className="rounded-lg bg-secondary p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground">Treasury</div>
            <div className="text-xl font-bold text-arena-gold">{gold}g</div>
          </div>
          <div className="rounded-lg bg-secondary p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground">Projected Income</div>
            <div className="text-lg font-bold text-arena-pop flex items-center justify-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> {breakdown.totalIncome}g
            </div>
          </div>
          <div className="rounded-lg bg-secondary p-3 border border-border text-center">
            <div className="text-xs text-muted-foreground">Projected Expenses</div>
            <div className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5" /> {breakdown.totalExpenses}g
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Income breakdown */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Income</div>
            {breakdown.income.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">No income this week yet.</p>
            ) : (
              <div className="space-y-1">
                {breakdown.income.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.label}</span>
                    <span className="font-mono text-arena-pop">+{i.amount}g</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense breakdown */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Expenses</div>
            {breakdown.expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">No expenses this week.</p>
            ) : (
              <div className="space-y-1">
                {breakdown.expenses.map((e, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{e.label}</span>
                    <span className="font-mono text-destructive">-{e.amount}g</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Net */}
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
          <span className="text-sm font-medium">Net this week</span>
          <span className={`font-mono font-bold ${breakdown.net >= 0 ? "text-arena-pop" : "text-destructive"}`}>
            {breakdown.net >= 0 ? "+" : ""}{breakdown.net}g
          </span>
        </div>

        {/* Recent ledger */}
        {recentLedger.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Recent Transactions</div>
            <div className="space-y-1">
              {recentLedger.map((entry, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Wk {entry.week} · {entry.label}
                  </span>
                  <span className={`font-mono ${entry.amount >= 0 ? "text-arena-pop" : "text-destructive"}`}>
                    {entry.amount >= 0 ? "+" : ""}{entry.amount}g
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { state } = useGame();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const moodIcon = MOOD_ICONS[state.crowdMood as keyof typeof MOOD_ICONS] ?? "😐";
  const moodDesc = MOOD_DESCRIPTIONS[state.crowdMood as keyof typeof MOOD_DESCRIPTIONS] ?? "";

  const metaDrift = useMemo(
    () => computeMetaDrift(state.arenaHistory),
    [state.arenaHistory]
  );

  const activeStyles = useMemo(
    () => Object.entries(metaDrift)
      .filter(([, drift]) => drift !== 0)
      .sort(([, a], [, b]) => b - a),
    [metaDrift]
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner — always visible */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-wide">
            Arena Hub
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span> — 
            Week {state.week}, {state.season}
          </p>
           <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            <StatChip label="Stable" value={state.player.stableName} icon={<Users className="h-4 w-4 text-primary" />} />
            <StatChip label="Gold" value={`${state.gold ?? 0}g`} icon={<Coins className="h-4 w-4 text-arena-gold" />} />
            <StatChip label="Fame" value={state.fame} icon={<Flame className="h-4 w-4 text-arena-fame" />} />
            <StatChip label="Warriors" value={state.roster.length} icon={<Swords className="h-4 w-4 text-arena-gold" />} />
          </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span className="text-xl">{moodIcon}</span> Crowd Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-display font-semibold">{state.crowdMood}</div>
                <p className="text-sm text-muted-foreground mt-1">{moodDesc}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Meta Pulse
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeStyles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No meta shift detected yet. Run more rounds.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeStyles.map(([style, drift]) => (
                      <Badge
                        key={style}
                        variant="outline"
                        className={`text-xs ${getMetaColor(drift)}`}
                      >
                        {STYLE_DISPLAY_NAMES[style as keyof typeof STYLE_DISPLAY_NAMES] ?? style}: {getMetaLabel(drift)} ({drift > 0 ? "+" : ""}{drift})
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Finances Panel */}
          <FinancesPanel />
        </div>
      )}

      {/* Roster Tab */}
      {activeTab === "roster" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-display text-xl">Roster</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                {state.roster.length} warriors
              </Badge>
              <Link to="/recruit">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Recruit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 sticky top-0">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Warrior</th>
                    <th className="px-4 py-3 font-medium">Style</th>
                    <th className="px-4 py-3 font-medium">Record</th>
                    <th className="px-4 py-3 font-medium">Fame</th>
                    <th className="px-4 py-3 font-medium">Pop</th>
                    <th className="px-4 py-3 font-medium">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {state.roster.map((w) => (
                    <WarriorRow
                      key={w.id}
                      warrior={w}
                      onClick={() => navigate(`/warrior/${w.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gazette Tab */}
      {activeTab === "gazette" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Arena Gazette
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.newsletter.length === 0 ? (
              <p className="text-sm text-muted-foreground">No news dispatches yet. Run some rounds to generate arena buzz.</p>
            ) : (
              state.newsletter.slice(-5).reverse().map((n, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="text-sm font-semibold text-muted-foreground mb-1">
                    Week {n.week} — {n.title}
                  </div>
                  <ul className="space-y-1">
                    {n.items.map((item, j) => (
                      <li key={j} className="text-sm text-foreground/80 pl-3 border-l-2 border-primary/30">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
