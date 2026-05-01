import { Shield, Activity, Eye, Zap, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WarriorRadarChart } from '@/components/charts/WarriorRadarChart';
import { FormSparkline } from '@/components/charts/FormSparkline';
import { FavoritesCard } from '@/components/warrior/FavoritesCard';
import { AttrBar, SkillBar, WarriorStatementsPanel } from '@/components/warrior/WarriorStats';
import { overallGrowthNarrative } from '@/components/warrior/GrowthHelpers';
import { Warrior } from '@/types/game';
import { Surface } from '@/components/ui/Surface';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';

interface BiometricsTabProps {
  warrior: Warrior;
  displayWarrior: import('@/types/game').Warrior;
}

export function BiometricsTab({ warrior, displayWarrior }: BiometricsTabProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 space-y-8">
        <SectionDivider label="Physical Geometry" />
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="p-8">
            <WarriorRadarChart warrior={warrior} />
            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.3em]">
                  Historical Form
                </span>
                <FormSparkline warriorId={warrior.id} />
              </div>
              <Separator className="bg-white/5" />
              <div className="pt-2 flex items-start gap-3">
                <TrendingUp className="h-4 w-4 text-primary mt-1 shrink-0" />
                <p className="text-[11px] font-medium text-muted-foreground/80 italic leading-relaxed">
                  {overallGrowthNarrative(warrior)}
                </p>
              </div>
            </div>
          </div>
        </Surface>

        <SectionDivider label="Cognitive Imprint" />
        <FavoritesCard warrior={warrior} onUpdate={() => {}} />
      </div>

      <div className="lg:col-span-8 space-y-8">
        <SectionDivider label="Metric Analysis" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Surface variant="glass" className="border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <ImperialRing size="xs" variant="silver">
                <Activity className="h-3 w-3 text-muted-foreground" />
              </ImperialRing>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                Primary Vitals
              </span>
            </div>
            <div className="p-8 space-y-6">
              <AttrBar
                label="Strength"
                value={warrior.attributes.ST}
                potential={warrior.potential?.ST}
              />
              <AttrBar
                label="Constitution"
                value={warrior.attributes.CN}
                potential={warrior.potential?.CN}
              />
              <AttrBar
                label="Deftness"
                value={warrior.attributes.DF}
                potential={warrior.potential?.DF}
              />
              <AttrBar
                label="Speed"
                value={warrior.attributes.SP}
                potential={warrior.potential?.SP}
              />
              <AttrBar
                label="Size"
                value={warrior.attributes.SZ}
                potential={warrior.potential?.SZ}
              />
            </div>
          </Surface>

          <Surface variant="glass" className="border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <ImperialRing size="xs" variant="bronze">
                <Eye className="h-3 w-3 text-muted-foreground" />
              </ImperialRing>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                Registry Observation
              </span>
            </div>
            <div className="p-8 overflow-y-auto max-h-96 thin-scrollbar">
              <WarriorStatementsPanel warrior={warrior} />
            </div>
          </Surface>
        </div>

        <SectionDivider label="Specialized Disciplines" />
        <Surface variant="glass" className="border-white/5 overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
              {displayWarrior.baseSkills &&
                Object.entries(displayWarrior.baseSkills).map(([skill, val]) => (
                  <SkillBar key={skill} label={skill.toUpperCase()} value={val as number} />
                ))}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
