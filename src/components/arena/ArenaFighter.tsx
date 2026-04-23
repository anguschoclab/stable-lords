import { cn } from '@/lib/utils';
import type { FighterPose, FighterStats } from '@/types/arena.types';
import type { FightingStyle } from '@/types/game';

interface ArenaFighterProps {
  name: string;
  pose: FighterPose;
  stats: FighterStats;
  style: FightingStyle;
  weaponName?: string;
  shieldName?: string;
  isWinner?: boolean;
  isDead?: boolean;
  isActive?: boolean;
  className?: string;
  size?: number;
}

// Weapon category detection
function getWeaponCategory(weaponName: string): 'slash' | 'bash' | 'pierce' | 'shield' | 'fist' {
  const w = weaponName.toLowerCase();
  if (
    w.includes('shield') ||
    w.includes('small shield') ||
    w.includes('medium shield') ||
    w.includes('large shield')
  )
    return 'shield';
  if (
    w.includes('sword') ||
    w.includes('scimitar') ||
    w.includes('axe') ||
    w.includes('blade') ||
    w.includes('scythe') ||
    w.includes('halberd')
  )
    return 'slash';
  if (
    w.includes('mace') ||
    w.includes('hammer') ||
    w.includes('flail') ||
    w.includes('maul') ||
    w.includes('morning star') ||
    w.includes('morningstar')
  )
    return 'bash';
  if (
    w.includes('spear') ||
    w.includes('épée') ||
    w.includes('epee') ||
    w.includes('dagger') ||
    w.includes('pike') ||
    w.includes('lance')
  )
    return 'pierce';
  if (w.includes('staff') || w.includes('fist') || w.includes('gauntlet')) return 'fist';
  return 'slash'; // default
}

export default function ArenaFighter({
  name,
  pose,
  stats,
  style,
  weaponName = 'Longsword',
  shieldName,
  isWinner,
  isDead,
  isActive,
  className,
  size = 120,
}: ArenaFighterProps) {
  const weaponCategory = getWeaponCategory(weaponName);
  const hasShield =
    shieldName &&
    shieldName.toLowerCase() !== 'none' &&
    !shieldName.toLowerCase().includes('shield');
  const shieldSize = shieldName?.toLowerCase().includes('large')
    ? 'large'
    : shieldName?.toLowerCase().includes('small')
      ? 'small'
      : 'medium';

  // Calculate HP percentage
  const hpPercent = Math.max(0, (stats.currentHp / stats.maxHp) * 100);
  const fpPercent = Math.max(0, (stats.currentFp / stats.maxFp) * 100);

  // Animation classes based on stance
  const stanceAnimation = {
    neutral: '',
    advancing: 'animate-advancing',
    retreating: 'animate-retreating',
    lunging: 'animate-lunging',
    defending: 'animate-defending',
    stunned: 'animate-stunned',
    victorious: 'animate-victorious',
    defeated: 'animate-defeated',
  }[pose.stance];

  // Idle animation based on fighting style
  const idleAnimation = !isDead && pose.stance === 'neutral' ? getIdleAnimation(style) : '';

  return (
    <div
      className={cn('absolute transition-all duration-300', className)}
      style={{
        left: `${pose.x}%`,
        bottom: `${30 + pose.y}%`,
        transform: `translateX(-50%) ${pose.facing === 'left' ? 'scaleX(-1)' : ''} ${isDead ? 'rotate(90deg)' : ''}`,
        zIndex: isActive ? 10 : 5,
        opacity: isDead ? 0.6 : 1,
      }}
    >
      {/* HP/FP Bars */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24">
        {/* HP Bar */}
        <div className="h-1.5 bg-black/50 rounded-none mb-0.5 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-600'
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        {/* FP Bar */}
        <div className="h-1 bg-black/50 rounded-none overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${fpPercent}%` }}
          />
        </div>
        {/* Winner glow */}
        {isWinner && <div className="absolute -inset-1 bg-yellow-500/30 blur-sm animate-pulse" />}
      </div>

      {/* Name Plate */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-none',
            isWinner ? 'bg-yellow-600/80 text-white' : 'bg-black/60 text-white/90'
          )}
        >
          {name}
        </span>
      </div>

      {/* Fighter SVG */}
      <div
        className={cn('relative', stanceAnimation, idleAnimation)}
        style={{ width: size, height: size * 1.5 }}
      >
        <svg
          viewBox="0 0 100 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-lg"
        >
          {/* Fighter body */}
          <g className={cn('transition-transform duration-200', isDead && 'translate-y-8')}>
            {/* Head */}
            <circle
              cx="50"
              cy="15"
              r="10"
              className={cn('fill-amber-200/80 stroke-amber-900/40', isDead && 'fill-gray-400/80')}
              strokeWidth="2"
            />

            {/* Torso */}
            <path
              d="M35 25 H65 V55 H35 V25 Z"
              className={cn('fill-amber-800/60 stroke-amber-900/40', isDead && 'fill-gray-600/60')}
              strokeWidth="2"
            />

            {/* Abdomen */}
            <path
              d="M38 56 H62 V80 L50 90 L38 80 V56 Z"
              className={cn('fill-amber-700/50 stroke-amber-900/40', isDead && 'fill-gray-700/50')}
              strokeWidth="2"
            />

            {/* Left Arm (Shield arm) */}
            <path
              d="M35 30 L20 40 L15 65 L25 70 L32 32 Z"
              className={cn('fill-amber-200/70 stroke-amber-900/40', isDead && 'fill-gray-400/70')}
              strokeWidth="2"
            />

            {/* Right Arm (Weapon arm) */}
            <path
              d="M65 30 L80 40 L85 65 L75 70 L68 32 Z"
              className={cn('fill-amber-200/70 stroke-amber-900/40', isDead && 'fill-gray-400/70')}
              strokeWidth="2"
            />

            {/* Left Leg */}
            <path
              d="M38 85 L30 140 L45 140 L48 90 L38 85 Z"
              className={cn('fill-amber-700/60 stroke-amber-900/40', isDead && 'fill-gray-600/60')}
              strokeWidth="2"
            />

            {/* Right Leg */}
            <path
              d="M62 85 L70 140 L55 140 L52 90 L62 85 Z"
              className={cn('fill-amber-700/60 stroke-amber-900/40', isDead && 'fill-gray-600/60')}
              strokeWidth="2"
            />

            {/* Weapon */}
            {!isDead && <WeaponIcon category={weaponCategory} pose={pose.stance} x={85} y={55} />}

            {/* Shield */}
            {hasShield && !isDead && <ShieldIcon size={shieldSize} x={15} y={55} />}
          </g>
        </svg>
      </div>
    </div>
  );
}

