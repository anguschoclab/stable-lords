import { useEffect, useRef, useState } from 'react';
import type { CrowdState } from '../crowd/CrowdReactions';

interface CrowdAudioProps {
  state: CrowdState;
  volume: number;
  enabled: boolean;
}

// Crowd audio trigger mapping
const CROWD_SOUNDS: Record<CrowdState, string | null> = {
  idle: null,
  anticipation: null,
  cheer: 'crowd-cheer-hit',
  roar: 'crowd-roar-crit',
  gasp: 'crowd-gasp',
  silence: null,
  chant: 'crowd-blood-moon',
};

export default function CrowdAudio({ state, volume, enabled }: CrowdAudioProps) {
  const lastStateRef = useRef<CrowdState>('idle');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enabled || !isInitialized) return;

    // Play one-shot for state transitions
    if (state !== lastStateRef.current) {
      const soundId = CROWD_SOUNDS[state];
      if (soundId) {
        // For now, use existing audio manager with volume adjustment
        // In full implementation, would load specific crowd sounds
        console.log(`[CrowdAudio] Would play: ${soundId} at ${volume * 100}% volume`);
      }
      lastStateRef.current = state;
    }
  }, [state, volume, enabled, isInitialized]);

  useEffect(() => {
    if (enabled) {
      setIsInitialized(true);
    }
  }, [enabled]);

  // This is a logic component - no visual output
  return null;
}
