import { describe, it, expect, beforeEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  beforeEach(() => {
    // Mock environment already sets up a mock for localStorage, but let's clear it
    localStorage.clear();
  });

  describe('addFight', () => {
    it('records a weekly fight correctly (Attacker wins)', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Slash',
        styleD: 'Bash',
        winner: 'A',
        by: 'Kill'
      });

      const week1 = StyleRollups.getWeekRollup(1);

      expect(week1['Slash']).toMatchObject({ w: 1, l: 0, k: 1, fights: 1, pct: 1 });
      expect(week1['Bash']).toMatchObject({ w: 0, l: 1, k: 0, fights: 1, pct: 0 });
    });

    it('records a weekly fight correctly (Defender wins without kill)', () => {
      StyleRollups.addFight({
        week: 2,
        styleA: 'Slash',
        styleD: 'Bash',
        winner: 'D',
        by: 'Surrender'
      });

      const week2 = StyleRollups.getWeekRollup(2);

      expect(week2['Slash']).toMatchObject({ w: 0, l: 1, k: 0, fights: 1, pct: 0 });
      expect(week2['Bash']).toMatchObject({ w: 1, l: 0, k: 0, fights: 1, pct: 1 });
    });

    it('handles null winners', () => {
      StyleRollups.addFight({
        week: 3,
        styleA: 'Slash',
        styleD: 'Bash',
        winner: null,
        by: 'Draw'
      });

      const week3 = StyleRollups.getWeekRollup(3);

      // Both get a fight, but no wins/losses
      expect(week3['Slash']).toMatchObject({ w: 0, l: 0, k: 0, fights: 1, pct: 0 });
      expect(week3['Bash']).toMatchObject({ w: 0, l: 0, k: 0, fights: 1, pct: 0 });
    });

    it('maintains a rolling window of max 10 fights', () => {
      // Add 12 fights for Slash
      for (let i = 0; i < 12; i++) {
        StyleRollups.addFight({
          week: 1,
          styleA: 'Slash',
          styleD: 'Bash', // Bash loses 12 times
          winner: 'A',
          by: i % 2 === 0 ? 'Kill' : 'Surrender' // 6 kills
        });
      }

      const last10 = StyleRollups.last10();

      const slashStats = last10.find(s => s.style === 'Slash');
      const bashStats = last10.find(s => s.style === 'Bash');

      expect(slashStats).toBeDefined();
      expect(slashStats?.fights).toBe(10); // Only 10 fights max
      expect(slashStats?.W).toBe(10);
      expect(slashStats?.L).toBe(0);
      expect(slashStats?.P).toBe(100);

      expect(bashStats).toBeDefined();
      expect(bashStats?.fights).toBe(10); // Only 10 fights max
      expect(bashStats?.W).toBe(0);
      expect(bashStats?.L).toBe(10);
      expect(bashStats?.P).toBe(0);
    });

    it('tracks tournament stats correctly', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Poke',
        styleD: 'Bash',
        winner: 'A',
        by: 'Kill',
        isTournament: 'tour_1'
      });

      StyleRollups.addFight({
        week: 1,
        styleA: 'Poke',
        styleD: 'Slash',
        winner: 'D',
        by: 'Surrender',
        isTournament: 'tour_1'
      });

      // Different tournament
      StyleRollups.addFight({
        week: 1,
        styleA: 'Poke',
        styleD: 'Slash',
        winner: 'A',
        by: 'Kill',
        isTournament: 'tour_2'
      });

      const tour1Stats = StyleRollups.tournament('tour_1');
      const pokeTour1 = tour1Stats.find(s => s.style === 'Poke');

      expect(pokeTour1).toBeDefined();
      expect(pokeTour1?.fights).toBe(2);
      expect(pokeTour1?.W).toBe(1);
      expect(pokeTour1?.L).toBe(1);
      expect(pokeTour1?.K).toBe(1);
      expect(pokeTour1?.P).toBe(50); // 1 win / 2 fights = 50%

      const tour2Stats = StyleRollups.tournament('tour_2');
      const pokeTour2 = tour2Stats.find(s => s.style === 'Poke');

      expect(pokeTour2).toBeDefined();
      expect(pokeTour2?.fights).toBe(1);
      expect(pokeTour2?.W).toBe(1);
    });
  });
});
