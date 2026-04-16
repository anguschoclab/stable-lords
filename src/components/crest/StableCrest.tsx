/**
 * StableCrest Component
 * Renders a heraldic crest based on CrestData
 */

import React, { useMemo } from 'react';
import type { CrestData, ShieldShape, FieldType } from '@/types/crest.types';
import { getChargePathsByType, type ChargePath } from '@/engine/crest/chargePaths';

interface StableCrestProps {
  crest: CrestData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showMantling?: boolean;
  showHelmet?: boolean;
  animate?: boolean;
  className?: string;
  selected?: boolean; // Ring highlight for selection
  showTooltip?: boolean; // Show heraldic description on hover
  showGenerationBadge?: boolean; // Show G1/G2 badge for legacy stables
}

// Size mappings
const SIZE_MAP = {
  xs: 16,
  sm: 24,
  md: 40,
  lg: 64,
  xl: 120,
};

// Shield paths by shape
const SHIELD_PATHS: Record<ShieldShape, string> = {
  heater: 'M10,10 h80 v40 c0,25 -20,40 -40,40 s-40,-15 -40,-40 z',
  french: 'M10,15 h80 c0,30 -20,50 -40,55 s-40,-25 -40,-55 z',
  swiss: 'M15,10 h70 v50 c0,20 -15,30 -35,30 s-35,-10 -35,-30 z',
  spanish: 'M10,10 h80 c0,20 -10,35 -20,45 l20,25 l-40,-25 l-40,25 l20,-25 c-10,-10 -20,-25 -20,-45 z',
  lozenge: 'M50,10 l40,40 l-40,40 l-40,-40 z',
};

// Field pattern definitions
function getFieldPattern(fieldType: FieldType, colors: { primary: string; secondary?: string; metal: string }): React.ReactNode {
  const { primary, secondary = primary, metal } = colors;

  switch (fieldType) {
    case 'solid':
      return <rect x="0" y="0" width="100" height="100" fill={primary} />;

    case 'fess':
      return (
        <>
          <rect x="0" y="0" width="100" height="35" fill={primary} />
          <rect x="0" y="35" width="100" height="30" fill={secondary} />
          <rect x="0" y="65" width="100" height="35" fill={primary} />
        </>
      );

    case 'pale':
      return (
        <>
          <rect x="0" y="0" width="35" height="100" fill={primary} />
          <rect x="35" y="0" width="30" height="100" fill={secondary} />
          <rect x="65" y="0" width="35" height="100" fill={primary} />
        </>
      );

    case 'bend':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="0,0 30,0 100,70 100,100 70,100 0,30" fill={primary} />
          <polygon points="30,0 100,70 100,100 70,100 0,30 0,0" fill={secondary} transform="translate(10,-10)" />
        </svg>
      );

    case 'chevron':
      return (
        <>
          <polygon points="0,0 50,35 100,0 100,15 50,50 0,15" fill={primary} />
          <polygon points="0,15 50,50 100,15 100,100 0,100" fill={secondary} />
        </>
      );

    case 'cross':
      return (
        <>
          <rect x="0" y="0" width="35" height="35" fill={primary} />
          <rect x="65" y="0" width="35" height="35" fill={primary} />
          <rect x="0" y="65" width="35" height="35" fill={primary} />
          <rect x="65" y="65" width="35" height="35" fill={primary} />
          <rect x="35" y="0" width="30" height="35" fill={secondary} />
          <rect x="35" y="65" width="30" height="35" fill={secondary} />
          <rect x="0" y="35" width="35" height="30" fill={secondary} />
          <rect x="65" y="35" width="35" height="30" fill={secondary} />
          <rect x="35" y="35" width="30" height="30" fill={metal} />
        </>
      );

    case 'saltire':
      return (
        <>
          <polygon points="0,0 25,0 50,25 75,0 100,0 100,25 75,50 100,75 100,100 75,100 50,75 25,100 0,100 0,75 25,50 0,25" fill={primary} />
          <polygon points="25,0 50,25 75,0 100,25 75,50 100,75 75,100 50,75 25,100 0,75 25,50 0,25" fill={secondary} />
        </>
      );

    case 'per-pale':
      return (
        <>
          <rect x="0" y="0" width="50" height="100" fill={primary} />
          <rect x="50" y="0" width="50" height="100" fill={secondary} />
        </>
      );

    case 'per-fess':
      return (
        <>
          <rect x="0" y="0" width="100" height="50" fill={primary} />
          <rect x="0" y="50" width="100" height="50" fill={secondary} />
        </>
      );

    case 'gyronny':
      return (
        <>
          <polygon points="50,0 100,0 100,50 50,50" fill={primary} />
          <polygon points="50,0 50,50 0,50 0,0" fill={secondary} />
          <polygon points="0,50 50,50 50,100 0,100" fill={primary} />
          <polygon points="50,50 100,50 100,100 50,100" fill={secondary} />
        </>
      );

    case 'bend-sinister':
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="100,0 70,0 0,70 0,100 30,100 100,30" fill={primary} />
          <polygon points="70,0 0,70 0,100 30,100 100,30 100,0" fill={secondary} transform="translate(-10,10)" />
        </svg>
      );

    case 'chevron-inverted':
      return (
        <>
          <polygon points="0,0 100,0 100,85 50,50 0,85" fill={primary} />
          <polygon points="0,85 50,50 100,85 100,100 0,100" fill={secondary} />
        </>
      );

    case 'pale-environ':
      return (
        <>
          <rect x="0" y="0" width="25" height="100" fill={primary} />
          <rect x="25" y="0" width="50" height="100" fill={secondary} />
          <rect x="75" y="0" width="25" height="100" fill={primary} />
        </>
      );

    default:
      return <rect x="0" y="0" width="100" height="100" fill={primary} />;
  }
}

