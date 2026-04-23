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
  spanish:
    'M10,10 h80 c0,20 -10,35 -20,45 l20,25 l-40,-25 l-40,25 l20,-25 c-10,-10 -20,-25 -20,-45 z',
  lozenge: 'M50,10 l40,40 l-40,40 l-40,-40 z',
};

// Field pattern definitions
function getFieldPattern(
  fieldType: FieldType,
  colors: { primary: string; secondary?: string; metal: string }
): React.ReactNode {
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
          <polygon
            points="30,0 100,70 100,100 70,100 0,30 0,0"
            fill={secondary}
            transform="translate(10,-10)"
          />
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
          <polygon
            points="0,0 25,0 50,25 75,0 100,0 100,25 75,50 100,75 100,100 75,100 50,75 25,100 0,100 0,75 25,50 0,25"
            fill={primary}
          />
          <polygon
            points="25,0 50,25 75,0 100,25 75,50 100,75 75,100 50,75 25,100 0,75 25,50 0,25"
            fill={secondary}
          />
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
          <polygon
            points="70,0 0,70 0,100 30,100 100,30 100,0"
            fill={secondary}
            transform="translate(-10,10)"
          />
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

    case 'quarterly':
      return (
        <>
          <rect x="0" y="0" width="50" height="50" fill={primary} />
          <rect x="50" y="0" width="50" height="50" fill={secondary} />
          <rect x="0" y="50" width="50" height="50" fill={secondary} />
          <rect x="50" y="50" width="50" height="50" fill={primary} />
        </>
      );

    default:
      return <rect x="0" y="0" width="100" height="100" fill={primary} />;
  }
}

// Posture transforms applied within the 100x100 charge path space (centered at 50,50)
function getPostureTransform(posture?: CrestData['charge']['posture']): string {
  switch (posture) {
    case 'rampant':
      // Rearing up - rotated backward
      return 'rotate(-18 50 50)';
    case 'passant':
      // Walking - slight lean
      return 'skewX(-6)';
    case 'sejant':
      // Seated - compressed vertically
      return 'translate(0 6) scale(1 0.82)';
    case 'statant':
      // Standing still - no transform
      return '';
    case 'couchant':
      // Lying down - squashed and lowered
      return 'translate(0 10) scale(1.05 0.7)';
    case 'forcene':
      // Rearing wildly - forward tilt
      return 'rotate(14 50 50) skewY(-4)';
    default:
      return '';
  }
}

// Get charge SVG component
// Charge path center is at (50,50) in a 100x100 box.
// For a translate(tx,ty) scale(s), the path center maps to (tx + 50s, ty + 50s).
// To place the center at (cX, cY): tx = cX - 50*s, ty = cY - 50*s
function ChargeComponent({
  charge,
  metal,
}: {
  charge: CrestData['charge'];
  metal: string;
}): React.ReactNode {
  const paths = getChargePathsByType(charge.type);
  const chargeData: ChargePath | undefined = paths[charge.name];

  if (!chargeData) return null;

  const count = charge.count;
  const postureTransform = getPostureTransform(charge.posture);

  const renderPath = (tx: number, ty: number, s: number, key?: string | number) => (
    <g key={key} transform={`translate(${tx} ${ty}) scale(${s})`}>
      {postureTransform ? (
        <g transform={postureTransform}>
          <path d={chargeData.path} fill={metal} />
        </g>
      ) : (
        <path d={chargeData.path} fill={metal} />
      )}
    </g>
  );

  // Single charge - centered at (50, 52), scale 0.5
  if (count === 1) {
    // tx = 50 - 50*0.5 = 25, ty = 52 - 50*0.5 = 27
    return renderPath(25, 27, 0.5);
  }

  // Two charges - centered at (33, 55) and (67, 55), scale 0.32
  if (count === 2) {
    // tx = 33 - 50*0.32 = 17, ty = 55 - 50*0.32 = 39
    // tx = 67 - 50*0.32 = 51, ty = 39
    return (
      <>
        {renderPath(17, 39, 0.32, 'l')}
        {renderPath(51, 39, 0.32, 'r')}
      </>
    );
  }

  // Three charges - triangle: top at (50, 36), bottom-left (33, 64), bottom-right (67, 64), scale 0.28
  // top: tx = 50 - 14 = 36, ty = 36 - 14 = 22
  // bl:  tx = 33 - 14 = 19, ty = 64 - 14 = 50
  // br:  tx = 67 - 14 = 53, ty = 64 - 14 = 50
  return (
    <>
      {renderPath(36, 22, 0.28, 't')}
      {renderPath(19, 50, 0.28, 'bl')}
      {renderPath(53, 50, 0.28, 'br')}
    </>
  );
}

