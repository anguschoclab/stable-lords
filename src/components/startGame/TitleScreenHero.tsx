import { Swords, Star } from 'lucide-react';

export default function TitleScreenHero() {
  return (
    <div className="text-center space-y-5">
      <div className="flex items-center justify-center w-20 h-20 mx-auto relative">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5), rgba(201, 151, 42, 0.15), rgba(201, 151, 42, 0.5))',
            padding: '1px',
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0C0806]" />
        </div>
        <div
          className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at 35% 35%, rgba(160, 40, 48, 0.95) 0%, #872228 55%, rgba(100, 20, 26, 0.9) 100%)',
            boxShadow:
              '0 4px 16px rgba(135, 34, 40, 0.5), inset 0 1px 0 rgba(255, 200, 200, 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        >
          <Swords className="h-6 w-6 text-[#F2D5B8]" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-[0.06em] uppercase text-[#E7D3AF] [text-shadow:0_2px_12px_rgba(0,0,0,0.9),0_1px_0_rgba(0,0,0,0.95),0_0_30px_rgba(201,151,42,0.15)]">
          Stable Lords
        </h1>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-xs mx-auto opacity-70">
          Build a stable. Train warriors. Fight for glory. Forge legends in the arena.
        </p>
      </div>

      <div className="flex items-center gap-3 px-4">
        <div className="flex-1 h-px bg-[linear-gradient(90deg,transparent,rgba(201,151,42,0.3))]" />
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-[rgba(201,151,42,0.5)]" />
          <Star className="h-2.5 w-2.5 text-[rgba(201,151,42,0.5)]" />
          <div className="w-1 h-1 bg-[rgba(201,151,42,0.5)]" />
        </div>
        <div className="flex-1 h-px bg-[linear-gradient(90deg,rgba(201,151,42,0.3),transparent)]" />
      </div>
    </div>
  );
}
