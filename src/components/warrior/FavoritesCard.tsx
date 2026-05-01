import React, { useMemo } from 'react';
import { Eye, Lightbulb, Swords, Zap, Activity, Download } from 'lucide-react';
import { useGameStore, useWorldState } from '@/state/useGameStore';
import { type Warrior } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFavoritesDisplay } from '@/components/warrior/favoritesDisplay';
import { applyInsightToken } from '@/engine/favorites';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';

export function FavoritesCard({ warrior, onUpdate }: { warrior: Warrior; onUpdate: () => void }) {
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);
  const favDisplay = getFavoritesDisplay(warrior);

  const isWeaponDiscovered = !!warrior.favorites?.discovered.weapon;
  const isRhythmDiscovered = !!warrior.favorites?.discovered.rhythm;

  const weaponHints = warrior.favorites?.discovered.weaponHints ?? 0;
  const rhythmHints = warrior.favorites?.discovered.rhythmHints ?? 0;

  const weaponProgress = isWeaponDiscovered ? 100 : (weaponHints / 2) * 100;
  const rhythmProgress = isRhythmDiscovered ? 100 : (rhythmHints / 2) * 100;

  const handleInsight = (type: 'weapon' | 'rhythm') => {
    const msg = applyInsightToken(warrior, type);
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w?.favorites) w.favorites = warrior.favorites;
    });
    toast.success(msg);
    onUpdate();
  };

  const handleApplyRhythm = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.rhythm) return;
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w && fav?.rhythm) {
        if (!w.plan) w.plan = { style: w.style, OE: fav.rhythm.oe, AL: fav.rhythm.al };
        else {
          w.plan.OE = fav.rhythm.oe;
          w.plan.AL = fav.rhythm.al;
        }
      }
    });
    toast.success(
      `Cognitive Alignment Confirmed: OE ${fav.rhythm.oe} / AL ${fav.rhythm.al} synchronized.`
    );
    onUpdate();
  };

  const handleEquipFavoriteWeapon = () => {
    const fav = warrior.favorites;
    if (!fav?.discovered.weapon) return;
    setState((s) => {
      const w = s.roster.find((x) => x.id === warrior.id);
      if (w) {
        if (!w.equipment)
          w.equipment = {
            weapon: fav.weaponId,
            armor: 'none_armor',
            shield: 'none_shield',
            helm: 'none_helm',
          };
        else w.equipment.weapon = fav.weaponId;
      }
    });
    const weaponName = favDisplay.weapon ?? fav.weaponId;
    toast.success(`Biological Lock: ${weaponName} equipped.`);
    onUpdate();
  };

  if (!warrior.favorites) return null;

  return (
    <Surface variant="glass" className="border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
        <ImperialRing size="xs" variant="gold">
          <Zap className="h-3 w-3 text-arena-gold" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
          Synaptic Mapping
        </span>
      </div>

      <div className="p-8 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
              <Swords className="h-3 w-3" /> Materiel Affinity
            </div>
            {isWeaponDiscovered && (
              <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
                DISCOVERED
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isWeaponDiscovered ? (
                <div className="space-y-1">
                  <div className="text-sm font-display font-black uppercase">
                    {favDisplay.weapon}
                  </div>
                  <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                    Operational Bonus: +2 ACC / +1 DMG
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-black italic">
                  {weaponHints > 0 ? favDisplay.weaponHint : 'Pattern Unrecognized'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isWeaponDiscovered && warrior.equipment?.weapon !== warrior.favorites?.weaponId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEquipFavoriteWeapon}
                  className="h-8 px-4 border-arena-gold/20 hover:bg-arena-gold/10 text-arena-gold text-[9px] font-black uppercase rounded-none tracking-widest"
                >
                  Deploy
                </Button>
              )}
              {!isWeaponDiscovered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsight('weapon')}
                  className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 rounded-none"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000',
                isWeaponDiscovered
                  ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]'
                  : 'bg-white/10'
              )}
              style={{ width: `${weaponProgress}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
              <Activity className="h-3 w-3" /> Bio-Rhythm
            </div>
            {isRhythmDiscovered && (
              <span className="text-[8px] font-black uppercase text-arena-gold tracking-widest px-2 py-0.5 border border-arena-gold/20 bg-arena-gold/5">
                OPTIMIZED
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {isRhythmDiscovered ? (
                <div className="space-y-1">
                  <div className="text-sm font-display font-black uppercase">
                    {favDisplay.rhythm}
                  </div>
                  <div className="text-[9px] font-black text-arena-gold uppercase tracking-widest">
                    Tactical Bonus: +2 INI / +2 DEF
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground/40 uppercase tracking-widest font-black italic">
                  {rhythmHints > 0 ? favDisplay.rhythmHint : 'Rhythm Classified'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isRhythmDiscovered &&
                (() => {
                  const fav = warrior.favorites;
                  if (!fav) return null;
                  const plan = warrior.plan;
                  const alreadyApplied =
                    plan && plan.OE === fav.rhythm.oe && plan.AL === fav.rhythm.al;
                  return !alreadyApplied ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyRhythm}
                      className="h-8 px-4 border-arena-gold/20 hover:bg-arena-gold/10 text-arena-gold text-[9px] font-black uppercase rounded-none tracking-widest"
                    >
                      Sync
                    </Button>
                  ) : (
                    <span className="text-[8px] font-black uppercase text-primary tracking-widest px-2 py-0.5 border border-primary/20 bg-primary/5">
                      ACTIVE
                    </span>
                  );
                })()}
              {!isRhythmDiscovered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsight('rhythm')}
                  className="h-8 w-8 p-0 border-white/10 hover:bg-white/5 rounded-none"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-1000',
                isRhythmDiscovered
                  ? 'bg-arena-gold shadow-[0_0_8px_rgba(255,184,0,0.4)]'
                  : 'bg-white/10'
              )}
              style={{ width: `${rhythmProgress}%` }}
            />
          </div>
        </div>
      </div>
    </Surface>
  );
}
