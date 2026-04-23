import { Howl } from 'howler';
import { STORE_KEYS } from '@/constants/storeKeys';

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

// Initialize HowlerGlobal for Electron environment
declare global {
  interface Window {
    HowlerGlobal?: any;
  }
}

export type SfxType =
  | 'ui_click'
  | 'hit'
  | 'crit'
  | 'clash'
  | 'death'
  | 'recovery'
  | 'coin'
  | 'arena_ambient';

class AudioManager {
  private static instance: AudioManager;
  private sfx: Map<SfxType, Howl> = new Map();
  private muted: boolean = false;

  private constructor() {
    // Initialize HowlerGlobal for Electron environment
    if (typeof window !== 'undefined' && typeof (window as any).HowlerGlobal === 'undefined') {
      (window as any).HowlerGlobal = {};
    }
    this.loadMuteState();
  }

  private async loadMuteState() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const muted = await window.electronAPI.storeGet(STORE_KEYS.AUDIO_MUTED);
        this.muted = muted === 'true';
      } catch {
        this.muted = false;
      }
    } else if (typeof localStorage !== 'undefined') {
      this.muted = localStorage.getItem(STORE_KEYS.AUDIO_MUTED) === 'true';
    }
  }

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  public play(type: SfxType) {
    if (this.muted) return;
    const sound = this.sfx.get(type);
    if (sound) sound.play();
  }

  public async setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.storeSet(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        console.error('Failed to save mute state to electron-store', error);
      }
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        if ((error as Error)?.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded when saving mute state', error);
          // Mute state is not critical, just log and continue
        } else {
          console.error('Failed to save mute state', error);
        }
      }
    }
  }

  public isMuted() {
    return this.muted;
  }
}

export const audioManager = AudioManager.getInstance();