// Optional mantling decoration - stylized leafy flourishes behind the shield
function Mantling({ color }: { color: string }): React.ReactNode {
  return (
    <g>
      {/* Left mantling - layered flourish */}
      <g opacity="0.35">
        <path
          d="M10,12 Q2,28 6,45 Q10,60 4,72 Q2,82 10,88 Q16,80 18,68 Q20,56 16,45 Q14,34 18,22 Q16,14 10,12 Z"
          fill={color}
        />
      </g>
      <g opacity="0.22">
        <path
          d="M14,18 Q8,32 12,48 Q16,62 12,74 Q16,78 20,72 Q18,60 22,48 Q24,36 20,24 Q18,16 14,18 Z"
          fill={color}
        />
      </g>
      {/* Right mantling */}
      <g opacity="0.35">
        <path
          d="M90,12 Q98,28 94,45 Q90,60 96,72 Q98,82 90,88 Q84,80 82,68 Q80,56 84,45 Q86,34 82,22 Q84,14 90,12 Z"
          fill={color}
        />
      </g>
      <g opacity="0.22">
        <path
          d="M86,18 Q92,32 88,48 Q84,62 88,74 Q84,78 80,72 Q82,60 78,48 Q76,36 80,24 Q82,16 86,18 Z"
          fill={color}
        />
      </g>
    </g>
  );
}

// Optional helmet for higher tiers - more detailed knight's helm
function Helmet({ metal }: { metal: string }): React.ReactNode {
  const isGold = metal === '#D4AF37';
  const shadow = isGold ? '#8B7016' : '#808080';
  const highlight = isGold ? '#F5D76E' : '#E8E8E8';
  return (
    <g transform="translate(50, 4)">
      {/* Dome shadow */}
      <ellipse cx="0" cy="0" rx="14" ry="9" fill={shadow} />
      {/* Main dome */}
      <ellipse cx="0" cy="-1" rx="13" ry="8" fill={metal} />
      {/* Dome highlight */}
      <ellipse cx="-3" cy="-3" rx="5" ry="2.5" fill={highlight} opacity="0.7" />
      {/* Neck guard */}
      <path d="M-11,5 Q-10,9 -8,11 L8,11 Q10,9 11,5 Z" fill={shadow} />
      <path d="M-10,4 Q-9,8 -7,10 L7,10 Q9,8 10,4 Z" fill={metal} />
      {/* Visor plate */}
      <rect x="-9" y="-4" width="18" height="8" rx="1.5" fill={shadow} opacity="0.9" />
      {/* Visor slits */}
      <line x1="-8" y1="-2" x2="8" y2="-2" stroke={metal} strokeWidth="0.8" />
      <line x1="-8" y1="0" x2="8" y2="0" stroke={metal} strokeWidth="0.8" />
      <line x1="-8" y1="2" x2="8" y2="2" stroke={metal} strokeWidth="0.8" />
      {/* Center ridge */}
      <line x1="0" y1="-10" x2="0" y2="4" stroke={shadow} strokeWidth="1" />
      {/* Rivets */}
      <circle cx="-9" cy="4" r="0.8" fill={highlight} />
      <circle cx="9" cy="4" r="0.8" fill={highlight} />
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
  const glowColor =
    crest.metalColor === 'gold' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(192, 192, 192, 0.25)';

  const glowStyle: React.CSSProperties =
    pixelSize >= 64
      ? {
          filter: `drop-shadow(0 0 ${pixelSize * 0.15}px ${glowColor})`,
        }
      : {};

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
    const charge =
      crest.charge.count > 1 ? `${crest.charge.count} ${crest.charge.name}s` : crest.charge.name;
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
            <path d={shieldPath} fill="none" stroke={metalColor} strokeWidth="3" />

            {/* Charge(s) */}
            <clipPath id="chargeClip">
              <path d={shieldPath} />
            </clipPath>
            <g clipPath="url(#chargeClip)">
              <ChargeComponent charge={crest.charge} metal={metalColor} />
            </g>
          </g>
        </svg>
      </div>{' '}
      {/* Close hover scale wrapper */}
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
