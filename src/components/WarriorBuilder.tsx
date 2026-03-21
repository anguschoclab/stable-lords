/**
 * Stable Lords — Warrior Builder
 * Create a new warrior: allocate 70 points across 7 attributes, pick style, name.
 */
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Shuffle, Shield, Swords, Heart, Zap, Eye, Brain, Dumbbell, Dices } from "lucide-react";
import { randomWarriorName } from "@/data/randomNames";
import {
  FightingStyle,
  STYLE_DISPLAY_NAMES,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  ATTRIBUTE_TOTAL,
  type Attributes,
} from "@/types/game";
import { computeWarriorStats, DAMAGE_LABELS } from "@/engine/skillCalc";

const ATTR_ICONS: Record<keyof Attributes, React.ReactNode> = {
  ST: <Dumbbell className="h-3.5 w-3.5" />,
  CN: <Heart className="h-3.5 w-3.5" />,
  SZ: <Shield className="h-3.5 w-3.5" />,
  WT: <Brain className="h-3.5 w-3.5" />,
  WL: <Zap className="h-3.5 w-3.5" />,
  SP: <Swords className="h-3.5 w-3.5" />,
  DF: <Eye className="h-3.5 w-3.5" />,
};

interface WarriorBuilderProps {
  onCreateWarrior: (data: {
    name: string;
    style: FightingStyle;
    attributes: Attributes;
  }) => void;
  maxRoster?: number;
  currentRosterSize?: number;
}

export default function WarriorBuilder({
  onCreateWarrior,
  maxRoster = 10,
  currentRosterSize = 0,
}: WarriorBuilderProps) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<FightingStyle>(FightingStyle.StrikingAttack);
  const [attrs, setAttrs] = useState<Attributes>({
    ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10,
  });

  const total = useMemo(
    () => ATTRIBUTE_KEYS.reduce((s, k) => s + attrs[k], 0),
    [attrs]
  );

  const remaining = ATTRIBUTE_TOTAL - total;
  const isValid = remaining === 0 && name.trim().length >= 2;
  const rosterFull = currentRosterSize >= maxRoster;

  const stats = useMemo(
    () => computeWarriorStats(attrs, style),
    [attrs, style]
  );

  const updateAttr = useCallback(
    (key: keyof Attributes, value: number) => {
      setAttrs((prev) => {
        const clamped = Math.max(ATTRIBUTE_MIN, Math.min(ATTRIBUTE_MAX, value));
        return { ...prev, [key]: clamped };
      });
    },
    []
  );

  const randomize = useCallback(() => {
    const newAttrs: Attributes = { ST: 3, CN: 3, SZ: 3, WT: 3, WL: 3, SP: 3, DF: 3 };
    let pool = ATTRIBUTE_TOTAL - 21; // 49 points to distribute after minimums
    const keys = [...ATTRIBUTE_KEYS];
    // Distribute randomly
    while (pool > 0) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      const maxAdd = Math.min(pool, ATTRIBUTE_MAX - newAttrs[key]);
      if (maxAdd <= 0) continue;
      const add = Math.min(maxAdd, Math.floor(Math.random() * 5) + 1);
      newAttrs[key] += add;
      pool -= add;
    }
    setAttrs(newAttrs);
    // Random style
    const styles = Object.values(FightingStyle);
    setStyle(styles[Math.floor(Math.random() * styles.length)]);
    setName(randomWarriorName());
  }, []);

  const handleCreate = useCallback(() => {
    if (!isValid || rosterFull) return;
    onCreateWarrior({ name: name.trim().toUpperCase(), style, attributes: attrs });
    setName("");
    setAttrs({ ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 });
  }, [isValid, rosterFull, name, style, attrs, onCreateWarrior]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Warrior Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Forge a new warrior for your stable. Allocate {ATTRIBUTE_TOTAL} points across 7 attributes.
          </p>
        </div>
        <Button variant="outline" onClick={randomize} className="gap-2">
          <Shuffle className="h-4 w-4" /> Randomize
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Name, Style, Attributes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Warrior Name</Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter name (2+ characters)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    className="font-mono uppercase flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setName(randomWarriorName())}
                    title="Random name"
                    aria-label="Randomize warrior name"
                    className="shrink-0"
                  >
                    <Dices className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fighting Style</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as FightingStyle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FightingStyle).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STYLE_DISPLAY_NAMES[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center justify-between">
                <span>Attributes</span>
                <Badge
                  variant={remaining === 0 ? "default" : remaining > 0 ? "secondary" : "destructive"}
                  className="font-mono"
                >
                  {remaining === 0 ? "✓ 70/70" : `${total}/${ATTRIBUTE_TOTAL} (${remaining > 0 ? `+${remaining}` : remaining})`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-1.5">
                      {ATTR_ICONS[key]}
                      {ATTRIBUTE_LABELS[key]}
                      <span className="text-xs text-muted-foreground">({key})</span>
                    </Label>
                    <Badge variant="outline" className="font-mono text-sm min-w-[2rem] justify-center">
                      {attrs[key]}
                    </Badge>
                  </div>
                  <Slider
                    value={[attrs[key]]}
                    onValueChange={([v]) => updateAttr(key, v)}
                    min={ATTRIBUTE_MIN}
                    max={ATTRIBUTE_MAX}
                    step={1}
                  />
                </div>
              ))}
              <Progress
                value={(total / ATTRIBUTE_TOTAL) * 100}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview & Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Base Skills Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats.baseSkills).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8 font-mono">{key}</span>
                  <div className="flex-1">
                    <Progress value={(val / 20) * 100} className="h-2" />
                  </div>
                  <span className="text-sm font-mono font-semibold w-6 text-right">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">Physicals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary p-3 border border-border">
                  <div className="text-xs text-muted-foreground">Hit Points</div>
                  <div className="text-xl font-bold">{stats.derivedStats.hp}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3 border border-border">
                  <div className="text-xs text-muted-foreground">Endurance</div>
                  <div className="text-xl font-bold">{stats.derivedStats.endurance}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3 border border-border">
                  <div className="text-xs text-muted-foreground">Damage</div>
                  <div className="text-xl font-bold">{DAMAGE_LABELS[stats.derivedStats.damage]}</div>
                </div>
                <div className="rounded-lg bg-secondary p-3 border border-border">
                  <div className="text-xs text-muted-foreground">Carry Cap</div>
                  <div className="text-xl font-bold">{stats.derivedStats.encumbrance}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleCreate}
            disabled={!isValid || rosterFull}
            size="lg"
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {rosterFull ? "Roster Full" : !isValid ? (remaining !== 0 ? `${Math.abs(remaining)} points ${remaining > 0 ? "remaining" : "over"}` : "Name required") : "Recruit Warrior"}
          </Button>
        </div>
      </div>
    </div>
  );
}
