import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Shield, Swords, Battery, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FightingStyle, STYLE_DISPLAY_NAMES, STYLE_ABBREV } from '@/types/game';
import { computeWarriorStats } from '@/engine/skillCalc';

export default function PhysicalsSimulator() {
  const { roster } = useGameStore();
  const activeWarriors = roster.filter(w => w.status === "Active");

  const [styleA, setStyleA] = useState<FightingStyle>(FightingStyle.BashingAttack);
  const [styleB, setStyleB] = useState<FightingStyle>(FightingStyle.ParryRiposte);

  const [statsA, setStatsA] = useState({ strength: 10, quickness: 10, vitality: 10 });
  const [statsB, setStatsB] = useState({ strength: 10, quickness: 10, vitality: 10 });

  const [fighterAId, setFighterAId] = useState<string | null>(null);
  const [fighterBId, setFighterBId] = useState<string | null>(null);

  const handleSelectWarrior = (warrior: Warrior) => {
    // Toggle logic: first select fills A, second fills B if A is full
    if (fighterAId === warrior.id) {
       setFighterAId(null);
    } else if (fighterBId === warrior.id) {
       setFighterBId(null);
    } else if (!fighterAId) {
       setFighterAId(warrior.id);
       setStatsA({ strength: warrior.attributes.ST, quickness: warrior.attributes.SP, vitality: warrior.attributes.CN });
       setStyleA(warrior.style);
    } else {
       setFighterBId(warrior.id);
       setStatsB({ strength: warrior.attributes.ST, quickness: warrior.attributes.SP, vitality: warrior.attributes.CN });
       setStyleB(warrior.style);
    }
  };

  const simulation = useMemo(() => {
    const attrA = { ST: statsA.strength, SP: statsA.quickness, CN: statsA.vitality, SZ: 10, WL: 10, WT: 10, DF: 10 };
    const attrB = { ST: statsB.strength, SP: statsB.quickness, CN: statsB.vitality, SZ: 10, WL: 10, WT: 10, DF: 10 };

    const resultA = computeWarriorStats(attrA, styleA);
    const resultB = computeWarriorStats(attrB, styleB);

    const calcA = resultA.derivedStats;
    const calcB = resultB.derivedStats;

    let endA = calcA.endurance;
    let endB = calcB.endurance;
    let hpA = calcA.hp;
    let hpB = calcB.hp;

    let minutesPassed = 0;
    while (minutesPassed < 10 && endA > 0 && endB > 0 && hpA > 0 && hpB > 0) {
      minutesPassed++;
      const dmgA = Math.max(1, calcA.damage);
      hpB -= dmgA;
      endA -= 10;
      endB -= 5;

      if (hpB > 0) {
        const dmgB = Math.max(1, calcB.damage);
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

  const renderFighterConfig = (label: string, style: FightingStyle, setStyle: (s: any) => void, stats: any, setStats: (s: any) => void, colorClass: string) => (
    <Card>
      <CardHeader className="pb-4 border-b border-border">
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
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <PageHeader
        icon={Activity}
        title="Physicals Simulator"
        subtitle="TOOLS · SIMULATION · NO RECORDS KEPT"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Archetype D: Left Rail Roster Pickers (span-3) */}
        <aside className="lg:col-span-3 space-y-6 sticky top-6">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">DEPLOY PILOTS</span>
          </div>

          <Surface variant="glass" className="p-0 border-white/5 max-h-[600px] overflow-y-auto thin-scrollbar">
            {activeWarriors.map(warrior => {
              const inA = fighterAId === warrior.id;
              const inB = fighterBId === warrior.id;
              
              return (
                <button
                  key={warrior.id}
                  onClick={() => handleSelectWarrior(warrior)}
                  className={cn(
                    "w-full text-left p-4 border-b border-white/5 last:border-0 flex items-center gap-3 transition-all",
                    inA ? "bg-primary/10 border-l-4 border-l-primary" : inB ? "bg-destructive/10 border-l-4 border-l-destructive" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-black uppercase truncate", inA ? "text-primary" : inB ? "text-destructive" : "")}>{warrior.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase mt-1">{STYLE_ABBREV[warrior.style] ?? warrior.style}</p>
                  </div>
                  {inA && <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black h-4 px-1">PILOT_A</Badge>}
                  {inB && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[8px] font-black h-4 px-1">PILOT_B</Badge>}
                </button>
              );
            })}
          </Surface>

          <div className="p-4 bg-secondary/10 border border-white/5">
             <p className="text-[10px] text-muted-foreground leading-relaxed italic">
               "Calculated risk is the bridge between a legend and a corpse. Run the numbers before you run the sand."
             </p>
          </div>
        </aside>

        {/* Right Rail Simulation Canvas (span-9) */}
        <main className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFighterConfig("Fighter A", styleA, setStyleA, statsA, setStatsA, "primary")}
            {renderFighterConfig("Fighter B", styleB, setStyleB, statsB, setStatsB, "destructive")}
          </div>

          <Surface variant="glass" className="border-accent/40 bg-accent/5 p-0 overflow-hidden">
            <div className="bg-accent/10 px-6 py-4 border-b border-accent/20 flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">SIMULATION RESULTS (10 MINUTES ENGAGEMENT)</span>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Fighter A Analysis</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">HP</div>
                      <div className="font-mono font-black text-lg">{simulation.calcA.hp}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">ENDUR</div>
                      <div className="font-mono font-black text-lg">{simulation.calcA.endurance}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">DMG</div>
                      <div className="font-mono font-black text-lg">{simulation.calcA.damage}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">ENCUM</div>
                      <div className="font-mono font-black text-lg">{simulation.calcA.encumbrance}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-6">
                  <Swords className="h-10 w-10 text-muted-foreground/20" />
                  <div className="text-center">
                    <span className="text-2xl font-display font-black text-foreground">{simulation.minutesPassed}M</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">ELAPSED TIME</p>
                  </div>
                  {simulation.minutesPassed < 10 && (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[9px] font-black uppercase h-6 px-3">
                      <AlertTriangle className="h-3 w-3 mr-1.5" /> Early_Stoppage
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-destructive border-b border-destructive/20 pb-2">Fighter B Analysis</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">HP</div>
                      <div className="font-mono font-black text-lg">{simulation.calcB.hp}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">ENDUR</div>
                      <div className="font-mono font-black text-lg">{simulation.calcB.endurance}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">DMG</div>
                      <div className="font-mono font-black text-lg">{simulation.calcB.damage}</div>
                    </div>
                    <div className="bg-black/20 p-3 border border-white/5">
                      <div className="text-muted-foreground text-[8px] uppercase font-black">ENCUM</div>
                      <div className="font-mono font-black text-lg">{simulation.calcB.encumbrance}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Ending HP</span>
                    <span className={cn("font-display font-black text-xl", simulation.hpA <= 0 ? "text-destructive" : "text-primary")}>
                      {simulation.hpA}/{simulation.calcA.hp}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-none overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(0, (simulation.hpA / simulation.calcA.hp) * 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Ending HP</span>
                    <span className={cn("font-display font-black text-xl", simulation.hpB <= 0 ? "text-destructive" : "text-primary")}>
                      {simulation.hpB}/{simulation.calcB.hp}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-none overflow-hidden">
                    <div className="h-full bg-destructive" style={{ width: `${Math.max(0, (simulation.hpB / simulation.calcB.hp) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </main>
      </div>
    </div>
  );
}
