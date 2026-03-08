/**
 * PlanBuilder — Strategy editor for a warrior's fight plan.
 * Supports phase-based OE/AL/KD overrides for Opening, Mid, and Late bout phases.
 */
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Crosshair, Swords, Shield, Flame, AlertTriangle, Timer, Zap, Clock } from "lucide-react";
import type {
  FightPlan,
  PhaseStrategy,
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

const PHASE_META = {
  opening: { label: "Opening", icon: Zap, desc: "First 25% — burst initiative, set the tone" },
  mid: { label: "Mid", icon: Timer, desc: "25–60% — endurance matters, styles interact" },
  late: { label: "Late", icon: Clock, desc: "60%+ — fatigue, kill windows widen" },
} as const;

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

/** Compact 3-slider phase editor */
function PhaseSliders({
  phase,
  baseOE,
  baseAL,
  baseKD,
  onChange,
}: {
  phase: PhaseStrategy | undefined;
  baseOE: number;
  baseAL: number;
  baseKD: number;
  onChange: (p: PhaseStrategy | undefined) => void;
}) {
  const oe = phase?.OE ?? baseOE;
  const al = phase?.AL ?? baseAL;
  const kd = phase?.killDesire ?? baseKD;
  const isCustom = !!phase;

  const update = (field: keyof PhaseStrategy, val: number) => {
    onChange({ OE: oe, AL: al, killDesire: kd, [field]: val });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SliderField
          label="OE"
          value={oe}
          onChange={(v) => update("OE", v)}
          icon={<Swords className="h-3 w-3 text-arena-gold" />}
          color="text-arena-gold"
        />
        <SliderField
          label="AL"
          value={al}
          onChange={(v) => update("AL", v)}
          icon={<Flame className="h-3 w-3 text-arena-fame" />}
          color="text-arena-fame"
        />
        <SliderField
          label="KD"
          value={kd}
          onChange={(v) => update("killDesire", v)}
          icon={<Crosshair className="h-3 w-3 text-destructive" />}
          color="text-destructive"
        />
      </div>
      {isCustom && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => onChange(undefined)}
        >
          Reset to base values
        </Button>
      )}
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
  const [phaseMode, setPhaseMode] = useState<boolean>(!!plan.phases);

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

  const updatePhase = useCallback(
    (key: "opening" | "mid" | "late", phase: PhaseStrategy | undefined) => {
      const phases = { ...plan.phases };
      if (phase) {
        phases[key] = phase;
      } else {
        delete phases[key];
      }
      const hasAny = phases.opening || phases.mid || phases.late;
      onPlanChange({ ...plan, phases: hasAny ? phases : undefined });
    },
    [plan, onPlanChange]
  );

  const togglePhaseMode = useCallback(
    (on: boolean) => {
      setPhaseMode(on);
      if (!on) {
        // Remove all phase overrides
        onPlanChange({ ...plan, phases: undefined });
      } else if (!plan.phases) {
        // Seed phases from base values
        const base: PhaseStrategy = { OE: plan.OE, AL: plan.AL, killDesire: plan.killDesire ?? 5 };
        onPlanChange({
          ...plan,
          phases: {
            opening: { ...base, OE: Math.min(10, base.OE + 1), AL: Math.min(10, base.AL + 1) },
            mid: { ...base },
            late: { ...base, killDesire: Math.min(10, base.killDesire + 2) },
          },
        });
      }
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
        {/* Phase Mode Toggle */}
        <div className="flex items-center justify-between border border-border rounded-lg p-3 bg-secondary/30">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <div>
              <Label className="text-sm font-medium cursor-pointer" htmlFor="phase-toggle">
                Phase-Based Strategy
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Set different OE/AL/KD for Opening, Mid, and Late phases
              </p>
            </div>
          </div>
          <Switch
            id="phase-toggle"
            checked={phaseMode}
            onCheckedChange={togglePhaseMode}
          />
        </div>

        {!phaseMode ? (
          /* ── Single-phase (classic) sliders ── */
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
        ) : (
          /* ── Phase-based strategy tabs ── */
          <Tabs defaultValue="opening" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              {(Object.entries(PHASE_META) as [keyof typeof PHASE_META, typeof PHASE_META[keyof typeof PHASE_META]][]).map(
                ([key, meta]) => {
                  const Icon = meta.icon;
                  const hasOverride = !!plan.phases?.[key];
                  return (
                    <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                      {hasOverride && (
                        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                      )}
                    </TabsTrigger>
                  );
                }
              )}
            </TabsList>

            {(Object.entries(PHASE_META) as [keyof typeof PHASE_META, typeof PHASE_META[keyof typeof PHASE_META]][]).map(
              ([key, meta]) => (
                <TabsContent key={key} value={key} className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                  <PhaseSliders
                    phase={plan.phases?.[key]}
                    baseOE={plan.OE}
                    baseAL={plan.AL}
                    baseKD={plan.killDesire ?? 5}
                    onChange={(p) => updatePhase(key, p)}
                  />
                </TabsContent>
              )
            )}
          </Tabs>
        )}

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
          {phaseMode && plan.phases ? (
            <div className="space-y-1">
              {(["opening", "mid", "late"] as const).map((key) => {
                const p = plan.phases?.[key];
                const oe = p?.OE ?? plan.OE;
                const al = p?.AL ?? plan.AL;
                const kd = p?.killDesire ?? plan.killDesire ?? 5;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] min-w-[4rem] justify-center">
                      {PHASE_META[key].label}
                    </Badge>
                    <span>OE {oe} · AL {al} · KD {kd}</span>
                    {p && <span className="text-primary">●</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              OE {plan.OE} · AL {plan.AL} · KD {plan.killDesire ?? 5} · Target{" "}
              {plan.target ?? "Any"}
            </>
          )}
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
