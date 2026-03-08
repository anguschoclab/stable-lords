import React from "react";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, STYLE_ABBREV, type Warrior } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Trophy, Users, Flame, Star, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
            <Badge key={f} variant="secondary" className="text-xs text-arena-gold border-arena-gold/30">
              {f}
            </Badge>
          ))}
          {warrior.injuries.map((i) => (
            <Badge key={i} variant="destructive" className="text-xs">
              {i}
            </Badge>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const { state } = useGame();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-wide">
            Stable Lords
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, <span className="text-foreground font-medium">{state.player.name}</span> — 
            Week {state.week}, {state.season}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <StatChip label="Stable" value={state.player.stableName} icon={<Users className="h-4 w-4 text-primary" />} />
            <StatChip label="Fame" value={state.fame} icon={<Flame className="h-4 w-4 text-arena-fame" />} />
            <StatChip label="Popularity" value={state.popularity} icon={<Star className="h-4 w-4 text-arena-pop" />} />
            <StatChip label="Warriors" value={state.roster.length} icon={<Swords className="h-4 w-4 text-arena-gold" />} />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display text-xl">Roster</CardTitle>
          <Badge variant="outline" className="text-muted-foreground">
            {state.roster.length} warriors
          </Badge>
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

      {/* Newsletter */}
      {state.newsletter.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Arena Chronicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {state.newsletter.slice(-3).reverse().map((n, i) => (
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
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
