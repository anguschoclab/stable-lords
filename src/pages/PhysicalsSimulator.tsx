import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Shield, Swords, Battery, AlertTriangle } from 'lucide-react';
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

export default function PhysicalsSimulator() {
  const [styleA, setStyleA] = useState<FightingStyle>("Bash Artist");
  const [styleB, setStyleB] = useState<FightingStyle>("Parry Riposte");

  const [statsA, setStatsA] = useState({ strength: 10, quickness: 10, vitality: 10 });
  const [statsB, setStatsB] = useState({ strength: 10, quickness: 10, vitality: 10 });

  // Simulate 10 minutes of intense combat (10 exchanges, 2 actions per minute each)
  const simulation = useMemo(() => {
    // Generate mock warriors for calculation
    const wA = { id: 'A', name: 'Fighter A', style: styleA, attr: statsA, career: { wins: 0, losses: 0, kills: 0 }, skills: { [styleA]: 20 }, fame: 10, tags: [], status: 'Active', popularAppeal: 10, birthWeek: 1, potential: 100, injuries: [], contractCost: 10 };
    const wB = { id: 'B', name: 'Fighter B', style: styleB, attr: statsB, career: { wins: 0, losses: 0, kills: 0 }, skills: { [styleB]: 20 }, fame: 10, tags: [], status: 'Active', popularAppeal: 10, birthWeek: 1, potential: 100, injuries: [], contractCost: 10 };

    const calcA = computeWarriorStats(wA as any);
    const calcB = computeWarriorStats(wB as any);

    let endA = calcA.endurance;
    let endB = calcB.endurance;
    let hpA = calcA.hp;
    let hpB = calcB.hp;

    // Simulate generic exchanges
    let minutesPassed = 0;
    while (minutesPassed < 10 && endA > 0 && endB > 0 && hpA > 0 && hpB > 0) {
      minutesPassed++;
      // A attacks B
      const dmgA = Math.max(1, calcA.damage - Math.floor(calcB.damageTake / 2));
      hpB -= dmgA;
      endA -= 10; // attack cost
      endB -= 5; // defend cost

      // B attacks A
      if (hpB > 0) {
        const dmgB = Math.max(1, calcB.damage - Math.floor(calcA.damageTake / 2));
        hpA -= dmgB;
        endB -= 10;
        endA -= 5;
      }
    }

    return {
      calcA, calcB,
      endA, endB, hpA, hpB,
      minutesPassed
    };
  }, [styleA, styleB, statsA, statsB]);

  const renderFighterConfig = (label: string, style: FightingStyle, setStyle: any, stats: any, setStats: any, colorClass: string) => (
    <Card className={`border-${colorClass}/40`}>
      <CardHeader className={`bg-${colorClass}/5 pb-4 border-b border-border`}>
        <CardTitle className="font-display text-lg flex items-center justify-between">
          {label}
          <Select value={style} onValueChange={(v) => setStyle(v as FightingStyle)}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STYLE_DISPLAY_NAMES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v} ({STYLE_ABBREV[k as FightingStyle]})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="capitalize text-xs text-muted-foreground">{key}</Label>
              <span className="text-xs font-mono">{value as number}</span>
            </div>
            <Slider
              value={[value as number]}
              min={1} max={30} step={1}
              onValueChange={([v]) => setStats({ ...stats, [key]: v })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Physicals Simulator
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Test attribute distributions against different styles to project endurance burn and damage exchange over 10 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFighterConfig("Fighter A", styleA, setStyleA, statsA, setStatsA, "primary")}
        {renderFighterConfig("Fighter B", styleB, setStyleB, statsB, setStatsB, "destructive")}
      </div>

      <Card className="border-accent/40 bg-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" /> Simulation Results (10 Minutes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-primary">Fighter A Base Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">HP</div>
                  <div className="font-mono">{simulation.calcA.hp}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Endurance</div>
                  <div className="font-mono">{simulation.calcA.endurance}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Damage</div>
                  <div className="font-mono">{simulation.calcA.damage}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Mitigation</div>
                  <div className="font-mono">{simulation.calcA.damageTake}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <Swords className="h-8 w-8 text-muted-foreground opacity-50" />
              <Badge variant="outline" className="font-mono">
                {simulation.minutesPassed} Minutes Simulated
              </Badge>
              {simulation.minutesPassed < 10 && (
                <div className="text-xs text-destructive flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded">
                  <AlertTriangle className="h-3 w-3" /> Early Stoppage
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-destructive">Fighter B Base Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">HP</div>
                  <div className="font-mono">{simulation.calcB.hp}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Endurance</div>
                  <div className="font-mono">{simulation.calcB.endurance}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Damage</div>
                  <div className="font-mono">{simulation.calcB.damage}</div>
                </div>
                <div className="bg-background p-2 rounded border">
                  <div className="text-muted-foreground text-xs">Mitigation</div>
                  <div className="font-mono">{simulation.calcB.damageTake}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ending HP</span>
                <span className={`font-mono ${simulation.hpA <= 0 ? 'text-destructive font-bold' : ''}`}>
                  {simulation.hpA} / {simulation.calcA.hp}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ending Endurance</span>
                <span className={`font-mono ${simulation.endA <= 0 ? 'text-destructive font-bold' : ''}`}>
                  {simulation.endA} / {simulation.calcA.endurance}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ending HP</span>
                <span className={`font-mono ${simulation.hpB <= 0 ? 'text-destructive font-bold' : ''}`}>
                  {simulation.hpB} / {simulation.calcB.hp}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ending Endurance</span>
                <span className={`font-mono ${simulation.endB <= 0 ? 'text-destructive font-bold' : ''}`}>
                  {simulation.endB} / {simulation.calcB.endurance}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
