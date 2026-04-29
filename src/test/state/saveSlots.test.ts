import { describe, it, expect } from 'vitest';
import { newSlotId } from '@/state/saveSlots';

describe('saveSlots', () => {
  describe('newSlotId', () => {
    it('should return a string', () => {
      const id = newSlotId();
      expect(typeof id).toBe('string');
    });

    it('should return unique IDs', () => {
      const id1 = newSlotId();
      const id2 = newSlotId();
      expect(id1).not.toBe(id2);
    });

    it('should return IDs starting with slot_', () => {
      const id = newSlotId();
      expect(id.startsWith('slot_')).toBe(true);
    });
  });
});
