/**
 * PlanBuilder — Full Strategy Editor per Spec v1.0
 * Features: style presets, per-phase OE/AL/KD, tactic suitability,
 * stamina projection curve, soft warnings, and style guidance.
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Crosshair, Swords, Shield, Flame, AlertTriangle, Timer, Zap, Clock,
  ChevronDown, Sparkles, Activity, BookOpen,
} from "lucide-react";
import type {
  FightPlan, PhaseStrategy, OffensiveTactic, DefensiveTactic, Warrior,
  type AttackTarget, type ProtectTarget,
} from "@/types/game";
import { STYLE_DISPLAY_NAMES, FightingStyle } from "@/types/game";
import { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from "@/engine/planBias";
import { getOffensivePenalty, getDefensivePenalty } from "@/engine/antiSynergy";
import {
  getOffensiveSuitability, getDefensiveSuitability,
  SUITABILITY_COLORS, SUITABILITY_LABELS, type SuitabilityRating,
} from "@/engine/tacticSuitability";
import { STYLE_PRESETS, type StylePreset } from "@/engine/stylePresets";
import { loadUIPrefs, saveUIPrefs } from "@/state/uiPrefs";

const ATTACK_TARGETS: AttackTarget[] = ["Any", "Head", "Chest", "Abdomen", "Right Arm", "Left Arm", "Right Leg", "Left Leg"];
const PROTECT_TARGETS: ProtectTarget[] = ["Any", "Head", "Body", "Arms", "Legs"];
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
  opening: { label: "Opening", icon: Zap, desc: "Minutes 1–3 — burst initiative, set the tone" },
  mid: { label: "Mid", icon: Timer, desc: "Minutes 4–7 — endurance matters, styles interact" },
  late: { label: "Late", icon: Clock, desc: "Minutes 8+ — fatigue, kill windows widen" },
} as const;

// ─── Style Guidance ────────────────────────────────────────────────────────

const STYLE_GUIDANCE: Partial<Record<FightingStyle, string>> = {
  [FightingStyle.AimedBlow]: "Patient style. Use low-moderate OE, let WT/DF carry accuracy. Decisiveness tactic is Well Suited. Escalate KD late.",
  [FightingStyle.BashingAttack]: "Power style. High OE, moderate AL. Bash tactic is natural. Avoid high AL — bashers lack mobility.",
  [FightingStyle.LungingAttack]: "Speed style. High AL for initiative, moderate OE. Lunge and Dodge are Well Suited. Watch endurance — blitz builds collapse fast.",
  [FightingStyle.ParryLunge]: "Hybrid. Moderate OE early, wait for openings. Parry + Lunge are both Well Suited. Counter-strike builds excel.",
  [FightingStyle.ParryRiposte]: "Counter-puncher. Low OE, let opponents swing and miss. Parry, Riposte, and Responsiveness all Well Suited. KD 3-5 until late.",
  [FightingStyle.ParryStrike]: "Efficient. Moderate everything. Parry and Decisiveness Well Suited. Consistent phase-to-phase with late KD ramp.",
  [FightingStyle.SlashingAttack]: "Arc fighter. High OE for sweeping cuts. Slash tactic is Well Suited. Manages crowds and multi-hit exchanges.",
  [FightingStyle.StrikingAttack]: "Direct. High OE, moderate AL. Decisiveness Well Suited. Clean, efficient damage. Fast Finish preset is strong.",
  [FightingStyle.TotalParry]: "Endurance fortress. OE 2-4, AL 2-4. Parry is Well Suited. Wins by exhausting opponents. Low KD until very late.",
  [FightingStyle.WallOfSteel]: "Blade wall. Moderate OE+AL, Responsiveness Well Suited. Grinds through constant blade motion. Avoid high extremes.",
};

// ─── Stamina Projection ────────────────────────────────────────────────────

function projectStamina(
  plan: FightPlan,
  baseEndurance: number,
  gearWeight: number
): { minute: number; pct: number }[] {
  const points: { minute: number; pct: number }[] = [];
  let endurance = baseEndurance;
  const maxEnd = baseEndurance;

  for (let m = 1; m <= 12; m++) {
    // Determine phase
    const phase = m <= 3 ? "opening" : m <= 7 ? "mid" : "late";
    const phaseKey = phase as "opening" | "mid" | "late";
    const oe = plan.phases?.[phaseKey]?.OE ?? plan.OE;
    const al = plan.phases?.[phaseKey]?.AL ?? plan.AL;

    // Drain formula: OE cost + AL cost + gear
    const drain = (oe * 0.6 + al * 0.4) + (gearWeight * 0.1);
    endurance = Math.max(0, endurance - drain);
    points.push({ minute: m, pct: Math.round((endurance / maxEnd) * 100) });
  }

  return points;
}

function StaminaCurve({ points }: { points: { minute: number; pct: number }[] }) {
  const w = 280;
  const h = 60;
  const pad = { l: 24, r: 4, t: 4, b: 16 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const pathD = points
    .map((p, i) => {
      const x = pad.l + (i / (points.length - 1)) * cw;
      const y = pad.t + ch - (p.pct / 100) * ch;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Red zone line at 20%
  const redY = pad.t + ch - (20 / 100) * ch;

  // Find collapse minute (first below 10%)
  const collapseIdx = points.findIndex(p => p.pct <= 10);
  const collapseMin = collapseIdx >= 0 ? points[collapseIdx].minute : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">
          <Activity className="h-3 w-3" /> Stamina Projection
        </Label>
        {collapseMin && (
          <span className="text-[10px] text-destructive font-medium">
            ⚠ Collapse risk ~min {collapseMin}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ maxHeight: 60 }}>
        {/* Red zone */}
        <rect x={pad.l} y={redY} width={cw} height={h - pad.b - redY} fill="hsl(var(--destructive) / 0.08)" />
        <line x1={pad.l} y1={redY} x2={w - pad.r} y2={redY} stroke="hsl(var(--destructive) / 0.3)" strokeWidth="0.5" strokeDasharray="3 2" />
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = pad.t + ch - (pct / 100) * ch;
          return <line key={pct} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="hsl(var(--border))" strokeWidth="0.3" />;
        })}
        {/* Curve */}
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        {/* Dots */}
        {points.map((p, i) => {
          const x = pad.l + (i / (points.length - 1)) * cw;
          const y = pad.t + ch - (p.pct / 100) * ch;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={p.pct <= 20 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />;
        })}
        {/* X labels */}
        {[1, 4, 8, 12].map(m => {
          const x = pad.l + ((m - 1) / 11) * cw;
          return <text key={m} x={x} y={h - 2} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 7 }}>M{m}</text>;
        })}
        {/* Y labels */}
        <text x={2} y={pad.t + 6} className="fill-muted-foreground" style={{ fontSize: 7 }}>100%</text>
        <text x={2} y={redY + 3} className="fill-destructive" style={{ fontSize: 7 }}>20%</text>
      </svg>
    </div>
  );
}

