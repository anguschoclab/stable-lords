/**
 * Equipment Optimizer Page — recommends gear by fighting style with encumbrance analysis.
 */
import React, { useState, useMemo } from "react";
import { useGameStore } from "@/state/useGameStore";
import { FightingStyle, STYLE_DISPLAY_NAMES } from "@/types/game";
import { generateRecommendations, getStyleEquipmentTips } from "@/engine/equipmentOptimizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Swords, Star, AlertTriangle, Lightbulb, Shirt, HardHat, Zap } from "lucide-react";

function RecommendationCard({ rec, index, activeWarriors, selectedStyle }: { rec: any, index: number, activeWarriors: any[], selectedStyle: any }) {
  const matchingWarriors = activeWarriors.filter((w: any) => w.style === selectedStyle);
  const [targetWarriorId, setTargetWarriorId] = React.useState<string>(matchingWarriors[0]?.id ?? "");
  const { doUpdateEquipment } = useGameStore();

  const handleApply = () => {
    if (!targetWarriorId) return;
    doUpdateEquipment(targetWarriorId, rec.loadout);
    import("sonner").then(({ toast }) => {
       const w = matchingWarriors.find((mw: any) => mw.id === targetWarriorId);
       toast.success(`Applied ${rec.label} to ${w?.name}`);
    });
  };

  return (
    <Card className={index === 0 ? "border-primary/30 glow-primary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {rec.label}
          </span>
          <Badge variant={rec.synergy >= 80 ? "default" : "outline"} className="text-[10px] font-mono">
            {rec.synergy}% synergy
          </Badge>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">{rec.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gear Slots */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium flex-1">{rec.breakdown.weapon.item.name}</span>
            {rec.breakdown.weapon.preferred && <Star className="h-3 w-3 text-arena-gold fill-arena-gold" />}
            <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.weapon.item.weight} enc</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium flex-1">{rec.breakdown.armor.item.name}</span>
            <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.armor.item.weight} enc</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`text-xs font-medium flex-1 ${rec.breakdown.shield.blocked ? "text-muted-foreground line-through" : ""}`}>
              {rec.breakdown.shield.item.name}
            </span>
            {rec.breakdown.shield.blocked && <span className="text-[9px] text-destructive">2H</span>}
            <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.shield.item.weight} enc</Badge>
          </div>
          <div className="flex items-center gap-2">
            <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium flex-1">{rec.breakdown.helm.item.name}</span>
            <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.helm.item.weight} enc</Badge>
          </div>
        </div>

        {/* Encumbrance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total Encumbrance</span>
            <span className={`font-mono font-semibold ${rec.totalWeight > rec.carryCap ? "text-destructive" : ""}`}>
              {rec.totalWeight} / {rec.carryCap}
            </span>
          </div>
          <Progress
            value={Math.min(100, (rec.totalWeight / rec.carryCap) * 100)}
            className={`h-2 ${rec.totalWeight > rec.carryCap ? "[&>div]:bg-destructive" : ""}`}
          />
          {rec.totalWeight > rec.carryCap && (
            <div className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertTriangle className="h-3 w-3" /> Over-encumbered
            </div>
          )}
        </div>

        {/* Apply Actions */}
        {matchingWarriors.length > 0 && (
          <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Select value={targetWarriorId} onValueChange={setTargetWarriorId}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Target warrior..." />
                </SelectTrigger>
                <SelectContent>
                  {matchingWarriors.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 px-3 text-[10px]"
                onClick={handleApply}
                disabled={!targetWarriorId}
              >
                Apply Loadout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EquipmentOptimizerPage() {
  const { state } = useGameStore();
  const activeWarriors = state.roster.filter(w => w.status === "Active");
  const [selectedStyle, setSelectedStyle] = useState<FightingStyle>(
    activeWarriors[0]?.style ?? FightingStyle.StrikingAttack
  );

  const carryCap = 12; // default carry cap for recommendations
  const recs = useMemo(() => generateRecommendations(selectedStyle, carryCap), [selectedStyle]);
  const tips = useMemo(() => getStyleEquipmentTips(selectedStyle), [selectedStyle]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8">
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide">Equipment Optimizer</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Recommended loadouts tailored to each fighting style. Analyze encumbrance tradeoffs and find the optimal gear.
          </p>
        </div>
      </div>

      {/* Style Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Optimize for style:</label>
            <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as FightingStyle)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLE_DISPLAY_NAMES).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeWarriors.filter(w => w.style === selectedStyle).length > 0 && (
              <Badge variant="outline" className="text-xs text-arena-pop border-arena-pop/30">
                {activeWarriors.filter(w => w.style === selectedStyle).length} in roster
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Style Tips */}
      {tips.length > 0 && (
        <Card className="border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" /> {STYLE_DISPLAY_NAMES[selectedStyle]} Equipment Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div className="grid gap-4 sm:grid-cols-2">
        {recs.map((rec, i) => (
          <RecommendationCard
            key={i}
            rec={rec}
            isPrimary={i === 0}
            selectedStyle={selectedStyle}
            activeWarriors={activeWarriors}
            carryCap={carryCap}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ rec, isPrimary, selectedStyle, activeWarriors, carryCap }: { rec: any; isPrimary: boolean; selectedStyle: FightingStyle; activeWarriors: any[]; carryCap: number }) {
  const matchingWarriors = activeWarriors.filter(w => w.style === selectedStyle);
  const [targetWarriorId, setTargetWarriorId] = useState<string>(matchingWarriors[0]?.id ?? "");
  const { doUpdateEquipment } = useGameStore();

  const handleApply = () => {
    if (!targetWarriorId) return;
    doUpdateEquipment(targetWarriorId, rec.loadout);
    import("sonner").then(({ toast }) => {
       const w = matchingWarriors.find(mw => mw.id === targetWarriorId);
       toast.success(`Applied ${rec.label} to ${w?.name}`);
    });
  };

  return (
    <Card className={isPrimary ? "border-primary/30 glow-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {rec.label}
                  </span>
                  <Badge variant={rec.synergy >= 80 ? "default" : "outline"} className="text-[10px] font-mono">
                    {rec.synergy}% synergy
                  </Badge>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">{rec.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gear Slots */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium flex-1">{rec.breakdown.weapon.item.name}</span>
                    {rec.breakdown.weapon.preferred && <Star className="h-3 w-3 text-arena-gold fill-arena-gold" />}
                    <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.weapon.item.weight} enc</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shirt className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium flex-1">{rec.breakdown.armor.item.name}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.armor.item.weight} enc</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`text-xs font-medium flex-1 ${rec.breakdown.shield.blocked ? "text-muted-foreground line-through" : ""}`}>
                      {rec.breakdown.shield.item.name}
                    </span>
                    {rec.breakdown.shield.blocked && <span className="text-[9px] text-destructive">2H</span>}
                    <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.shield.item.weight} enc</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium flex-1">{rec.breakdown.helm.item.name}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{rec.breakdown.helm.item.weight} enc</Badge>
                  </div>
                </div>

                {/* Encumbrance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Encumbrance</span>
                    <span className={`font-mono font-semibold ${rec.totalWeight > carryCap ? "text-destructive" : ""}`}>
                      {rec.totalWeight} / {carryCap}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (rec.totalWeight / carryCap) * 100)}
                    className={`h-2 ${rec.totalWeight > carryCap ? "[&>div]:bg-destructive" : ""}`}
                  />
                  {rec.totalWeight > carryCap && (
                    <div className="flex items-center gap-1 text-[10px] text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Over-encumbered
                    </div>
                  )}
                </div>

                {/* Apply Actions */}
                {matchingWarriors.length > 0 && (
                  <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Select value={targetWarriorId} onValueChange={setTargetWarriorId}>
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Target warrior..." />
                        </SelectTrigger>
                        <SelectContent>
                          {matchingWarriors.map(w => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        className="h-8 px-3 text-[10px]" 
                        onClick={handleApply}
                        disabled={!targetWarriorId}
                      >
                        Apply Loadout
                      </Button>
                    </div>
                  </div>
                )}
      </CardContent>
    </Card>
  );
}
