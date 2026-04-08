import { Howl } from "howler";

/**
 * AudioManager — Central sound controller for the stable.
 * Uses Howler for high-performance audio playback.
 */

export type SfxType = "ui_click" | "hit" | "crit" | "clash" | "death" | "recovery" | "coin";

class AudioManager {
  private static instance: AudioManager;
  private sfx: Map<SfxType, Howl> = new Map();
  private amibent: Howl | null = null;
  private muted: boolean = false;

  private constructor() {
    this.muted = typeof localStorage !== "undefined" && localStorage.getItem("sl_muted") === "true";
    this.loadSfx();
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

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof localStorage !== "undefined") localStorage.setItem("sl_muted", String(muted));
  }

  public isMuted() {
    return this.muted;
  }
}

export const audioManager = AudioManager.getInstance();
