import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ParticleType = 'blood' | 'spark' | 'dust' | 'sweat';

interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface ParticleSystemProps {
  trigger: string | null; // Event type that triggers particles
  sourceX: number; // 0-100 arena position
  sourceY: number;
  className?: string;
}

export default function ParticleSystem({
  trigger,
  sourceX,
  sourceY,
  className,
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = [];
    const count = trigger === 'crit' ? 12 : trigger === 'death' ? 20 : 6;
    const type: ParticleType =
      trigger === 'crit' || trigger === 'death' ? 'blood' : trigger === 'hit' ? 'spark' : 'dust';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;

      newParticles.push({
        id: `${Date.now()}-${i}`,
        type,
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'blood' ? 1 : 0),
        life: 1,
        maxLife: 30 + Math.random() * 20,
        size: type === 'blood' ? 3 + Math.random() * 4 : 2 + Math.random() * 2,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }, [trigger, sourceX, sourceY]);

  // Animation loop
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.5,
            y: p.y + p.vy * 0.5,
            vy: p.vy + (p.type === 'blood' ? 0.15 : p.type === 'dust' ? -0.02 : 0),
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0);

        return updated;
      });
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [particles.length]);

  if (particles.length === 0) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={cn(
            'absolute rounded-full',
            p.type === 'blood' && 'bg-red-600',
            p.type === 'spark' && 'bg-yellow-400',
            p.type === 'dust' && 'bg-amber-700/60',
            p.type === 'sweat' && 'bg-blue-300/40'
          )}
          style={{
            left: `${p.x}%`,
            bottom: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.life / p.maxLife,
            transform: `translate(-50%, -50%)`,
          }}
        />
      ))}
    </div>
  );
}
