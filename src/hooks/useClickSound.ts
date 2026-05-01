/**
 * useClickSound — Hook for tactile audio feedback
 * Plays ui_click sound on pointer down for interactive elements
 */
import { useCallback } from 'react';
import { audioManager } from '@/lib/AudioManager';

export function useClickSound() {
  const playClick = useCallback(() => {
    audioManager.play('ui_click');
  }, []);

  const withSound = useCallback(
    <T extends (...args: any[]) => any>(handler?: T): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        audioManager.play('ui_click');
        handler?.(...args);
      };
    },
    []
  );

  return { playClick, withSound };
}
