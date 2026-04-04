import React from "react";
import { Shield, Activity, Eye, Zap, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WarriorRadarChart } from "@/components/charts/WarriorRadarChart";
import { FormSparkline } from "@/components/charts/FormSparkline";
import { FavoritesCard } from "@/components/warrior/FavoritesCard";
import { AttrBar, SkillBar, WarriorStatementsPanel } from "@/components/warrior/WarriorStats";
import { overallGrowthNarrative } from "@/components/warrior/GrowthHelpers";
import { Warrior } from "@/types/game";

interface BiometricsTabProps {
  warrior: Warrior;
  displayWarrior: any;
}

export function BiometricsTab({ warrior, displayWarrior }: BiometricsTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-glass-card border-neon border overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-secondary/10">
            <CardTitle className="font-display font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Physical Polygon
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <WarriorRadarChart warrior={warrior} />
            <div className="mt-8 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Recent Form</span>
                  <FormSparkline warriorId={warrior.id} />
               </div>
               <Separator className="opacity-40" />
               <div className="pt-2 text-xs flex items-start gap-2">
                 <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                 <p className="text-muted-foreground italic leading-relaxed">{overallGrowthNarrative(warrior)}</p>
               </div>
            </div>
          </CardContent>
        </Card>
        <FavoritesCard warrior={warrior} onUpdate={() => {}} />
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-glass-card border-border/40 border">
            <CardHeader className="pb-3 bg-secondary/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" /> Physical Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              <AttrBar label="Strength" value={warrior.attributes.ST} potential={warrior.potential?.ST} />
              <AttrBar label="Constitution" value={warrior.attributes.CN} potential={warrior.potential?.CN} />
              <AttrBar label="Deftness" value={warrior.attributes.DF} potential={warrior.potential?.DF} />
              <AttrBar label="Speed" value={warrior.attributes.SP} potential={warrior.potential?.SP} />
              <AttrBar label="Size" value={warrior.attributes.SZ} potential={warrior.potential?.SZ} />
            </CardContent>
          </Card>

          <Card className="bg-glass-card border-border/40 border">
            <CardHeader className="pb-3 bg-secondary/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Coach's Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto max-h-80 no-scrollbar">
              <WarriorStatementsPanel warrior={warrior} />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-glass-card border-border/40 border overflow-hidden">
           <div className="p-6 bg-gradient-to-r from-secondary/20 to-transparent">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-arena-gold" /> Skillset Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                {displayWarrior.baseSkills && Object.entries(displayWarrior.baseSkills).map(([skill, val]) => (
                  <SkillBar key={skill} label={skill.toUpperCase()} value={val as number} />
                ))}
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
