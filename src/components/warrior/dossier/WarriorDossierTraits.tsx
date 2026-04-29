import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { Warrior } from '@/types/warrior.types';

interface WarriorDossierTraitsProps {
  warrior: Warrior;
}

export function WarriorDossierTraits({ warrior }: WarriorDossierTraitsProps) {
  if (!warrior.origin && (!warrior.traits || warrior.traits.length === 0)) {
    return null;
  }

  return (
    <div className="p-3 bg-white/5 border border-white/5 rounded-none space-y-3">
      {warrior.traits && warrior.traits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {warrior.traits.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-[9px] font-black uppercase tracking-widest bg-arena-gold/10 text-arena-gold border-arena-gold/20"
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
      {warrior.origin && (
        <p className="text-[11px] font-medium text-muted-foreground/90 uppercase tracking-wider leading-tight">
          {warrior.origin}
        </p>
      )}
      {warrior.lore && (
        <p className="text-xs text-muted-foreground/60 italic leading-relaxed border-l border-white/10 pl-3">
          "{warrior.lore}"
        </p>
      )}
    </div>
  );
}
