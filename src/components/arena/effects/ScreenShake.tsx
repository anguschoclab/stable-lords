import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScreenShakeProps {
  trigger: string | null;
  intensity?: 'low' | 'medium' | 'high';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function ScreenShake({
  trigger,
  intensity = 'medium',
  disabled = false,
  className,
  children,
}: ScreenShakeProps) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!trigger || disabled) {
      setIsShaking(false);
      return undefined;
    }

    // Only shake on crit or death
    if (trigger === 'crit' || trigger === 'death') {
      setIsShaking(true);
      const duration = intensity === 'high' ? 500 : intensity === 'medium' ? 400 : 300;

      const timer = setTimeout(() => {
        setIsShaking(false);
      }, duration);

      return () => clearTimeout(timer);
    }

    setIsShaking(false);
    return undefined;
  }, [trigger, intensity, disabled]);

  const shakeClass = {
    low: 'animate-shake-low',
    medium: 'animate-shake-medium',
    high: 'animate-shake-high',
  }[intensity];

  return (
    <div className={cn('transition-transform', isShaking && shakeClass, className)}>{children}</div>
  );
}
