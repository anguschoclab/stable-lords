import { cn } from '@/lib/utils';

export type ArenaTier = 'training' | 'standard' | 'championship' | 'grand';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'tournament';

interface ArenaBackgroundProps {
  tier?: ArenaTier;
  season?: Season;
  weather?: string;
  className?: string;
}

interface ArenaStyle {
  name: string;
  floor: string;
  wall: string;
  accent: string;
  crowd: boolean;
  crowdDensity: 'none' | 'sparse' | 'medium' | 'dense';
  lighting: string;
}

const ARENA_STYLES: Record<ArenaTier, ArenaStyle> = {
  training: {
    name: 'Training Pit',
    floor: 'linear-gradient(180deg, #8B7355 0%, #6B5344 100%)',
    wall: '#4A3728',
    accent: '#5A4738',
    crowd: false,
    crowdDensity: 'none',
    lighting: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 50%)',
  },
  standard: {
    name: 'Arena',
    floor: 'linear-gradient(180deg, #C9972A 0%, #A67B2E 100%)',
    wall: '#2D2D2D',
    accent: '#8B4513',
    crowd: true,
    crowdDensity: 'sparse',
    lighting: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
  },
  championship: {
    name: 'Colosseum',
    floor: 'linear-gradient(180deg, #D4A84B 0%, #B8941D 100%)',
    wall: '#1A1A1A',
    accent: '#8B0000',
    crowd: true,
    crowdDensity: 'medium',
    lighting: 'radial-gradient(ellipse at center, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
  },
  grand: {
    name: 'Imperial Arena',
    floor: 'linear-gradient(180deg, #E8C547 0%, #D4A84B 100%)',
    wall: '#0D0D0D',
    accent: '#CD853F',
    crowd: true,
    crowdDensity: 'dense',
    lighting: 'radial-gradient(ellipse at center, rgba(232,197,71,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  },
};

const SEASON_MODIFIERS: Record<
  Season,
  { wallOverlay: string; accentColor: string; decorations: boolean }
> = {
  spring: {
    wallOverlay: 'rgba(144, 238, 144, 0.05)',
    accentColor: '#90EE90',
    decorations: true,
  },
  summer: {
    wallOverlay: 'rgba(255, 215, 0, 0.1)',
    accentColor: '#FFD700',
    decorations: true,
  },
  fall: {
    wallOverlay: 'rgba(205, 92, 92, 0.08)',
    accentColor: '#CD5C5C',
    decorations: true,
  },
  winter: {
    wallOverlay: 'rgba(176, 196, 222, 0.1)',
    accentColor: '#B0C4DE',
    decorations: false,
  },
  tournament: {
    wallOverlay: 'rgba(139, 0, 0, 0.15)',
    accentColor: '#DC143C',
    decorations: true,
  },
};

export default function ArenaBackground({
  tier = 'standard',
  season = 'summer',
  weather,
  className,
}: ArenaBackgroundProps) {
  const style = ARENA_STYLES[tier];
  const seasonMod = SEASON_MODIFIERS[season];

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Wall/Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: style.wall,
          backgroundImage: seasonMod.wallOverlay
            ? `linear-gradient(180deg, ${seasonMod.wallOverlay} 0%, transparent 100%)`
            : undefined,
        }}
      />

      {/* Decorative columns/arches for higher tiers */}
      {tier !== 'training' && (
        <div className="absolute inset-0">
          {/* Left column */}
          <div
            className="absolute left-0 top-0 bottom-0 w-16 opacity-30"
            style={{
              background: `linear-gradient(90deg, ${style.wall} 0%, transparent 100%)`,
            }}
          />
          {/* Right column */}
          <div
            className="absolute right-0 top-0 bottom-0 w-16 opacity-30"
            style={{
              background: `linear-gradient(270deg, ${style.wall} 0%, transparent 100%)`,
            }}
          />
        </div>
      )}

      {/* Crowd silhouettes */}
      {style.crowd && <CrowdLayer density={style.crowdDensity} tier={tier} />}

      {/* Floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: style.floor,
          boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.3)',
        }}
      />

      {/* Season decorations */}
      {seasonMod.decorations && tier !== 'training' && (
        <SeasonDecorations season={season} tier={tier} />
      )}

      {/* Weather overlay */}
      {weather && <WeatherOverlay weather={weather} />}

      {/* Lighting overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: style.lighting }}
      />
    </div>
  );
}

function CrowdLayer({ density, tier }: { density: ArenaStyle['crowdDensity']; tier: ArenaTier }) {
  if (density === 'none') return null;

  const silhouettes = {
    sparse: 8,
    medium: 16,
    dense: 24,
  };

  const count = silhouettes[density];
  const opacity = tier === 'championship' ? 0.4 : tier === 'grand' ? 0.5 : 0.25;

  return (
    <div className="absolute top-0 left-0 right-0 h-1/4 overflow-hidden">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
        {/* Crowd silhouettes as simple paths */}
        {Array.from({ length: count }).map((_, i) => {
          const x = (i / count) * 100;
          const height = 8 + Math.random() * 8;
          const width = 3 + Math.random() * 3;
          return (
            <path
              key={i}
              d={`M${x} 20 L${x} ${20 - height} Q${x + width / 2} ${20 - height - 2} ${x + width} ${20 - height} L${x + width} 20 Z`}
              fill="rgba(0,0,0,0.6)"
              opacity={opacity}
              className="crowd-silhouette"
            />
          );
        })}
      </svg>
    </div>
  );
}

function SeasonDecorations({ season, tier }: { season: Season; tier: ArenaTier }) {
  const decorations: Record<Season, string[]> = {
    spring: ['🌸', '🌿'],
    summer: ['☀️', '🏛️'],
    fall: ['🍂', '🍁'],
    winter: ['❄️', '🏔️'],
    tournament: ['🏆', '🎭', '⚔️'],
  };

  const icons = decorations[season];
  const isTournament = season === 'tournament';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Banners */}
      {tier !== 'training' && (
        <>
          <div className="absolute top-4 left-8 text-2xl opacity-60">{icons[0]}</div>
          <div className="absolute top-4 right-8 text-2xl opacity-60">{icons[1]}</div>
          {isTournament && tier === 'grand' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl opacity-80">
              {icons[2]}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WeatherOverlay({ weather }: { weather: string }) {
  const weatherLower = weather.toLowerCase();

  // Rain effect
  if (weatherLower.includes('rain')) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-4 bg-blue-300/30 animate-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Heat shimmer
  if (weatherLower.includes('blazing') || weatherLower.includes('sweltering')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none animate-heat-shimmer"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(255,200,100,0.1) 50%, transparent 100%)',
        }}
      />
    );
  }

  // Blood moon tint
  if (weatherLower.includes('blood moon')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(139,0,0,0.2) 0%, transparent 60%)',
        }}
      />
    );
  }

  // Eclipse darkness
  if (weatherLower.includes('eclipse')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.6) 70%)',
        }}
      />
    );
  }

    // Sandstorm haze
  if (weatherLower.includes('sandstorm')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(180,120,50,0.3) 0%, rgba(180,120,50,0.5) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
    );
  }

  return null;
}
