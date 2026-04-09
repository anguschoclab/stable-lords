import React, { useState, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/shared.types";
import { generateRecommendations, getStyleEquipmentTips } from "@/engine/equipmentOptimizer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Swords, Star, AlertTriangle, Lightbulb, Shirt, HardHat, Zap, Package } from "lucide-react";
import { checkWeaponRequirements } from "@/data/equipment";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";

export default function StableEquipment() {
  const { roster, updateWarriorEquipment } = useGameStore();
  const activeWarriors = roster.filter(w => w.status === "Active");
  
  const [selectedStyle, setSelectedStyle] = useState<FightingStyle>(
    activeWarriors[0]?.style ?? FightingStyle.StrikingAttack
  );
  const [targetWarriorId, setTargetWarriorId] = useState<string>(
    activeWarriors.find(w => w.style === selectedStyle)?.id ?? ""
  );

  const carryCap = 12;
  const recs = useMemo(() => generateRecommendations(selectedStyle, carryCap), [selectedStyle]);
  const tips = useMemo(() => getStyleEquipmentTips(selectedStyle), [selectedStyle]);

  const targetWarrior = useMemo(() => activeWarriors.find(w => w.id === targetWarriorId), [activeWarriors, targetWarriorId]);

  const handleApply = (loadout: any, label: string) => {
    if (!targetWarriorId) {
      toast.error("Select a warrior first");
      return;
    }
    updateWarriorEquipment(targetWarriorId, loadout);
    toast.success(`Applied ${label} loadout to ${targetWarrior?.name}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="THE_ARMORY"
        subtitle="Manage specialized loadouts and tactical equipment synergies for your roster."
        icon={Shield}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Style & Tips */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Tactical Style
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold opacity-60">Optimize gear for specific methodologies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Selection_Matrix</label>
                <Select value={selectedStyle} onValueChange={(v) => {
                  setSelectedStyle(v as FightingStyle);
                  const firstMatch = activeWarriors.find(w => w.style === v);
                  if (firstMatch) setTargetWarriorId(firstMatch.id);
                }}>
                  <SelectTrigger className="h-12 bg-secondary/20 border-border/40 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STYLE_DISPLAY_NAMES).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="font-bold">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tips.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-accent tracking-widest">
                    <Lightbulb className="h-3.5 w-3.5" /> Style Intelligence
                  </div>
                  <ul className="space-y-2">
                    {tips.map((tip, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-glass-card border-border/10">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 text-arena-gold" /> Style Champions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeWarriors.filter(w => w.style === selectedStyle).map(w => (
                  <Button
                    key={w.id}
                    variant={targetWarriorId === w.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-12 gap-3 transition-all",
                      targetWarriorId === w.id ? "bg-primary/10 border-primary/20" : "opacity-60 grayscale hover:grayscale-0"
                    )}
                    onClick={() => setTargetWarriorId(w.id)}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black uppercase tracking-tight">{w.name}</span>
                      <span className="text-[9px] font-mono opacity-50">Fame: {w.fame}</span>
                    </div>
                  </Button>
                ))}
                {activeWarriors.filter(w => w.style === selectedStyle).length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-border/20 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No_Active_Operatives</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recs.map((rec, i) => {
              const reqCheck = targetWarrior && rec.loadout.weapon 
                ? checkWeaponRequirements(rec.loadout.weapon, targetWarrior.attributes) 
                : null;
              
              return (
                <Card key={i} className={cn(
                  "bg-glass-card transition-all group overflow-hidden",
                  i === 0 ? "border-primary/40 shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.3)]" : "border-border/10 hover:border-primary/20"
                )}>
                  <CardHeader className="relative">
                     <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase text-[9px] tracking-widest">
                           {rec.synergy}% Synergy
                        </Badge>
                        {i === 0 && <Badge className="bg-arena-gold text-black font-black uppercase text-[9px] tracking-widest">Primary_Rec</Badge>}
                     </div>
                     <CardTitle className="font-display text-lg uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {rec.label}
                     </CardTitle>
                     <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <GearItem icon={Swords} name={rec.breakdown.weapon.item.name} weight={rec.breakdown.weapon.item.weight} error={reqCheck && !reqCheck.met} />
                      <GearItem icon={Shirt} name={rec.breakdown.armor.item.name} weight={rec.breakdown.armor.item.weight} />
                      <GearItem 
                        icon={Shield} 
                        name={rec.breakdown.shield.item.name} 
                        weight={rec.breakdown.shield.item.weight} 
                        blocked={rec.breakdown.shield.blocked}
                      />
                      <GearItem icon={HardHat} name={rec.breakdown.helm.item.name} weight={rec.breakdown.helm.item.weight} />
                    </div>

                    {reqCheck && !reqCheck.met && (
                      <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-destructive tracking-widest">
                          <AlertTriangle className="h-3.5 w-3.5" /> Requirement_Mismatch
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {reqCheck.failures.map((f: any, fi: number) => (
                            <Badge key={fi} variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive">
                              {f.stat}: {f.current}/{f.required}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border/10">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-1">
                        <span className="text-muted-foreground/60">Loadout Encumbrance</span>
                        <span className={cn("font-mono font-bold", rec.totalWeight > carryCap ? "text-destructive" : "text-primary")}>
                          {rec.totalWeight} / {carryCap}
                        </span>
                      </div>
                      <Progress value={Math.min(100, (rec.totalWeight / carryCap) * 100)} className={cn("h-1.5 bg-secondary/20", rec.totalWeight > carryCap ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")} />
                    </div>

                    <Button 
                      className="w-full h-11 border-primary/20 font-black uppercase text-[11px] tracking-[0.2em] shadow-lg group-hover:shadow-primary/20 transition-all"
                      variant={i === 0 ? "default" : "secondary"}
                      onClick={() => handleApply(rec.loadout, rec.label)}
                      disabled={!targetWarriorId}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Commit_Loadout
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GearItem({ icon: Icon, name, weight, error, blocked }: { icon: any, name: string, weight: number, error?: boolean, blocked?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10 border border-transparent hover:border-border/20 transition-all">
      <div className={cn("p-1.5 rounded-md", error ? "bg-destructive/10 text-destructive" : "bg-primary/5 text-primary/60")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className={cn("text-xs font-black uppercase tracking-tight", error ? "text-destructive" : blocked ? "text-muted-foreground/40 line-through" : "text-foreground/80")}>
          {name} {blocked && "(Blocked by 2H)"}
        </div>
      </div>
      <Badge variant="outline" className="font-mono text-[9px] opacity-40">+{weight} E</Badge>
    </div>
  );
}
