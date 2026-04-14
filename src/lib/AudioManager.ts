import { Howl } from "howler";
import { STORE_KEYS } from "@/constants/storeKeys";

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

export type SfxType = "ui_click" | "hit" | "crit" | "clash" | "death" | "recovery" | "coin" | "arena_ambient";

class AudioManager {
  private static instance: AudioManager;
  private sfx: Map<SfxType, Howl> = new Map();
  private muted: boolean = false;

  private constructor() {
    this.loadSfx();
    this.loadMuteState();
  }

  private async loadMuteState() {
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        const muted = await window.electronAPI.storeGet(STORE_KEYS.AUDIO_MUTED);
        this.muted = muted === "true";
      } catch {
        this.muted = false;
      }
    } else if (typeof localStorage !== "undefined") {
      this.muted = localStorage.getItem(STORE_KEYS.AUDIO_MUTED) === "true";
    }
  }

  public static getInstance(): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager();
    }
    return this.instance;
  }

  private loadSfx() {
    const sfxMap: Record<SfxType, string> = {
      ui_click: "/audio/ui_click.mp3",
      hit:      "/audio/hit.mp3",
      crit:     "/audio/crit.mp3",
      clash:    "/audio/clash.mp3",
      death:    "/audio/death.mp3",
      recovery: "/audio/recovery.mp3",
      coin:     "/audio/coin.mp3",
      arena_ambient: "/audio/arena_ambient.mp3",
    };

    Object.entries(sfxMap).forEach(([key, url]) => {
      this.sfx.set(key as SfxType, new Howl({ src: [url], volume: 0.5 }));
    });
  }

  public play(type: SfxType) {
    if (this.muted) return;
    const sound = this.sfx.get(type);
    if (sound) sound.play();
  }

  public async setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        await window.electronAPI.storeSet(STORE_KEYS.AUDIO_MUTED, String(muted));
      } catch (error) {
        console.error('Failed to save mute state to electron-store', error);
      }
    } else if (typeof localStorage !== "undefined") {
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
