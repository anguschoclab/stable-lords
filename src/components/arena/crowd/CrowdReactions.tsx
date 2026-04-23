import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ArenaTier } from '../ArenaBackground';

export type CrowdState = 'idle' | 'anticipation' | 'cheer' | 'roar' | 'gasp' | 'silence' | 'chant';

interface CrowdReactionsProps {
  tier: ArenaTier;
  state: CrowdState;
  className?: string;
}

export default function CrowdReactions({ tier, state, className }: CrowdReactionsProps) {
  const [currentState, setCurrentState] = useState<CrowdState>('idle');

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  // No crowd for training tier
  if (tier === 'training') return null;

  const density = {
    standard: 12,
    championship: 20,
    grand: 30,
  }[tier];

  const getCrowdAnimation = () => {
    switch (currentState) {
      case 'cheer':
        return 'crowd-cheer';
      case 'roar':
        return 'crowd-cheer';
      case 'gasp':
        return 'crowd-gasp';
      case 'chant':
        return 'crowd-chant';
      default:
        return '';
    }
  };

  const getOpacity = () => {
    switch (currentState) {
      case 'anticipation':
        return 0.3;
      case 'silence':
        return 0.15;
      default:
        return tier === 'grand' ? 0.5 : tier === 'championship' ? 0.4 : 0.25;
    }
  };

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 h-1/4 overflow-hidden pointer-events-none',
        className
      )}
    >
      <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
        {/* Crowd silhouettes */}
        {Array.from({ length: density }).map((_, i) => {
          const x = (i / density) * 100;
          const height = 8 + Math.random() * 10;
          const width = 2 + Math.random() * 2;
          const delay = i * 0.05;

          return (
            <g key={i} className={getCrowdAnimation()} style={{ animationDelay: `${delay}s` }}>
              <path
                d={`M${x} 25 L${x} ${25 - height} Q${x + width / 2} ${25 - height - 2} ${x + width} ${25 - height} L${x + width} 25 Z`}
                fill="rgba(0,0,0,0.7)"
                opacity={getOpacity()}
              />
            </g>
          );
        })}

        {/* Reaction highlight overlay */}
        {currentState === 'roar' && (
          <rect x="0" y="0" width="100" height="25" fill="url(#roarGradient)" opacity="0.3" />
        )}
        {currentState === 'gasp' && (
          <rect x="0" y="0" width="100" height="25" fill="url(#gaspGradient)" opacity="0.2" />
        )}

        <defs>
          <linearGradient id="roarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gaspGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
