import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PlanCondition,
  ConditionTriggerType,
  OffensiveTactic,
  DefensiveTactic,
} from "@/types/game";

interface ConditionEditorProps {
  conditions: PlanCondition[];
  onChange: (conditions: PlanCondition[]) => void;
}

const TRIGGER_OPTIONS: { label: string; type: ConditionTriggerType; inputType: "percent" | "integer" | "phase" }[] = [
  { label: "HP Below",          type: "HP_BELOW",          inputType: "percent" },
  { label: "HP Above",          type: "HP_ABOVE",           inputType: "percent" },
  { label: "Endurance Below",   type: "ENDURANCE_BELOW",   inputType: "percent" },
  { label: "Momentum Lead",     type: "MOMENTUM_LEAD",     inputType: "integer" },
  { label: "Momentum Deficit",  type: "MOMENTUM_DEFICIT",  inputType: "integer" },
  { label: "Phase Is",          type: "PHASE_IS",          inputType: "phase" },
];

const OFFENSIVE_TACTICS: { label: string; value: OffensiveTactic }[] = [
  { label: "—",           value: "none" },
  { label: "Lunge",       value: "Lunge" },
  { label: "Slash",       value: "Slash" },
  { label: "Bash",        value: "Bash" },
  { label: "Decisiveness",value: "Decisiveness" },
];

const DEFENSIVE_TACTICS: { label: string; value: DefensiveTactic }[] = [
  { label: "—",             value: "none" },
  { label: "Dodge",         value: "Dodge" },
  { label: "Parry",         value: "Parry" },
  { label: "Riposte",       value: "Riposte" },
  { label: "Responsiveness",value: "Responsiveness" },
];

const DEFAULT_CONDITION: PlanCondition = {
  trigger: { type: "HP_BELOW", value: 35 },
  override: { OE: 4 },
};

function triggerDisplayValue(cond: PlanCondition): string {
  const opt = TRIGGER_OPTIONS.find(o => o.type === cond.trigger.type);
  if (!opt) return String(cond.trigger.value);
  if (opt.inputType === "percent") return `${cond.trigger.value}%`;
  if (opt.inputType === "phase") return String(cond.trigger.value);
  return String(cond.trigger.value);
}

