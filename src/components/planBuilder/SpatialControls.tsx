import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FightPlan, Warrior } from "@/types/game";
import type { DistanceRange } from "@/types/shared.types";
import { getWeaponPreferredRange, getWeaponRangeMod } from "@/engine/combat/distanceResolution";

const DISTANCE_RANGES: DistanceRange[] = ["Grapple", "Tight", "Striking", "Extended"];

interface SpatialControlsProps {
  plan: FightPlan;
  warrior?: Warrior;
  onPlanChange: (plan: FightPlan) => void;
}

export default function SpatialControls({ plan, warrior, onPlanChange }: SpatialControlsProps) {
  return (
    <div className="bg-white/5 p-6 border border-white/5 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <MoveHorizontal className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Spatial Tactics</span>
      </div>

      {/* Feint Tendency */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Feint Tendency</Label>
          <span className="text-sm font-mono font-bold text-blue-400">{plan.feintTendency ?? 0}</span>
        </div>
        {warrior && warrior.attributes.WT < 15 && (
          <p className="text-[9px] text-yellow-400 font-black uppercase tracking-wider">
            ⚠ WT {warrior.attributes.WT} — needs WT ≥ 15 to trigger feints
          </p>
        )}
        <Slider
          min={0} max={10} step={1}
          value={[plan.feintTendency ?? 0]}
          onValueChange={([v]) => onPlanChange({ ...plan, feintTendency: v })}
        />
      </div>

      {/* Range Preference */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Range Preference</Label>
        {warrior?.loadout?.weaponId && (
          <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-wider">
            Natural: {getWeaponPreferredRange(warrior.loadout.weaponId)}
          </p>
        )}
        <div className="grid grid-cols-4 gap-1">
          {DISTANCE_RANGES.map((r) => {
            const isNatural = warrior?.loadout?.weaponId && getWeaponPreferredRange(warrior.loadout.weaponId) === r;
            const isSelected = (plan.rangePreference ?? getWeaponPreferredRange(warrior?.loadout?.weaponId)) === r;
            return (
              <button
                key={r}
                onClick={() => onPlanChange({ ...plan, rangePreference: r })}
                className={cn(
                  "py-1.5 text-[9px] font-black uppercase tracking-wider border transition-all",
                  isSelected
                    ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                    : "bg-black/40 border-white/10 text-muted-foreground hover:border-white/30"
                )}
              >
                {r}
                {isNatural && <span className="block text-[7px] text-blue-400/60 normal-case font-normal">natural</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weapon Range Modifier Grid */}
      {warrior?.loadout?.weaponId && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Weapon ATT Modifiers
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {DISTANCE_RANGES.map((r) => {
              const mod = getWeaponRangeMod(warrior.loadout?.weaponId, r);
              return (
                <div key={r} className="bg-black/40 border border-white/5 p-2 text-center">
                  <div className="text-[8px] uppercase tracking-wider text-muted-foreground/60 mb-1">{r}</div>
                  <div className={cn(
                    "text-xs font-mono font-black",
                    mod > 0 ? "text-green-400" : mod < 0 ? "text-red-400" : "text-muted-foreground/40"
                  )}>
                    {mod > 0 ? "+" : ""}{mod}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
