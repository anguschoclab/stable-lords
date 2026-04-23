import { useState, useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { generateRecommendations, getStyleEquipmentTips } from '@/engine/equipmentOptimizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Swords,
  Star,
  AlertTriangle,
  Lightbulb,
  Shirt,
  HardHat,
  Zap,
  Package,
  HelpCircle,
} from 'lucide-react';
import { checkWeaponRequirements } from '@/data/equipment';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function StableEquipment() {
  const { roster, updateWarriorEquipment } = useGameStore();
  const activeWarriors = roster.filter((w) => w.status === 'Active');

  const [selectedStyle, setSelectedStyle] = useState<FightingStyle>(
    activeWarriors[0]?.style ?? FightingStyle.StrikingAttack
  );
  const [targetWarriorId, setTargetWarriorId] = useState<string>(
    activeWarriors.find((w) => w.style === selectedStyle)?.id ?? ''
  );

  const carryCap = 12;
  const recs = useMemo(() => generateRecommendations(selectedStyle, carryCap), [selectedStyle]);
  const tips = useMemo(() => getStyleEquipmentTips(selectedStyle), [selectedStyle]);

  const targetWarrior = useMemo(
    () => activeWarriors.find((w) => w.id === targetWarriorId),
    [activeWarriors, targetWarriorId]
  );

  const handleApply = (loadout: any, label: string) => {
    if (!targetWarriorId) {
      toast.error('Select a warrior first');
      return;
    }
    updateWarriorEquipment(targetWarriorId, loadout);
    toast.success(`Applied ${label} loadout to ${targetWarrior?.name}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader title="The Armory" subtitle="OPS · ARMORY · TACTICAL LOADOUTS" icon={Shield} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Style & Tips (span-4) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <Surface variant="glass" className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Package className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Tactical Style
                </span>
                <span className="text-[8px] uppercase font-bold text-muted-foreground/60 tracking-widest mt-0.5">
                  Optimize Methodology
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
                Select Style
              </label>
              <Select
                value={selectedStyle}
                onValueChange={(v) => {
                  setSelectedStyle(v as FightingStyle);
                  const firstMatch = activeWarriors.find((w) => w.style === v);
                  if (firstMatch) setTargetWarriorId(firstMatch.id);
                }}
              >
                <SelectTrigger className="h-10 bg-black/40 border-white/10 font-black text-[10px] uppercase tracking-widest px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-white/10">
                  {Object.entries(STYLE_DISPLAY_NAMES).map(([val, label]) => (
                    <SelectItem
                      key={val}
                      value={val}
                      className="font-black text-[10px] uppercase tracking-widest"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tips.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-arena-gold tracking-[0.3em]">
                  <Lightbulb className="h-3.5 w-3.5" /> Intelligence Feed
                </div>
                <ul className="space-y-3">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2 italic"
                    >
                      <div className="h-1 w-1 bg-arena-gold shrink-0 mt-1.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-start gap-2 p-2.5 bg-white/[0.02]">
                <HelpCircle className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground/40 leading-relaxed italic">
                  Recommendations are based on fighting style and warrior stats.
                </p>
              </div>
            </div>
          </Surface>

          <Surface variant="glass" className="space-y-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 px-1 mb-2">
              <Star className="h-3 w-3 text-arena-gold" /> Style Champions
            </div>
            <div className="space-y-2">
              {activeWarriors
                .filter((w) => w.style === selectedStyle)
                .map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setTargetWarriorId(w.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 border transition-all duration-300',
                      targetWarriorId === w.id
                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          targetWarriorId === w.id ? 'bg-primary animate-pulse' : 'bg-white/20'
                        )}
                      />
                      <div className="flex flex-col items-start min-w-0">
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-widest truncate',
                            targetWarriorId === w.id ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {w.name}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground/60 mt-0.5">
                          FAME: {w.fame}
                        </span>
                      </div>
                    </div>
                    {targetWarriorId === w.id && <Activity className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              {activeWarriors.filter((w) => w.style === selectedStyle).length === 0 && (
                <div className="p-10 text-center border border-dashed border-white/10 opacity-30">
                  <p className="text-[8px] font-black uppercase tracking-widest">No Warriors</p>
                </div>
              )}
            </div>
          </Surface>
        </div>

        {/* Right Column: Recommendations (span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recs.map((rec, i) => {
              const reqCheck =
                targetWarrior && rec.loadout.weapon
                  ? checkWeaponRequirements(rec.loadout.weapon, targetWarrior.attributes)
                  : null;

              return (
                <Surface
                  key={i}
                  padding="none"
                  className={cn(
                    'transition-all group overflow-hidden flex flex-col',
                    i === 0
                      ? 'border-primary/40 shadow-[0_0_50px_-20px_rgba(var(--primary-rgb),0.3)] ring-1 ring-primary/20'
                      : 'border-white/5 hover:border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'p-6 space-y-4 flex-1 flex flex-col',
                      i === 0 ? 'bg-primary/5' : 'bg-black/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/20 font-black uppercase text-[8px] tracking-[0.2em] px-2 py-0 border">
                        {rec.synergy}% SYNERGY
                      </Badge>
                      {i === 0 && (
                        <Badge className="bg-arena-gold text-black font-black uppercase text-[8px] tracking-[0.2em] px-2 py-0 border-none">
                          OPTIMAL PATH
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-black uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">
                        {rec.label}
                      </h3>
                      <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic pr-4">
                        "{rec.description}"
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-white/5">
                      <GearRow
                        icon={Swords}
                        name={rec.breakdown.weapon.item.name}
                        weight={rec.breakdown.weapon.item.weight}
                        error={!!(reqCheck && !reqCheck.met)}
                        high={i === 0}
                      />
                      <GearRow
                        icon={Shirt}
                        name={rec.breakdown.armor.item.name}
                        weight={rec.breakdown.armor.item.weight}
                        high={i === 0}
                      />
                      <GearRow
                        icon={Shield}
                        name={rec.breakdown.shield.item.name}
                        weight={rec.breakdown.shield.item.weight}
                        blocked={rec.breakdown.shield.blocked}
                        high={i === 0}
                      />
                      <GearRow
                        icon={HardHat}
                        name={rec.breakdown.helm.item.name}
                        weight={rec.breakdown.helm.item.weight}
                        high={i === 0}
                      />
                    </div>

                    {reqCheck && !reqCheck.met && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase text-destructive tracking-[0.3em]">
                          <AlertTriangle className="h-3 w-3" /> Stat Requirement Failed
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reqCheck.failures.map((f: any, fi: number) => (
                            <div
                              key={fi}
                              className="text-[9px] font-mono font-black text-destructive/80 uppercase"
                            >
                              {`[${f.stat}: ${f.current} < ${f.required}]`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-6 mt-auto">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] mb-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-muted-foreground/40 italic cursor-help">
                                System Encumbrance
                                <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-[240px] text-[10px] leading-relaxed space-y-1.5 p-3"
                            >
                              <p className="font-black uppercase tracking-wider text-foreground">
                                Encumbrance
                              </p>
                              <p className="text-muted-foreground">
                                Total weight of all equipped gear (weapon + armor + shield + helm).
                                Exceeding a warrior's carry threshold reduces Speed (SP) and
                                increases fatigue per bout.
                              </p>
                              <p className="text-muted-foreground">
                                High-ST warriors tolerate heavier loads. Recommended: keep under{' '}
                                {carryCap} units for balanced fighters.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span
                          className={cn(
                            'font-mono font-black',
                            rec.totalWeight > carryCap ? 'text-destructive' : 'text-primary'
                          )}
                        >
                          {rec.totalWeight} / {carryCap} WT
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (rec.totalWeight / carryCap) * 100)}%`,
                          }}
                          className={cn(
                            'h-full',
                            rec.totalWeight > carryCap
                              ? 'bg-destructive shadow-[0_0_10px_rgba(var(--destructive),0.5)]'
                              : 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]'
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border-t border-white/5">
                    <Button
                      className={cn(
                        'w-full h-12 font-black uppercase text-[10px] tracking-[0.4em] transition-all',
                        i === 0
                          ? 'bg-primary text-black hover:bg-primary/90'
                          : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-foreground'
                      )}
                      onClick={() => handleApply(rec.loadout, rec.label)}
                      disabled={!targetWarriorId}
                    >
                      Apply Loadout
                    </Button>
                  </div>
                </Surface>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GearRow({
  icon: Icon,
  name,
  weight,
  error,
  blocked,
  high,
}: {
  icon: any;
  name: string;
  weight: number;
  error?: boolean;
  blocked?: boolean;
  high?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 transition-all',
        high ? 'bg-white/[0.03]' : 'bg-black/20'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-none',
          error ? 'bg-destructive/20 text-destructive' : 'bg-white/5 text-muted-foreground/40'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-[10px] font-black uppercase tracking-widest truncate',
            error
              ? 'text-destructive'
              : blocked
                ? 'text-muted-foreground/20 line-through'
                : 'text-foreground/70'
          )}
        >
          {name} {blocked && '(CONFLICT)'}
        </div>
      </div>
      <span className="font-mono text-[9px] text-muted-foreground/30">+{weight}E</span>
    </div>
  );
}
