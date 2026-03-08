import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "@/state/GameContext";
import { STYLE_DISPLAY_NAMES, ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, type Warrior, type FightPlan } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Flame, Star, Swords, Heart, Shield } from "lucide-react";
import PlanBuilder from "@/components/PlanBuilder";
import { defaultPlanForWarrior } from "@/engine/simulate";

function AttrBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex-1">
        <Progress value={pct} className="h-2" />
      </div>
      <span className="text-sm font-mono font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

export default function WarriorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, setState } = useGame();
  const warrior = state.roster.find((w) => w.id === id);

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      const nextRoster = state.roster.map((w) =>
        w.id === warrior.id ? { ...w, plan: newPlan } : w
      );
      setState({ ...state, roster: nextRoster });
    },
    [warrior, state, setState]
  );

  const currentPlan = warrior?.plan ?? (warrior ? defaultPlanForWarrior(warrior) : undefined);

  if (!warrior) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">Warrior not found.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const record = `${warrior.career.wins}W - ${warrior.career.losses}L - ${warrior.career.kills}K`;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero */}
      <div className="relative rounded-xl border border-border bg-gradient-to-br from-secondary via-card to-secondary p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-arena-fame/5 to-arena-gold/5" />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold tracking-wide">{warrior.name}</h1>
              {warrior.champion && (
                <Badge className="bg-arena-gold text-black gap-1">
                  <Trophy className="h-3 w-3" /> Champion
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground font-display">
              {STYLE_DISPLAY_NAMES[warrior.style]}
            </p>
            <p className="font-mono text-sm text-muted-foreground mt-1">{record}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {warrior.flair.map((f) => (
                <Badge key={f} variant="secondary" className="text-arena-gold border-arena-gold/30">
                  {f}
                </Badge>
              ))}
              {warrior.titles.map((t) => (
                <Badge key={t} className="bg-arena-gold/20 text-arena-gold border-arena-gold/30">
                  <Trophy className="h-3 w-3 mr-1" /> {t}
                </Badge>
              ))}
              {warrior.injuries.map((i) => (
                <Badge key={i} variant="destructive">{i}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Flame className="h-6 w-6 text-arena-fame mx-auto mb-1" />
              <div className="text-2xl font-bold">{warrior.fame}</div>
              <div className="text-xs text-muted-foreground">Fame</div>
            </div>
            <div className="text-center">
              <Star className="h-6 w-6 text-arena-pop mx-auto mb-1" />
              <div className="text-2xl font-bold">{warrior.popularity}</div>
              <div className="text-xs text-muted-foreground">Pop</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Attributes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ATTRIBUTE_KEYS.map((key) => (
            <AttrBar
              key={key}
              label={ATTRIBUTE_LABELS[key]}
              value={warrior.attributes[key]}
            />
          ))}
          <div className="pt-2 text-xs text-muted-foreground">
            Total: {ATTRIBUTE_KEYS.reduce((sum, k) => sum + warrior.attributes[k], 0)} / 70
          </div>
        </CardContent>
      </Card>

      {/* Fight History (from arena) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-arena-gold" /> Fight History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.arenaHistory.filter(
            (f) => f.a === warrior.name || f.d === warrior.name
          ).length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded bouts yet.</p>
          ) : (
            <div className="space-y-2">
              {state.arenaHistory
                .filter((f) => f.a === warrior.name || f.d === warrior.name)
                .slice(-10)
                .reverse()
                .map((f) => {
                  const isA = f.a === warrior.name;
                  const won =
                    (isA && f.winner === "A") || (!isA && f.winner === "D");
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={won ? "default" : f.winner ? "destructive" : "secondary"}
                          className="text-xs w-8 justify-center"
                        >
                          {won ? "W" : f.winner ? "L" : "D"}
                        </Badge>
                        <span className="text-sm">
                          vs <span className="font-medium">{isA ? f.d : f.a}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.by && (
                          <Badge variant="outline" className="text-xs">
                            {f.by}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Wk {f.week}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