export default function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  function addCondition() {
    onChange([...conditions, { ...DEFAULT_CONDITION, override: { OE: 4 } }]);
  }

  function removeCondition(idx: number) {
    onChange(conditions.filter((_, i) => i !== idx));
  }

  function updateCondition(idx: number, partial: Partial<PlanCondition>) {
    onChange(conditions.map((c, i) => i === idx ? { ...c, ...partial } : c));
  }

  function updateTrigger(idx: number, type: ConditionTriggerType) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const opt = TRIGGER_OPTIONS.find(o => o.type === type)!;
    let value: number | string;
    if (opt.inputType === "percent") value = 35;
    else if (opt.inputType === "integer") value = 2;
    else value = "Mid";
    updateCondition(idx, { trigger: { type, value } });
  }

  function updateTriggerValue(idx: number, raw: string) {
    const cond = conditions[idx];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const opt = TRIGGER_OPTIONS.find(o => o.type === cond.trigger.type)!;
    let value: number | string;
    if (opt.inputType === "phase") {
      value = raw;
    } else {
      const n = parseFloat(raw);
      value = isNaN(n) ? cond.trigger.value : n;
    }
    updateCondition(idx, { trigger: { ...cond.trigger, value } });
  }

  function updateOverrideSlider(idx: number, key: "OE" | "AL" | "killDesire", val: number | undefined) {
    const cond = conditions[idx];
    const override = { ...cond.override };
    if (val === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete override[key];
    } else {
      override[key] = val;
    }
    updateCondition(idx, { override });
  }

  function updateOverrideTactic(idx: number, key: "offensiveTactic" | "defensiveTactic", val: string) {
    const cond = conditions[idx];
    const override = { ...cond.override };
    if (val === "none") {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete override[key];
    } else {
      (override as Record<string, unknown>)[key] = val;
    }
    updateCondition(idx, { override });
  }

  return (
    <div className="space-y-4">
      {conditions.length === 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic text-center py-4">
          No conditions set — fighter uses base strategy throughout.
        </p>
      )}

      {conditions.map((cond, idx) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const trigOpt = TRIGGER_OPTIONS.find(o => o.type === cond.trigger.type)!;
        return (
          <div key={idx} className="border border-white/10 bg-black/30 p-4 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <Badge className="rounded-none border-white/20 bg-white/5 text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                Condition {idx + 1}
              </Badge>
              <div className="flex items-center gap-2">
                {cond.label && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-arena-gold italic">
                    {cond.label}
                  </span>
                )}
                <button
                  onClick={() => removeCondition(idx)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  aria-label="Remove condition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* WHEN row */}
            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">When</div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={cond.trigger.type}
                  onChange={e => updateTrigger(idx, e.target.value as ConditionTriggerType)}
                  className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
                >
                  {TRIGGER_OPTIONS.map(o => (
                    <option key={o.type} value={o.type}>{o.label}</option>
                  ))}
                </select>

                {trigOpt.inputType === "phase" ? (
                  <select
                    value={String(cond.trigger.value)}
                    onChange={e => updateTriggerValue(idx, e.target.value)}
                    className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
                  >
                    <option value="Opening">Opening</option>
                    <option value="Mid">Mid</option>
                    <option value="Late">Late</option>
                  </select>
                ) : trigOpt.inputType === "integer" ? (
                  <select
                    value={String(cond.trigger.value)}
                    onChange={e => updateTriggerValue(idx, e.target.value)}
                    className="bg-black/60 border border-white/10 text-[10px] font-black uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={Number(cond.trigger.value)}
                      onChange={e => updateTriggerValue(idx, e.target.value)}
                      className="w-16 bg-black/60 border border-white/10 text-[10px] font-mono font-bold text-arena-gold px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 text-center"
                    />
                    <span className="text-[10px] text-muted-foreground/60 font-bold">%</span>
                  </div>
                )}

                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  → {triggerDisplayValue(cond)}
                </span>
              </div>
            </div>

            {/* THEN row */}
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Then Override</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OE override */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      cond.override.OE !== undefined ? "text-arena-gold" : "text-muted-foreground/40"
                    )}>
                      OE {cond.override.OE !== undefined ? cond.override.OE : "—"}
                    </Label>
                    {cond.override.OE !== undefined ? (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "OE", undefined)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive">
                        clear
                      </button>
                    ) : (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "OE", 5)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-gold">
                        set
                      </button>
                    )}
                  </div>
                  {cond.override.OE !== undefined && (
                    <Slider
                      value={[cond.override.OE]}
                      onValueChange={([v]) => updateOverrideSlider(idx, "OE", v)}
                      min={1} max={10} step={1}
                    />
                  )}
                </div>

                {/* AL override */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      cond.override.AL !== undefined ? "text-arena-fame" : "text-muted-foreground/40"
                    )}>
                      AL {cond.override.AL !== undefined ? cond.override.AL : "—"}
                    </Label>
                    {cond.override.AL !== undefined ? (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "AL", undefined)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive">
                        clear
                      </button>
                    ) : (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "AL", 5)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-arena-fame">
                        set
                      </button>
                    )}
                  </div>
                  {cond.override.AL !== undefined && (
                    <Slider
                      value={[cond.override.AL]}
                      onValueChange={([v]) => updateOverrideSlider(idx, "AL", v)}
                      min={1} max={10} step={1}
                    />
                  )}
                </div>

                {/* KD override */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      cond.override.killDesire !== undefined ? "text-destructive" : "text-muted-foreground/40"
                    )}>
                      KD {cond.override.killDesire !== undefined ? cond.override.killDesire : "—"}
                    </Label>
                    {cond.override.killDesire !== undefined ? (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "killDesire", undefined)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive">
                        clear
                      </button>
                    ) : (
                      <button aria-label="button" onClick={() => updateOverrideSlider(idx, "killDesire", 5)} className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-destructive">
                        set
                      </button>
                    )}
                  </div>
                  {cond.override.killDesire !== undefined && (
                    <Slider
                      value={[cond.override.killDesire]}
                      onValueChange={([v]) => updateOverrideSlider(idx, "killDesire", v)}
                      min={1} max={10} step={1}
                    />
                  )}
                </div>
              </div>

              {/* Tactic overrides */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Off. Tactic</div>
                  <select
                    value={cond.override.offensiveTactic ?? "none"}
                    onChange={e => updateOverrideTactic(idx, "offensiveTactic", e.target.value)}
                    className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-blood/40 appearance-none"
                  >
                    {OFFENSIVE_TACTICS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Def. Tactic</div>
                  <select
                    value={cond.override.defensiveTactic ?? "none"}
                    onChange={e => updateOverrideTactic(idx, "defensiveTactic", e.target.value)}
                    className="w-full bg-black/60 border border-white/10 text-[10px] font-bold uppercase tracking-wide text-foreground px-2 py-1.5 focus:outline-none focus:border-arena-gold/40 appearance-none"
                  >
                    {DEFENSIVE_TACTICS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Label */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Label (optional)</div>
                <input
                  type="text"
                  placeholder="e.g. Survival Mode"
                  maxLength={32}
                  value={cond.label ?? ""}
                  onChange={e => updateCondition(idx, { label: e.target.value || undefined })}
                  className="w-full bg-black/60 border border-white/10 text-[10px] font-bold text-foreground placeholder:text-muted-foreground/20 px-2 py-1.5 focus:outline-none focus:border-arena-gold/40"
                />
              </div>
            </div>
          </div>
        );
      })}

      <button aria-label="button"
        onClick={addCondition}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-white/10 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:border-arena-gold/40 hover:text-arena-gold transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Condition
      </button>
    </div>
  );
}
