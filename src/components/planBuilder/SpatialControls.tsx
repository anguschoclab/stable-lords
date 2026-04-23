import { Label } from '@/components/ui/label';
import { MoveHorizontal, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { FightPlan, Warrior } from '@/types/game';
import type { DistanceRange } from '@/types/shared.types';
import {
  getWeaponPreferredRange,
  getWeaponRangeMod,
} from '@/engine/combat/mechanics/distanceResolution';

const DISTANCE_RANGES: DistanceRange[] = ['Grapple', 'Tight', 'Striking', 'Extended'];

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
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
          Spatial Tactics
        </span>
      </div>

      {/* Feint Tendency — read-only, derived from warrior WT */}
      {warrior && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Feint Tendency
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/40 cursor-help" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="bg-neutral-950 border-white/10 p-3 space-y-1.5 w-56"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">Feint Tendency</p>
                  <p className="text-[9px] leading-relaxed opacity-70">
                    Derived from the warrior's WT. Higher Wit means more natural deception in
                    combat. Traits like Cunning or Calculating amplify this further.
                  </p>
                  <p className="text-[9px] leading-relaxed text-yellow-400">
                    Only triggers when WT ≥ 15 and OE ≥ 4.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span
              className={cn(
                'text-sm font-mono font-bold',
                warrior.attributes.WT >= 15 ? 'text-blue-400' : 'text-muted-foreground/40'
              )}
            >
              {plan.feintTendency ?? 0}
            </span>
          </div>
          {warrior.attributes.WT < 15 && (
            <p className="text-[9px] text-yellow-400/70 font-black uppercase tracking-wider">
              ⚠ WT {warrior.attributes.WT} — needs WT ≥ 15 to trigger
            </p>
          )}
          <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                warrior.attributes.WT >= 15 ? 'bg-blue-500/60' : 'bg-white/10'
              )}
              style={{ width: `${((plan.feintTendency ?? 0) / 10) * 100}%` }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            Set by warrior attributes &amp; traits
          </p>
        </div>
      )}

      {/* Range Preference */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Range Preference
        </Label>
        {warrior?.equipment?.weapon && (
          <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-wider">
            Natural: {getWeaponPreferredRange(warrior.equipment.weapon)}
          </p>
        )}
        <div className="grid grid-cols-4 gap-1">
          {DISTANCE_RANGES.map((r) => {
            const isNatural =
              warrior?.equipment?.weapon && getWeaponPreferredRange(warrior.equipment.weapon) === r;
            const isSelected =
              (plan.rangePreference ?? getWeaponPreferredRange(warrior?.equipment?.weapon)) === r;
            return (
              <button
                key={r}
                onClick={() => onPlanChange({ ...plan, rangePreference: r })}
                className={cn(
                  'py-1.5 text-[9px] font-black uppercase tracking-wider border transition-all',
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                    : 'bg-black/40 border-white/10 text-muted-foreground hover:border-white/30'
                )}
                aria-label={'Set preferred distance to ' + r}
              >
                {r}
                {isNatural && (
                  <span className="block text-[7px] text-blue-400/60 normal-case font-normal">
                    natural
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weapon Range Modifier Grid */}
      {warrior?.equipment?.weapon && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Weapon ATT Modifiers
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {DISTANCE_RANGES.map((r) => {
              const mod = getWeaponRangeMod(warrior.equipment?.weapon, r);
              return (
                <div key={r} className="bg-black/40 border border-white/5 p-2 text-center">
                  <div className="text-[8px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                    {r}
                  </div>
                  <div
                    className={cn(
                      'text-xs font-mono font-black',
                      mod > 0
                        ? 'text-green-400'
                        : mod < 0
                          ? 'text-red-400'
                          : 'text-muted-foreground/40'
                    )}
                  >
                    {mod > 0 ? '+' : ''}
                    {mod}
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
