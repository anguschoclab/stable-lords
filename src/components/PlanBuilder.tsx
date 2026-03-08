/**
 * PlanBuilder — Strategy editor for a warrior's fight plan.
 * Controls OE, AL, Kill Desire, target, offensive/defensive tactics, and bias auto-tune.
 */
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crosshair, Swords, Shield, Flame, AlertTriangle } from "lucide-react";
import type {
  FightPlan,
  BodyTarget,
  OffensiveTactic,
  DefensiveTactic,
} from "@/types/game";
import { STYLE_DISPLAY_NAMES, FightingStyle } from "@/types/game";
import {
  autoTuneFromBias,
  reconcileGearTwoHanded,
  type Bias,
} from "@/engine/planBias";
import { getOffensivePenalty, getDefensivePenalty } from "@/engine/antiSynergy";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";

const BODY_TARGETS: BodyTarget[] = ["Any", "Head", "Chest", "Abdomen", "Arms", "Legs"];
const OFFENSIVE_TACTICS: OffensiveTactic[] = ["none", "Lunge", "Slash", "Bash", "Decisiveness"];
const DEFENSIVE_TACTICS: DefensiveTactic[] = ["none", "Dodge", "Parry", "Riposte", "Responsiveness"];
const BIASES: { value: Bias; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "head-hunt", label: "Head-hunt" },
  { value: "hamstring", label: "Hamstring" },
  { value: "gut", label: "Gut shots" },
  { value: "guard-break", label: "Guard-break" },
];