function WeaponIcon({
  category,
  pose,
  x,
  y,
}: {
  category: string;
  pose: string;
  x: number;
  y: number;
}) {
  // Weapon rotation based on pose
  const rotation =
    {
      neutral: 0,
      advancing: -15,
      retreating: 15,
      lunging: -30,
      defending: -45,
      stunned: 5,
      victorious: -60,
      defeated: 90,
    }[pose] || 0;

  const transform = `rotate(${rotation} ${x} ${y})`;

  if (category === 'shield') {
    return (
      <circle
        cx={x - 5}
        cy={y}
        r="12"
        className="fill-amber-900/80 stroke-amber-950/60"
        strokeWidth="2"
        transform={transform}
      />
    );
  }

  if (category === 'slash') {
    return (
      <g transform={transform}>
        <path
          d={`M${x} ${y - 20} L${x + 5} ${y + 20} L${x - 3} ${y + 20} Z`}
          className="fill-slate-400/90 stroke-slate-600"
          strokeWidth="1"
        />
        <rect x={x - 2} y={y - 25} width="4" height="10" className="fill-amber-800/80" />
      </g>
    );
  }

  if (category === 'bash') {
    return (
      <g transform={transform}>
        <circle
          cx={x}
          cy={y - 5}
          r="10"
          className="fill-slate-500/90 stroke-slate-700"
          strokeWidth="2"
        />
        <rect x={x - 3} y={y - 20} width="6" height="20" className="fill-amber-800/80" />
      </g>
    );
  }

  if (category === 'pierce') {
    return (
      <g transform={transform}>
        <path
          d={`M${x} ${y - 30} L${x + 3} ${y + 15} L${x - 3} ${y + 15} Z`}
          className="fill-slate-400/90 stroke-slate-600"
          strokeWidth="1"
        />
        <rect x={x - 2} y={y + 15} width="4" height="8" className="fill-amber-800/80" />
      </g>
    );
  }

  // Fist/default
  return (
    <g transform={transform}>
      <circle
        cx={x}
        cy={y - 5}
        r="6"
        className="fill-amber-200/80 stroke-amber-900/40"
        strokeWidth="2"
      />
    </g>
  );
}

function ShieldIcon({ size, x, y }: { size: string; x: number; y: number }) {
  const radius = size === 'large' ? 14 : size === 'small' ? 8 : 11;

  return (
    <ellipse
      cx={x}
      cy={y}
      rx={radius}
      ry={radius * 1.2}
      className="fill-amber-900/70 stroke-amber-950/50"
      strokeWidth="2"
    />
  );
}

function getIdleAnimation(style: FightingStyle): string {
  const animations: Record<string, string> = {
    'Lunging Attack': 'animate-idle-aggressive',
    'Bashing Attack': 'animate-idle-aggressive',
    'Total Parry': 'animate-idle-defensive',
    'Wall of Steel': 'animate-idle-defensive',
    'Parry-Lunge': 'animate-idle-balanced',
    'Parry-Riposte': 'animate-idle-balanced',
    'Parry-Strike': 'animate-idle-balanced',
    'Aimed Blow': 'animate-idle-aimed',
    'Slashing Attack': 'animate-idle-striking',
    'Striking Attack': 'animate-idle-striking',
  };

  return animations[style] || 'animate-idle-balanced';
}
