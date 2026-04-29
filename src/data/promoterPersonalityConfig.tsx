import React from 'react';
import { Award, AlertTriangle, Building2, DollarSign, Zap } from 'lucide-react';
import type { PromoterPersonality } from '@/types/state.types';

export interface PersonalityEntry {
  color: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  desc: string;
  tooltip: string;
}

export const PERSONALITY_CONFIG: Record<PromoterPersonality, PersonalityEntry> = {
  Greedy: {
    color: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    icon: <DollarSign className="h-4 w-4" />,
    label: 'Greedy',
    description: 'High purses (+15%), reduced hype (-10%)',
    desc: '+15% purse · −10% hype',
    tooltip: 'Greedy: +15% purse · −10% hype · prefers mismatches (best for money)',
  },
  Honorable: {
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    icon: <Award className="h-4 w-4" />,
    label: 'Honorable',
    description: 'Fair matchups, increased hype (+10%)',
    desc: '+10% hype · parity fights',
    tooltip:
      'Honorable: +10% hype · baseline purse · prefers tight skill parity <10% gap (best for fame)',
  },
  Sadistic: {
    color: 'bg-red-500/20 text-red-600 border-red-500/30',
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Sadistic',
    description: 'High-kill matchups, injury-risk bonus (+25% hype)',
    desc: '+20% hype & purse · high danger',
    tooltip:
      'Sadistic: +20% hype & +20% purse on risky fights · seeks high-kill/injury matchups (high drama)',
  },
  Flashy: {
    color: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    icon: <Zap className="h-4 w-4" />,
    label: 'Flashy',
    description: 'Fame-focused, showy style bonus (+15% hype)',
    desc: '+15% hype · +20% purse (fame>75)',
    tooltip:
      'Flashy: +15% hype · +20% purse for high-fame warriors (best for rising stars)',
  },
  Corporate: {
    color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    icon: <Building2 className="h-4 w-4" />,
    label: 'Corporate',
    description: 'Stable, predictable matchups (+5% purse)',
    desc: 'Balanced · −5% kill risk',
    tooltip: 'Corporate: stable matchups · −5% kill risk · +5% purse (reliable income)',
  },
};