// Get charge SVG component
function ChargeComponent({ charge, metal }: { charge: CrestData['charge']; metal: string }): React.ReactNode {
  const paths = getChargePathsByType(charge.type);
  const chargeData: ChargePath | undefined = paths[charge.name];

  if (!chargeData) return null;

  const count = charge.count;

  // Single charge - centered
  if (count === 1) {
    return (
      <g transform="translate(50, 55) scale(0.4)">
        <path d={chargeData.path} fill={metal} />
      </g>
    );
  }

  // Two charges - side by side
  if (count === 2) {
    return (
      <>
        <g transform="translate(30, 55) scale(0.3)">
          <path d={chargeData.path} fill={metal} />
        </g>
        <g transform="translate(70, 55) scale(0.3)">
          <path d={chargeData.path} fill={metal} />
        </g>
      </>
    );
  }

  // Three charges - triangle formation
  return (
    <>
      <g transform="translate(30, 65) scale(0.28)">
        <path d={chargeData.path} fill={metal} />
      </g>
      <g transform="translate(70, 65) scale(0.28)">
        <path d={chargeData.path} fill={metal} />
      </g>
      <g transform="translate(50, 35) scale(0.28)">
        <path d={chargeData.path} fill={metal} />
      </g>
    </>
  );
}

// Optional mantling decoration
function Mantling({ color }: { color: string }): React.ReactNode {
  return (
    <g opacity="0.3">
      {/* Left mantling */}
      <path
        d="M10,10 Q5,30 10,50 Q15,70 10,90 Q20,80 25,60 Q20,40 25,20 Q15,15 10,10"
        fill={color}
      />
      {/* Right mantling */}
      <path
        d="M90,10 Q95,30 90,50 Q85,70 90,90 Q80,80 75,60 Q80,40 75,20 Q85,15 90,10"
        fill={color}
      />
    </g>
  );
}

// Optional helmet for higher tiers
function Helmet({ metal }: { metal: string }): React.ReactNode {
  return (
    <g transform="translate(50, 5)">
      <ellipse cx="0" cy="0" rx="15" ry="8" fill={metal} />
      <rect x="-8" y="-5" width="16" height="10" rx="2" fill={metal} opacity="0.8" />
      <line x1="-15" y1="0" x2="15" y2="0" stroke="#333" strokeWidth="1" />
    </g>
  );
}