function SliderField({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  icon,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-1.5">
          {icon}
          {label}
        </Label>
        <Badge
          variant="outline"
          className={`font-mono text-sm min-w-[2rem] justify-center ${color ?? ""}`}
        >
          {value}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function PenaltyBadge({ penalty }: { penalty: number }) {
  if (penalty >= 1) return null;
  const pct = Math.round((1 - penalty) * 100);
  return (
    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertTriangle className="h-3 w-3" />
      Anti-synergy: -{pct}%
    </div>
  );
}

interface PlanBuilderProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  warriorName?: string;
}

export default function PlanBuilder({ plan, onPlanChange, warriorName }: PlanBuilderProps) {
  const [targetingOpen, setTargetingOpen] = useState(false);
  const [bias, setBias] = useState<Bias>("balanced");
  const [prefs, setPrefs] = useState(() => loadUIPrefs());
  const [draft, setDraft] = useState<Partial<FightPlan>>({});

  const merged = useMemo(() => ({ ...plan, ...draft }), [plan, draft]);

  const offPenalty = useMemo(
    () => getOffensivePenalty(merged.style, merged.offensiveTactic),
    [merged.style, merged.offensiveTactic]
  );
  const defPenalty = useMemo(
    () => getDefensivePenalty(merged.style, merged.defensiveTactic),
    [merged.style, merged.defensiveTactic]
  );

  const updateField = useCallback(
    <K extends keyof FightPlan>(key: K, value: FightPlan[K]) => {
      const next = { ...plan, [key]: value };
      onPlanChange(next);
    },
    [plan, onPlanChange]
  );

  const applyTargeting = useCallback(() => {
    let patch = { ...draft };
    if (prefs.autoTunePlan) {
      const tuned = autoTuneFromBias(
        { ...plan, ...patch, style: plan.style } as any,
        bias
      );
      patch = { ...patch, ...tuned };
      reconcileGearTwoHanded(
        { ...plan, style: plan.style } as any,
        patch as any
      );
    }
    onPlanChange({ ...plan, ...patch });
    saveUIPrefs(prefs);
    setTargetingOpen(false);
    setDraft({});
  }, [draft, prefs, bias, plan, onPlanChange]);

  const styleName = STYLE_DISPLAY_NAMES[plan.style] ?? plan.style;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Strategy
            {warriorName && (
              <span className="text-sm text-muted-foreground font-normal">
                — {warriorName}
              </span>
            )}
          </span>
          <Badge variant="secondary" className="text-xs">
            {styleName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Core sliders */}
        <div className="grid gap-5 sm:grid-cols-3">
          <SliderField
            label="Offensive Effort"
            value={plan.OE}
            onChange={(v) => updateField("OE", v)}
            icon={<Swords className="h-3.5 w-3.5 text-arena-gold" />}
            color="text-arena-gold"
          />
          <SliderField
            label="Activity Level"
            value={plan.AL}
            onChange={(v) => updateField("AL", v)}
            icon={<Flame className="h-3.5 w-3.5 text-arena-fame" />}
            color="text-arena-fame"
          />
          <SliderField
            label="Kill Desire"
            value={plan.killDesire ?? 5}
            onChange={(v) => updateField("killDesire", v)}
            icon={<Crosshair className="h-3.5 w-3.5 text-destructive" />}
            color="text-destructive"
          />
        </div>

        {/* Target & Tactics row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5" /> Target
            </Label>
            <Select
              value={plan.target ?? "Any"}
              onValueChange={(v) => updateField("target", v as BodyTarget)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_TARGETS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Swords className="h-3.5 w-3.5" /> Off. Tactic
            </Label>
            <Select
              value={plan.offensiveTactic ?? "none"}
              onValueChange={(v) =>
                updateField("offensiveTactic", v as OffensiveTactic)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFENSIVE_TACTICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "none" ? "(none)" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PenaltyBadge penalty={offPenalty} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Def. Tactic
            </Label>
            <Select
              value={plan.defensiveTactic ?? "none"}
              onValueChange={(v) =>
                updateField("defensiveTactic", v as DefensiveTactic)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFENSIVE_TACTICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "none" ? "(none)" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PenaltyBadge penalty={defPenalty} />
          </div>
        </div>

        {/* Targeting & Auto-Tune Dialog */}
        <Dialog open={targetingOpen} onOpenChange={setTargetingOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Crosshair className="h-4 w-4" />
              Targeting & Auto-Tune…
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                Targeting & Auto-Tune
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Bias Preset</Label>
                <Select
                  value={bias}
                  onValueChange={(v) => setBias(v as Bias)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIASES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Off. Tactic</Label>
                  <Select
                    value={draft.offensiveTactic ?? plan.offensiveTactic ?? "none"}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        offensiveTactic: v as OffensiveTactic,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OFFENSIVE_TACTICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "none" ? "(none)" : t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <PenaltyBadge penalty={offPenalty} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Def. Tactic</Label>
                  <Select
                    value={draft.defensiveTactic ?? plan.defensiveTactic ?? "none"}
                    onValueChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        defensiveTactic: v as DefensiveTactic,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFENSIVE_TACTICS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "none" ? "(none)" : t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <PenaltyBadge penalty={defPenalty} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Target</Label>
                  <Select
                    value={draft.target ?? plan.target ?? "Any"}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, target: v as BodyTarget }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_TARGETS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">OE</Label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm text-center font-mono"
                      value={draft.OE ?? plan.OE}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          OE: Math.min(10, Math.max(1, Number(e.target.value))),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">AL</Label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm text-center font-mono"
                      value={draft.AL ?? plan.AL}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          AL: Math.min(10, Math.max(1, Number(e.target.value))),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kill</Label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm text-center font-mono"
                      value={draft.killDesire ?? plan.killDesire ?? 5}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          killDesire: Math.min(
                            10,
                            Math.max(1, Number(e.target.value))
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="auto-tune"
                  checked={prefs.autoTunePlan}
                  onCheckedChange={(v) => setPrefs({ ...prefs, autoTunePlan: v })}
                />
                <Label htmlFor="auto-tune" className="text-sm cursor-pointer">
                  Auto-tune plan from bias & style
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTargetingOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyTargeting}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Summary line */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          OE {plan.OE} · AL {plan.AL} · KD {plan.killDesire ?? 5} · Target{" "}
          {plan.target ?? "Any"}
          {plan.offensiveTactic && plan.offensiveTactic !== "none" && (
            <> · Off: {plan.offensiveTactic}</>
          )}
          {plan.defensiveTactic && plan.defensiveTactic !== "none" && (
            <> · Def: {plan.defensiveTactic}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
