import { describe, it, expect, beforeEach } from 'vitest';
import { NewsletterFeed } from '@/engine/newsletter/feed';
import type { FightCard } from '@/engine/newsletter/feed';
import type { FightSummary } from '@/types/combat.types';
import { makeFightSummary } from '@/engine/factories/combatFactory';
import { setMockIdGenerator } from '@/utils/idUtils';

describe('NewsletterFeed', () => {
  beforeEach(() => {
    NewsletterFeed.clear();
    setMockIdGenerator(() => 'mock-id');
  });

  const createMockCard = (overrides: Partial<FightSummary> = {}): FightCard => ({
    summary: makeFightSummary(overrides),
    transcript: [],
  });

  it('should append a fight result', () => {
    const card = createMockCard();
    NewsletterFeed.appendFightResult(card);

    const issue = NewsletterFeed.closeWeekToIssue(1);
    expect(issue.fights).toHaveLength(1);
    expect(issue.fights[0]).toEqual(card);
  });

  it('should clear the feed properly', () => {
    NewsletterFeed.appendFightResult(createMockCard());
    NewsletterFeed.clear();

    const issue = NewsletterFeed.closeWeekToIssue(1);
    expect(issue.fights).toHaveLength(0);
  });

  it('should calculate correct style rollups', () => {
    // A wins vs D
    NewsletterFeed.appendFightResult(
      createMockCard({
        styleA: 'Brawler' as any,
        styleD: 'Speed' as any,
        winner: 'A',
        by: 'KO',
      })
    );
    // D wins vs A
    NewsletterFeed.appendFightResult(
      createMockCard({
        styleA: 'Speed' as any,
        styleD: 'Power' as any,
        winner: 'D',
        by: 'Kill',
      })
    );

    const issue = NewsletterFeed.closeWeekToIssue(1);

    expect(issue.styleRollups['Brawler'].fights).toBe(1);
    expect(issue.styleRollups['Brawler'].w).toBe(1);
    expect(issue.styleRollups['Brawler'].pct).toBe(100);

    expect(issue.styleRollups['Speed'].fights).toBe(2);
    expect(issue.styleRollups['Speed'].l).toBe(2);
    expect(issue.styleRollups['Speed'].pct).toBe(0);

    expect(issue.styleRollups['Power'].fights).toBe(1);
    expect(issue.styleRollups['Power'].w).toBe(1);
    expect(issue.styleRollups['Power'].k).toBe(1);
    expect(issue.styleRollups['Power'].pct).toBe(100);
  });

  it('should compute top movers based on fame + pop delta', () => {
    NewsletterFeed.appendFightResult(
      createMockCard({
        a: 'Fighter 1',
        d: 'Fighter 2',
        fameDeltaA: 10,
        popularityDeltaA: 5,
        fameDeltaD: -5,
        popularityDeltaD: -2,
      })
    );
    NewsletterFeed.appendFightResult(
      createMockCard({
        a: 'Fighter 3',
        d: 'Fighter 1',
        fameDeltaA: 20,
        popularityDeltaA: 10,
        fameDeltaD: 5,
        popularityDeltaD: 2, // Fighter 1 gets another +7
      })
    );

    const issue = NewsletterFeed.closeWeekToIssue(1);

    expect(issue.highlights.topMovers).toBeDefined();
    const movers = issue.highlights.topMovers!;

    // F3 total delta = 30
    // F1 total delta = 15 + 7 = 22
    // F2 total delta = -7
    expect(movers[0].name).toBe('Fighter 3');
    expect(movers[1].name).toBe('Fighter 1');
    expect(movers[2].name).toBe('Fighter 2');
  });

  it('should score fights correctly for Fight of the Week', () => {
    NewsletterFeed.appendFightResult(
      createMockCard({
        id: 'boring-fight',
        by: 'Decision' as any,
      })
    ); // 0 points

    NewsletterFeed.appendFightResult(
      createMockCard({
        id: 'draw-fight',
        by: 'Draw' as any,
      })
    ); // 1 point

    NewsletterFeed.appendFightResult(
      createMockCard({
        id: 'flashy-ko-fight',
        by: 'KO',
        flashyTags: ['Flashy'],
      })
    ); // 2 (KO) + 2 (Flashy) = 4 points

    NewsletterFeed.appendFightResult(
      createMockCard({
        id: 'epic-comeback-kill',
        by: 'Kill',
        flashyTags: ['Comeback', 'Flashy'],
      })
    ); // 3 (Kill) + 3 (Comeback) + 2 (Flashy) = 8 points

    const issue = NewsletterFeed.closeWeekToIssue(1);

    expect(issue.highlights.fightOfTheWeekId).toBe('epic-comeback-kill');
  });

  it('should create issue with correct week and empty state if no fights', () => {
    const issue = NewsletterFeed.closeWeekToIssue(42);

    expect(issue.week).toBe(42);
    expect(issue.id).toBe('issue_42');
    expect(issue.fights).toHaveLength(0);
    expect(issue.highlights.fightOfTheWeekId).toBeNull();
    expect(issue.highlights.topMovers).toEqual([]);
    expect(Object.keys(issue.styleRollups)).toHaveLength(0);
  });
});