export function StableCrest({
  crest,
  size = 'md',
  showMantling,
  showHelmet,
  animate = false,
  className = '',
  selected = false,
  showTooltip = true,
  showGenerationBadge = true,
}: StableCrestProps): React.ReactElement {
  // Determine pixel size
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];

  // Auto-show mantling for larger sizes if not explicitly set
  const shouldShowMantling = showMantling ?? pixelSize >= 64;
  const shouldShowHelmet = showHelmet ?? pixelSize >= 64;

  // Get shield path
  const shieldPath = SHIELD_PATHS[crest.shieldShape] || SHIELD_PATHS.heater;

  // Determine metal color hex
  const metalColor = crest.metalColor === 'gold' ? '#D4AF37' : '#C0C0C0';

  // Glow effect based on metal color
  const glowColor = crest.metalColor === 'gold' 
    ? 'rgba(212, 175, 55, 0.3)' 
    : 'rgba(192, 192, 192, 0.25)';
  
  const glowStyle: React.CSSProperties = pixelSize >= 64 ? {
    filter: `drop-shadow(0 0 ${pixelSize * 0.15}px ${glowColor})`,
  } : {};

  // Container style for animation and hover
  const containerStyle: React.CSSProperties = {
    width: pixelSize,
    height: pixelSize,
    display: 'inline-block',
    position: 'relative',
    transition: 'transform 200ms ease-out, filter 200ms ease-out',
    willChange: 'transform',
    ...glowStyle,
    ...(animate && {
      animation: 'crestFadeIn 0.3s ease-out',
    }),
  };

  // Heraldic description for tooltip
  const heraldicDesc = useMemo(() => {
    const metal = crest.metalColor === 'gold' ? 'Or' : 'Argent';
    const field = crest.fieldType === 'solid' ? '' : ` ${crest.fieldType}`;
    const charge = crest.charge.count > 1 ? `${crest.charge.count} ${crest.charge.name}s` : crest.charge.name;
    return `${metal}${field} with ${charge}`;
  }, [crest]);

  // Generation badge position
  const hasGeneration = showGenerationBadge && crest.generation && crest.generation > 0;

  return (
    <div 
      className={`stable-crest ${className} ${selected ? 'ring-2 ring-accent/50 rounded-sm' : ''} group`}
      style={containerStyle}
      title={showTooltip ? heraldicDesc : undefined}
    >
      {/* Hover scale effect wrapper */}
      <div className="w-full h-full transition-transform duration-200 ease-out group-hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          width={pixelSize}
          height={pixelSize}
          aria-label={`Stable crest: ${crest.charge.name} on ${crest.fieldType} field`}
          className="transition-all duration-200 group-hover:drop-shadow-lg"
        >
        <defs>
          {/* Drop shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Mantling (behind shield) */}
        {shouldShowMantling && <Mantling color={crest.primaryColor} />}

        {/* Helmet (above shield, behind crest) */}
        {shouldShowHelmet && <Helmet metal={metalColor} />}

        {/* Shield with field pattern */}
        <g filter="url(#shadow)">
          {/* Clip path for the shield */}
          <clipPath id="shieldClip">
            <path d={shieldPath} />
          </clipPath>

          {/* Shield background with field pattern */}
          <g clipPath="url(#shieldClip)">
            {getFieldPattern(crest.fieldType, {
              primary: crest.primaryColor,
              secondary: crest.secondaryColor,
              metal: metalColor,
            })}
          </g>

          {/* Shield border */}
          <path
            d={shieldPath}
            fill="none"
            stroke={metalColor}
            strokeWidth="3"
          />

          {/* Charge(s) */}
          <clipPath id="chargeClip">
            <path d={shieldPath} />
          </clipPath>
          <g clipPath="url(#chargeClip)">
            <ChargeComponent charge={crest.charge} metal={metalColor} />
          </g>
        </g>
      </svg>
      </div> {/* Close hover scale wrapper */}

      {/* Animation styles */}
      {animate && (
        <style>{`
          @keyframes crestFadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      )}
      
      {/* Generation Badge */}
      {hasGeneration && (
        <div 
          className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.5 rounded-none bg-black/80 border border-accent/30 text-accent/80"
          style={{ fontSize: Math.max(8, pixelSize * 0.15) }}
        >
          G{crest.generation}
        </div>
      )}
    </div>
  );
}

// Export size constants for external use
export { SIZE_MAP };
export default StableCrest;
