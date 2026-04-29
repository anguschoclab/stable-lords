import { cn } from '@/lib/utils';

export type ArenaTier = 'training' | 'standard' | 'championship' | 'grand';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'tournament';

import { isIndoorArena } from '@/data/arenas';

interface ArenaBackgroundProps {
  tier?: ArenaTier;
  season?: Season;
  weather?: string;
  arenaId?: string;
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
  arenaId,
  className,
}: ArenaBackgroundProps) {
  const style = ARENA_STYLES[tier];
  const seasonMod = SEASON_MODIFIERS[season];

  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : weather;

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
      {effectiveWeather && <WeatherOverlay weather={effectiveWeather} />}

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

  // 🌧️ Rain effect
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

  // 🌡️ Heat shimmer
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

  // 🌬️ Wind / Gale effect
  if (weatherLower.includes('gale') || weatherLower.includes('breezy')) {
    const isGale = weatherLower.includes('gale');
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: isGale ? 40 : 15 }).map((_, i) => (
          <div
            key={i}
            className={cn('absolute h-px bg-white/20 animate-wind', isGale ? 'w-16' : 'w-8')}
            style={{
              top: `${Math.random() * 100}%`,
              left: `-20%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${0.8 + Math.random() * 1.5}s`,
              opacity: 0.05 + Math.random() * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  // 🌑 Eclipse darkness
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

  // 🩸 Blood Moon
  if (weatherLower.includes('blood moon')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none animate-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(139,0,0,0.3) 0%, transparent 80%)',
          boxShadow: 'inset 0 0 100px rgba(139,0,0,0.15)',
        }}
      />
    );
  }

  // 🏜️ Sandstorm
  if (weatherLower.includes('sandstorm')) {
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(180,120,50,0.2) 0%, rgba(180,120,50,0.4) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
    );
  }

  // ❄️ Blizzard
  if (weatherLower.includes('blizzard')) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full animate-snow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>
    );
  }

  // 🌫️ Dense Fog
  if (weatherLower.includes('dense fog')) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-fog-drift"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(200,200,200,0.1) 0%, rgba(150,150,150,0.6) 100%)',
            filter: 'blur(40px)',
            width: '120%',
            left: '-10%',
          }}
        />
      </div>
    );
  }

  // ⛈️ Thunderstorm
  if (weatherLower.includes('thunderstorm')) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-blue-900/20" />
        {/* Lightning strike simulation */}
        <div className="absolute inset-0 animate-pulse-slow opacity-10 bg-white" />
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-6 bg-blue-200/40 animate-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.4 + Math.random() * 0.3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // 🌋 Ashfall
  if (weatherLower.includes('ashfall')) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply" />
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-stone-500/40 animate-ash-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // 🧪 Acid Rain
  if (weatherLower.includes('acid rain')) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-lime-900/5 mix-blend-color" />
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-5 bg-lime-400/30 animate-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.6 + Math.random() * 0.4}s`,
            }}
          />
        ))}
        {/* Acid sizzle glow on floor */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-lime-500/5 blur-xl animate-pulse" />
      </div>
    );
  }

  // ✨ Mana Surge
  if (weatherLower.includes('mana surge')) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1), rgba(255,0,255,0.1))',
            backgroundSize: '200% 200%',
            animation: 'bronzeShimmer 5s linear infinite',
          }}
        />
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-fuchsia-400/40 rounded-full animate-mana-spark"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--tx': `${(Math.random() - 0.5) * 100}px`,
              '--ty': `${(Math.random() - 0.5) * 100}px`,
              animationDelay: `${Math.random() * 4}s`,
            } as any}
          />
        ))}
      </div>
    );
  }

  return null;
}
