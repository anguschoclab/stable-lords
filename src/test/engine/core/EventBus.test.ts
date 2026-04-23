import { describe, it, expect, vi } from 'vitest';
import { engineEventBus } from '@/engine/core/EventBus';

describe('EventBus', () => {
  it('should clear all subscribers successfully', () => {
    const handler = vi.fn();

    // Subscribe to the event bus
    const unsubscribe = engineEventBus.subscribe(handler);

    // Clear the event bus
    engineEventBus.clear();

    // Emit an event
    engineEventBus.emit({
      type: 'SEASON_CHANGED',
      payload: { prevSeason: 'Summer', newSeason: 'Autumn', year: 1 },
    });

    // Assert the handler was not called
    expect(handler).not.toHaveBeenCalled();

    // Cleanup
    unsubscribe();
  });
});
