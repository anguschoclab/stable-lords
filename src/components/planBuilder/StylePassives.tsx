import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Timer, Heart, Gauge, Flame, Activity } from 'lucide-react';
import type { FightPlan, Warrior } from '@/types/game';
import {
  getTempoBonus,
  getStyleAntiSynergy,
  getEnduranceMult,
  getKillMechanic,
  getMastery,
} from '@/engine/stylePassives';

interface StylePassivesProps {
  plan: FightPlan;
  warrior?: Warrior;
}

export default function StylePassives({ plan, warrior }: StylePassivesProps) {
  const [showStylePassives, setShowStylePassives] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-arena-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest text-arena-gold">
            Style Passives
          </span>
        </div>
        <Switch checked={showStylePassives} onCheckedChange={setShowStylePassives} />
      </div>

      {showStylePassives && (
        <div className="bg-black/40 border border-white/5 p-4 space-y-4">
          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Timer className="w-3 h-3" />
              <span>Tempo</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              <div className="bg-white/5 p-2">
                <div className="text-muted-foreground/60 uppercase">Opening</div>
                <div className="font-mono font-bold text-arena-gold">
                  {getTempoBonus(plan.style, 'OPENING') > 0 ? '+' : ''}
                  {getTempoBonus(plan.style, 'OPENING')}
                </div>
              </div>
              <div className="bg-white/5 p-2">
                <div className="text-muted-foreground/60 uppercase">Mid</div>
                <div className="font-mono font-bold text-arena-gold">
                  {getTempoBonus(plan.style, 'MID') > 0 ? '+' : ''}
                  {getTempoBonus(plan.style, 'MID')}
                </div>
              </div>
              <div className="bg-white/5 p-2">
                <div className="text-muted-foreground/60 uppercase">Late</div>
                <div className="font-mono font-bold text-arena-gold">
                  {getTempoBonus(plan.style, 'LATE') > 0 ? '+' : ''}
                  {getTempoBonus(plan.style, 'LATE')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
              <Heart className="w-3 h-3" />
              <span>Endurance Multiplier: {(getEnduranceMult(plan.style) * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* Mastery */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Gauge className="w-3 h-3" />
              <span>Mastery</span>
            </div>
            <div className="flex items-center gap-4 text-[9px]">
              <span className="text-muted-foreground/60">
                Fights: {(warrior?.career?.wins || 0) + (warrior?.career?.losses || 0)}
              </span>
              <Badge className="rounded-none border-none font-black text-[9px] uppercase px-2 py-0.5 bg-arena-gold text-black">
                {getMastery((warrior?.career?.wins || 0) + (warrior?.career?.losses || 0)).tier}
              </Badge>
            </div>
          </div>

          {/* Kill Mechanics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Flame className="w-3 h-3 text-destructive" />
              <span>Kill Mechanics</span>
            </div>
            <div className="bg-white/5 p-3 text-[9px] space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground/60">Kill Bonus</span>
                <span className="font-mono font-bold text-destructive">
                  {(
                    getKillMechanic(plan.style, {
                      phase: 'OPENING',
                      hitsLanded: 0,
                      consecutiveHits: 0,
                      hitLocation: 'body',
                    }).killBonus * 100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground/60">Decisiveness Bonus</span>
                <span className="font-mono font-bold text-arena-gold">
                  +
                  {
                    getKillMechanic(plan.style, {
                      phase: 'OPENING',
                      hitsLanded: 0,
                      consecutiveHits: 0,
                      hitLocation: 'body',
                    }).decBonus
                  }
                </span>
              </div>
              <div className="text-muted-foreground/60 italic mt-2">
                "
                {
                  getKillMechanic(plan.style, {
                    phase: 'OPENING',
                    hitsLanded: 0,
                    consecutiveHits: 0,
                    hitLocation: 'body',
                  }).killNarrative
                }
                "
              </div>
            </div>
          </div>

          {/* Anti-Synergy Warnings */}
          {(plan.offensiveTactic || plan.defensiveTactic) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>Anti-Synergy</span>
              </div>
              <div className="bg-white/5 p-3 text-[9px]">
                {(() => {
                  const antiSynergy = getStyleAntiSynergy(
                    plan.style,
                    plan.offensiveTactic,
                    plan.defensiveTactic
                  );
                  if (antiSynergy.warning) {
                    return (
                      <div className="flex items-start gap-2 text-destructive">
                        <Activity className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{antiSynergy.warning}</span>
                      </div>
                    );
                  }
                  return (
                    <span className="text-muted-foreground/60">
                      No anti-synergy conflicts detected.
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
