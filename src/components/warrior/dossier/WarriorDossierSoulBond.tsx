import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Swords, Activity } from 'lucide-react';
import type { Warrior } from '@/types/warrior.types';
import { getFavoritesDisplay } from '@/components/warrior/favoritesDisplay';

interface WarriorDossierSoulBondProps {
  warrior: Warrior;
}

export function WarriorDossierSoulBond({ warrior }: WarriorDossierSoulBondProps) {
  const favDisplay = getFavoritesDisplay(warrior);

  return (
    <Card className="bg-glass/5 border-arena-gold/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] uppercase tracking-widest text-arena-gold font-black flex items-center gap-2">
          <Zap className="h-3 w-3 fill-arena-gold" /> Soul_Bond & Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <div className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-tighter">
            <Swords className="h-3 w-3" /> Weapon Preference
          </div>
          {warrior.favorites?.discovered.weapon ? (
            <div className="flex items-center justify-between p-2 rounded bg-arena-gold/5 border border-arena-gold/20">
              <span>{favDisplay.weapon}</span>
              <Badge className="bg-arena-gold text-black font-black text-[8px] h-4 px-1">
                MASTERY ✨
              </Badge>
            </div>
          ) : warrior.favorites?.discovered.weaponHints ? (
            <div className="p-2 rounded bg-white/5 border border-white/10 opacity-60">
              <span className="text-xs font-medium italic text-muted-foreground">
                {favDisplay.weaponHint}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground/40 italic px-2">
              Unknown Preference
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1.5 tracking-tighter">
            <Activity className="h-3 w-3" /> Natural Rhythm
          </div>
          {warrior.favorites?.discovered.rhythm ? (
            <div className="flex items-center justify-between p-2 rounded bg-arena-gold/5 border border-arena-gold/20">
              <span>{favDisplay.rhythm}</span>
              <Badge className="bg-arena-gold text-black font-black text-[8px] h-4 px-1">
                SYNERGY ✨
              </Badge>
            </div>
          ) : warrior.favorites?.discovered.rhythmHints ? (
            <div className="p-2 rounded bg-white/5 border border-white/10 animate-pulse">
              <span className="text-xs font-bold text-arena-gold/40 uppercase tracking-widest blur-[1px]">
                {favDisplay.rhythmHint}
              </span>
              <span className="ml-2 text-[8px] font-black text-arena-gold/60 uppercase">
                Emerging...
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground/40 italic px-2">Unknown Rhythm</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
