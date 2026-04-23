import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WeaponTrailProps {
  trigger: boolean;
  weaponType: 'slash' | 'bash' | 'pierce' | 'fist';
  direction: 'left' | 'right';
  sourceX: number;
  sourceY: number;
  className?: string;
}

export default function WeaponTrail({
  trigger,
  weaponType,
  direction,
  sourceX,
  sourceY,
  className,
}: WeaponTrailProps) {
  const [showTrail, setShowTrail] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowTrail(true);
      const timer = setTimeout(() => setShowTrail(false), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger]);

  if (!showTrail) return null;

  const trailColor = {
    slash: 'stroke-slate-300',
    bash: 'stroke-orange-400',
    pierce: 'stroke-white',
    fist: 'stroke-amber-600',
  }[weaponType];

  // Arc path based on weapon type and direction
  const getPath = () => {
    const startX = direction === 'right' ? sourceX : sourceX;
    const endX = direction === 'right' ? sourceX + 15 : sourceX - 15;
    const midY = sourceY + 10;

    if (weaponType === 'pierce') {
      // Straight thrust
      return `M ${startX} ${sourceY} L ${endX} ${sourceY}`;
    }

    if (weaponType === 'bash') {
      // Short arc
      return `M ${startX} ${sourceY} Q ${(startX + endX) / 2} ${midY} ${endX} ${sourceY}`;
    }

    // Slash - wide arc
    return `M ${startX} ${sourceY - 5} Q ${(startX + endX) / 2} ${midY + 10} ${endX} ${sourceY - 5}`;
  };

  return (
    <svg
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d={getPath()}
        className={cn('fill-none', trailColor)}
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          filter: 'blur(2px)',
          opacity: 0.8,
          animation: 'weapon-trail 0.2s ease-out forwards',
        }}
      />
    </svg>
  );
}
