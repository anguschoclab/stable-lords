import { cn } from '@/lib/utils';
import type { InjuryData, InjurySeverity, InjuryLocation } from '@/types/game';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WarriorPaperDollProps {
  injuries: (string | InjuryData)[];
  isWeaponMastered?: boolean;
  className?: string;
  size?: number;
}

const SEVERITY_COLORS: Record<InjurySeverity, string> = {
  Minor: 'fill-arena-gold/40',
  Moderate: 'fill-arena-gold/60',
  Severe: 'fill-arena-blood/40',
  Critical: 'fill-arena-blood/70',
  Permanent: 'fill-arena-blood',
};

const SEVERITY_STROKE: Record<InjurySeverity, string> = {
  Minor: 'stroke-arena-gold/50',
  Moderate: 'stroke-arena-gold',
  Severe: 'stroke-arena-blood/60',
  Critical: 'stroke-arena-blood',
  Permanent: 'stroke-white/20',
};

export default function WarriorPaperDoll({
  injuries,
  isWeaponMastered,
  className,
  size = 200,
}: WarriorPaperDollProps) {
  // Normalize injuries
  const activeInjuries = injuries.filter((i) => typeof i !== 'string') as InjuryData[];

  const getPartStatus = (location: InjuryLocation) => {
    const relevant = activeInjuries.filter((i) => i.location === location);
    if (relevant.length === 0) return null;

    // Pick the most severe
    const severities: InjurySeverity[] = ['Permanent', 'Critical', 'Severe', 'Moderate', 'Minor'];
    for (const s of severities) {
      if (relevant.some((i) => i.severity === s)) return s;
    }
    return 'Minor';
  };

  const Part = ({
    location,
    path,
    label,
    extraClass,
  }: {
    location: InjuryLocation;
    path: string;
    label: string;
    extraClass?: string;
  }) => {
    const status = getPartStatus(location);
    const relevantInjuries = activeInjuries.filter((i) => i.location === location);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <path
            d={path}
            className={cn(
              'transition-all duration-500 ease-in-out stroke-[1.5]',
              status ? SEVERITY_COLORS[status] : 'fill-white/5',
              status ? SEVERITY_STROKE[status] : 'stroke-white/10 hover:stroke-white/30',
              status && 'animate-pulse',
              extraClass
            )}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/90 border-arena-blood/40 text-xs p-2">
          <div className="font-bold uppercase tracking-widest text-[10px] mb-1 text-muted-foreground">
            {label}
          </div>
          {relevantInjuries.length > 0 ? (
            <div className="space-y-1">
              {relevantInjuries.map((i) => (
                <div key={i.id} className="flex flex-col">
                  <span
                    className={cn(
                      'font-bold text-arena-blood',
                      i.severity === 'Minor' && 'text-arena-gold'
                    )}
                  >
                    {i.severity} {i.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {i.weeksRemaining} weeks left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground italic">No Injuries</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size * 1.5}
        viewBox="0 0 100 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
      >
        {/* Head */}
        <Part
          location="Head"
          label="Cranium & Vision"
          path="M50 10C45 10 41 14 41 19C41 24 45 28 50 28C55 28 59 24 59 19C59 14 55 10 50 10Z"
        />

        {/* Torso/Chest */}
        <Part location="Chest" label="Chest & Lungs" path="M38 30H62V55H38V30Z" />

        {/* Abdomen */}
        <Part location="Abdomen" label="Core & Vitals" path="M38 56H62V75L50 85L38 75V56Z" />

        {/* Left Arm */}
        <Part
          location="Left Arm"
          label="Left Arm (Shield/Off)"
          path="M36 32L28 35L22 65L32 68L36 32Z"
        />

        {/* Right Arm */}
        <Part
          location="Right Arm"
          label="Right Arm (Weapon)"
          path="M64 32L72 35L78 65L68 68L64 32Z"
          extraClass={
            isWeaponMastered
              ? 'fill-arena-gold/40 stroke-arena-gold drop-shadow-[0_0_8px_#FFD700] animate-pulse'
              : ''
          }
        />

        {/* Left Leg */}
        <Part location="Left Leg" label="Left Leg" path="M38 78L32 140L45 140L48 85L38 78Z" />

        {/* Right Leg */}
        <Part location="Right Leg" label="Right Leg" path="M62 78L68 140L55 140L52 85L62 78Z" />

        {/* Backdrop Glow */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