// ─── Warnings Engine ────────────────────────────────────────────────────────

function computeWarnings(plan: FightPlan): string[] {
  const warnings: string[] = [];
  const style = plan.style;
  const oe = plan.OE;
  const al = plan.AL;
  const kd = plan.killDesire ?? 5;

  if (oe + al > 14) warnings.push("Extreme energy burn — warrior may collapse early");
  
  const aggressiveStyles = [FightingStyle.BashingAttack, FightingStyle.LungingAttack, FightingStyle.SlashingAttack];
  const defensiveStyles = [FightingStyle.TotalParry, FightingStyle.ParryRiposte];

  if (oe <= 2 && aggressiveStyles.includes(style)) warnings.push("Very low OE conflicts with style identity");
  if (oe >= 8 && defensiveStyles.includes(style)) warnings.push("High OE may undermine defensive advantages");
  if (al >= 8 && style === FightingStyle.BashingAttack) warnings.push("Bashers lack mobility — high AL may be wasted");
  if (kd <= 2 && [FightingStyle.StrikingAttack, FightingStyle.BashingAttack].includes(style)) {
    warnings.push("Low kill desire wastes finishing opportunities");
  }

  // Check tactic suitability
  if (plan.offensiveTactic && plan.offensiveTactic !== "none") {
    const suit = getOffensiveSuitability(style, plan.offensiveTactic);
    if (suit === "U") warnings.push(`${plan.offensiveTactic} is unsuited to your style — reduced effectiveness`);
  }
  if (plan.defensiveTactic && plan.defensiveTactic !== "none") {
    const suit = getDefensiveSuitability(style, plan.defensiveTactic);
    if (suit === "U") warnings.push(`${plan.defensiveTactic} is unsuited to your style — reduced effectiveness`);
  }

  return warnings;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SliderField({
  label, value, onChange, min = 1, max = 10, icon, color,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; icon?: React.ReactNode; color?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-1.5">{icon}{label}</Label>
        <Badge variant="outline" className={`font-mono text-sm min-w-[2rem] justify-center ${color ?? ""}`}>
          {value}
        </Badge>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={1} className="w-full" />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function PenaltyBadge({ penalty }: { penalty: number }) {
  if (penalty >= 1) return null;
  const pct = Math.round((1 - penalty) * 100);
  return (
    <div className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertTriangle className="h-3 w-3" />Anti-synergy: -{pct}%
    </div>
  );
}

function SuitabilityBadge({ rating }: { rating: SuitabilityRating }) {
  return (
    <span className={`text-[10px] font-medium ${SUITABILITY_COLORS[rating]}`}>
      [{rating}] {SUITABILITY_LABELS[rating]}
    </span>
  );
}

function PhaseSliders({
  phase, baseOE, baseAL, baseKD, style, basePlan, onChange,
}: {
  phase: PhaseStrategy | undefined; baseOE: number; baseAL: number; baseKD: number;
  style: FightingStyle; basePlan: FightPlan;
  onChange: (p: PhaseStrategy | undefined) => void;
}) {
  const oe = phase?.OE ?? baseOE;
  const al = phase?.AL ?? baseAL;
  const kd = phase?.killDesire ?? baseKD;
  const offTactic = phase?.offensiveTactic ?? basePlan.offensiveTactic ?? "none";
  const defTactic = phase?.defensiveTactic ?? basePlan.defensiveTactic ?? "none";
  const phaseTarget = phase?.target ?? basePlan.target ?? "Any";

  const update = (field: keyof PhaseStrategy, val: any) => {
    onChange({ OE: oe, AL: al, killDesire: kd, offensiveTactic: phase?.offensiveTactic, defensiveTactic: phase?.defensiveTactic, target: phase?.target, [field]: val });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SliderField label="OE" value={oe} onChange={v => update("OE", v)} icon={<Swords className="h-3 w-3 text-arena-gold" />} color="text-arena-gold" />
        <SliderField label="AL" value={al} onChange={v => update("AL", v)} icon={<Flame className="h-3 w-3 text-arena-fame" />} color="text-arena-fame" />
        <SliderField label="KD" value={kd} onChange={v => update("killDesire", v)} icon={<Crosshair className="h-3 w-3 text-destructive" />} color="text-destructive" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Crosshair className="h-3 w-3" /> Target</Label>
          <Select value={phaseTarget} onValueChange={v => update("target", v as BodyTarget)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BODY_TARGETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Swords className="h-3 w-3" /> Off. Tactic</Label>
          <Select value={offTactic} onValueChange={v => update("offensiveTactic", v as OffensiveTactic)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {OFFENSIVE_TACTICS.map(t => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-1.5">
                    {t === "none" ? "(none)" : t}
                    {t !== "none" && <SuitabilityBadge rating={getOffensiveSuitability(style, t)} />}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Shield className="h-3 w-3" /> Def. Tactic</Label>
          <Select value={defTactic} onValueChange={v => update("defensiveTactic", v as DefensiveTactic)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEFENSIVE_TACTICS.map(t => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-1.5">
                    {t === "none" ? "(none)" : t}
                    {t !== "none" && <SuitabilityBadge rating={getDefensiveSuitability(style, t)} />}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!!phase && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => onChange(undefined)}>
          Reset to base values
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

interface PlanBuilderProps {
  plan: FightPlan;
  onPlanChange: (plan: FightPlan) => void;
  warriorName?: string;
  warrior?: Warrior;
}

export default function PlanBuilder({ plan, onPlanChange, warriorName, warrior }: PlanBuilderProps) {
  const [targetingOpen, setTargetingOpen] = useState(false);
  const [bias, setBias] = useState<Bias>("balanced");
  const [prefs, setPrefs] = useState(() => loadUIPrefs());
  const [draft, setDraft] = useState<Partial<FightPlan>>({});
  const [phaseMode, setPhaseMode] = useState<boolean>(!!plan.phases);
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const merged = useMemo(() => ({ ...plan, ...draft }), [plan, draft]);

  const offPenalty = useMemo(() => getOffensivePenalty(merged.style, merged.offensiveTactic), [merged.style, merged.offensiveTactic]);
  const defPenalty = useMemo(() => getDefensivePenalty(merged.style, merged.defensiveTactic), [merged.style, merged.defensiveTactic]);

  const warnings = useMemo(() => computeWarnings(plan), [plan]);

  const staminaPoints = useMemo(() => {
    const endurance = warrior?.derivedStats?.endurance ?? 30;
    const gearWeight = 4; // default
    return projectStamina(plan, endurance, gearWeight);
  }, [plan, warrior]);

  const presets = STYLE_PRESETS[plan.style] || [];

  const updateField = useCallback(
    <K extends keyof FightPlan>(key: K, value: FightPlan[K]) => {
      onPlanChange({ ...plan, [key]: value });
    },
    [plan, onPlanChange]
  );

  const updatePhase = useCallback(
    (key: "opening" | "mid" | "late", phase: PhaseStrategy | undefined) => {
      const phases = { ...plan.phases };
      if (phase) phases[key] = phase; else delete phases[key];
      const hasAny = phases.opening || phases.mid || phases.late;
      onPlanChange({ ...plan, phases: hasAny ? phases : undefined });
    },
    [plan, onPlanChange]
  );

  const togglePhaseMode = useCallback(
    (on: boolean) => {
      setPhaseMode(on);
      if (!on) {
        onPlanChange({ ...plan, phases: undefined });
      } else if (!plan.phases) {
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

  const applyPreset = useCallback((preset: StylePreset) => {
    onPlanChange({
      ...plan,
      OE: preset.plan.OE,
      AL: preset.plan.AL,
      killDesire: preset.plan.killDesire,
      phases: preset.plan.phases,
    });
    setPhaseMode(!!preset.plan.phases);
  }, [plan, onPlanChange]);

  const applyTargeting = useCallback(() => {
    let patch = { ...draft };
    if (prefs.autoTunePlan) {
      const tuned = autoTuneFromBias({ ...plan, ...patch, style: plan.style } as any, bias);
      patch = { ...patch, ...tuned };
      reconcileGearTwoHanded({ ...plan, style: plan.style } as any, patch as any);
    }
    onPlanChange({ ...plan, ...patch });
    saveUIPrefs(prefs);
    setTargetingOpen(false);
    setDraft({});
  }, [draft, prefs, bias, plan, onPlanChange]);

  const styleName = STYLE_DISPLAY_NAMES[plan.style] ?? plan.style;
  const guidance = STYLE_GUIDANCE[plan.style];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Strategy
            {warriorName && <span className="text-sm text-muted-foreground font-normal">— {warriorName}</span>}
          </span>
          <Badge variant="secondary" className="text-xs">{styleName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Style Presets */}
        {presets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Style Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 h-auto py-1.5 px-3"
                  onClick={() => applyPreset(p)}
                  title={p.description}
                >
                  <Sparkles className="h-3 w-3" />
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Phase Mode Toggle */}
        <div className="flex items-center justify-between border border-border rounded-lg p-3 bg-secondary/30">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <div>
              <Label className="text-sm font-medium cursor-pointer" htmlFor="phase-toggle">Phase-Based Strategy</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">Set different OE/AL/KD for Opening, Mid, and Late phases</p>
            </div>
          </div>
          <Switch id="phase-toggle" checked={phaseMode} onCheckedChange={togglePhaseMode} />
        </div>

        {!phaseMode ? (
          <div className="grid gap-5 sm:grid-cols-3">
            <SliderField label="Offensive Effort" value={plan.OE} onChange={v => updateField("OE", v)} icon={<Swords className="h-3.5 w-3.5 text-arena-gold" />} color="text-arena-gold" />
            <SliderField label="Activity Level" value={plan.AL} onChange={v => updateField("AL", v)} icon={<Flame className="h-3.5 w-3.5 text-arena-fame" />} color="text-arena-fame" />
            <SliderField label="Kill Desire" value={plan.killDesire ?? 5} onChange={v => updateField("killDesire", v)} icon={<Crosshair className="h-3.5 w-3.5 text-destructive" />} color="text-destructive" />
          </div>
        ) : (
          <Tabs defaultValue="opening" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              {(Object.entries(PHASE_META) as [keyof typeof PHASE_META, typeof PHASE_META[keyof typeof PHASE_META]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const hasOverride = !!plan.phases?.[key];
                return (
                  <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                    {hasOverride && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary inline-block" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {(Object.entries(PHASE_META) as [keyof typeof PHASE_META, typeof PHASE_META[keyof typeof PHASE_META]][]).map(([key, meta]) => (
              <TabsContent key={key} value={key} className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
                <PhaseSliders phase={plan.phases?.[key]} baseOE={plan.OE} baseAL={plan.AL} baseKD={plan.killDesire ?? 5} style={plan.style} basePlan={plan} onChange={p => updatePhase(key, p)} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Stamina Projection */}
        <StaminaCurve points={staminaPoints} />

        {/* Target, Protect & Tactics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Crosshair className="h-3.5 w-3.5" /> Target</Label>
            <Select value={plan.target ?? "Any"} onValueChange={v => updateField("target", v as BodyTarget)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_TARGETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Protect</Label>
            <Select value={plan.protect ?? "Any"} onValueChange={v => updateField("protect", v as BodyTarget)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_TARGETS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Swords className="h-3.5 w-3.5" /> Off. Tactic</Label>
            <Select value={plan.offensiveTactic ?? "none"} onValueChange={v => updateField("offensiveTactic", v as OffensiveTactic)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OFFENSIVE_TACTICS.map(t => (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      {t === "none" ? "(none)" : t}
                      {t !== "none" && (
                        <SuitabilityBadge rating={getOffensiveSuitability(plan.style, t)} />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PenaltyBadge penalty={offPenalty} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Def. Tactic</Label>
            <Select value={plan.defensiveTactic ?? "none"} onValueChange={v => updateField("defensiveTactic", v as DefensiveTactic)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEFENSIVE_TACTICS.map(t => (
                  <SelectItem key={t} value={t}>
                    <span className="flex items-center gap-2">
                      {t === "none" ? "(none)" : t}
                      {t !== "none" && (
                        <SuitabilityBadge rating={getDefensiveSuitability(plan.style, t)} />
                      )}
                    </span>
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
              <Crosshair className="h-4 w-4" />Targeting & Auto-Tune…
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="font-display">Targeting & Auto-Tune</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Bias Preset</Label>
                <Select value={bias} onValueChange={v => setBias(v as Bias)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BIASES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Off. Tactic</Label>
                  <Select value={draft.offensiveTactic ?? plan.offensiveTactic ?? "none"} onValueChange={v => setDraft(d => ({ ...d, offensiveTactic: v as OffensiveTactic }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OFFENSIVE_TACTICS.map(t => <SelectItem key={t} value={t}>{t === "none" ? "(none)" : t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <PenaltyBadge penalty={offPenalty} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Def. Tactic</Label>
                  <Select value={draft.defensiveTactic ?? plan.defensiveTactic ?? "none"} onValueChange={v => setDraft(d => ({ ...d, defensiveTactic: v as DefensiveTactic }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEFENSIVE_TACTICS.map(t => <SelectItem key={t} value={t}>{t === "none" ? "(none)" : t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <PenaltyBadge penalty={defPenalty} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch id="auto-tune" checked={prefs.autoTunePlan} onCheckedChange={v => setPrefs({ ...prefs, autoTunePlan: v })} />
                <Label htmlFor="auto-tune" className="text-sm cursor-pointer">Auto-tune plan from bias & style</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTargetingOpen(false)}>Cancel</Button>
              <Button onClick={applyTargeting}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Style Guidance */}
        {guidance && (
          <Collapsible open={guidanceOpen} onOpenChange={setGuidanceOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Style Guidance — {styleName}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="rounded-md bg-secondary/30 p-3 text-xs text-muted-foreground leading-relaxed mt-1">
                {guidance}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Summary line */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          {phaseMode && plan.phases ? (
            <div className="space-y-1">
              {(["opening", "mid", "late"] as const).map(key => {
                const p = plan.phases?.[key];
                const oe = p?.OE ?? plan.OE;
                const al = p?.AL ?? plan.AL;
                const kd = p?.killDesire ?? plan.killDesire ?? 5;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] min-w-[4rem] justify-center">{PHASE_META[key].label}</Badge>
                    <span>OE {oe} · AL {al} · KD {kd}</span>
                    {p && <span className="text-primary">●</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <>OE {plan.OE} · AL {plan.AL} · KD {plan.killDesire ?? 5} · Target {plan.target ?? "Any"}</>
          )}
          {plan.offensiveTactic && plan.offensiveTactic !== "none" && <> · Off: {plan.offensiveTactic}</>}
          {plan.defensiveTactic && plan.defensiveTactic !== "none" && <> · Def: {plan.defensiveTactic}</>}
        </div>
      </CardContent>
    </Card>
  );
}
