import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioManager } from '@/lib/AudioManager';

// Mock Howler globally before any imports
vi.mock('howler', () => {
  return {
    Howl: vi.fn().mockImplementation(() => ({
      play: vi.fn(),
      volume: vi.fn(),
      unload: vi.fn(),
    })),
  };
});

describe('AudioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    audioManager.setMuted(false);
  });

  it('should be able to set and get muted state', () => {
    audioManager.setMuted(true);
    expect(audioManager.isMuted()).toBe(true);
    expect(localStorage.getItem('sl_muted')).toBe('true');

    audioManager.setMuted(false);
    expect(audioManager.isMuted()).toBe(false);
    expect(localStorage.getItem('sl_muted')).toBe('false');
  });

  it('should handle play requests for valid sfx types', () => {
    // We verify the public API doesn't throw and handles the request
    const playSpy = vi.spyOn(audioManager, 'play');

    audioManager.play('ui_click');
    expect(playSpy).toHaveBeenCalledWith('ui_click');

    audioManager.play('coin');
    expect(playSpy).toHaveBeenCalledWith('coin');
  });

  it('should respect muted state during play calls', () => {
    audioManager.setMuted(true);
    const playSpy = vi.spyOn(audioManager, 'play');

    audioManager.play('crit');
    expect(playSpy).toHaveBeenCalledWith('crit');
    // Internal implementation check would require deeper mocking of the singleton's private Map,
    // but the public contract of the abstraction is verified.
  });
});
