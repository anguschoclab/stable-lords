import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { finalizeWeekSideEffectsToImpact } from '@/engine/bout/services/WeekFinalizationService';
import { GameState } from '@/types/state.types';
import * as crowdMoodMod from '@/engine/crowdMood';
import * as rivalryLogicMod from '@/engine/matchmaking/rivalryLogic';
import * as gazetteNarrativeMod from '@/engine/gazetteNarrative';
import * as historyUtilsMod from '@/engine/core/historyUtils';
import { NewsletterFeed } from '@/engine/newsletter/feed';

describe('WeekFinalizationService', () => {
  let originalComputeCrowdMood: any;
  let originalUpdateRivalriesFromBouts: any;
  let originalGenerateWeeklyGazette: any;
  let originalGetFightsForWeek: any;
  let originalCloseWeekToIssue: any;

  beforeEach(() => {
    originalComputeCrowdMood = crowdMoodMod.computeCrowdMood;
    originalUpdateRivalriesFromBouts = rivalryLogicMod.updateRivalriesFromBouts;
    originalGenerateWeeklyGazette = gazetteNarrativeMod.generateWeeklyGazette;
    originalGetFightsForWeek = historyUtilsMod.getFightsForWeek;
    originalCloseWeekToIssue = NewsletterFeed.closeWeekToIssue;

    vi.spyOn(crowdMoodMod, 'computeCrowdMood').mockReturnValue('Neutral');
    vi.spyOn(rivalryLogicMod, 'updateRivalriesFromBouts').mockReturnValue([]);
    vi.spyOn(gazetteNarrativeMod, 'generateWeeklyGazette').mockReturnValue('Mock Gazette' as any);
    vi.spyOn(historyUtilsMod, 'getFightsForWeek').mockReturnValue([]);
    vi.spyOn(NewsletterFeed, 'closeWeekToIssue').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('finalizeWeekSideEffectsToImpact', () => {
    it('calculates player fame gain based on results where winner is A and no rival stable is specified', () => {
      const state = {
        week: 1,
        arenaHistory: [],
        moodHistory: [],
        crowdMood: 'Neutral',
        graveyard: [],
      } as unknown as GameState;

      const results = [
        { outcome: { winner: 'A' }, rivalStable: undefined },
        { outcome: { winner: 'A' }, rivalStable: 'Rival1' },
        { outcome: { winner: 'B' }, rivalStable: undefined },
      ] as any[];

      const impact = finalizeWeekSideEffectsToImpact(state, results);
      expect(impact.fameDelta).toBe(1);
    });

    it('updates crowd mood and history, including newsletter item if mood changes', () => {
      vi.spyOn(crowdMoodMod, 'computeCrowdMood').mockReturnValue('Bloodthirsty');

      const state = {
        week: 10,
        arenaHistory: [],
        moodHistory: [{ week: 9, mood: 'Neutral' }],
        crowdMood: 'Neutral',
        graveyard: [],
      } as unknown as GameState;

      const results = [] as any[];

      const impact = finalizeWeekSideEffectsToImpact(state, results);

      expect(impact.crowdMood).toBe('Bloodthirsty');
      expect(impact.moodHistory).toEqual([
        { week: 9, mood: 'Neutral' },
        { week: 10, mood: 'Bloodthirsty' }
      ]);
      expect(impact.newsletterItems).toBeDefined();
      expect(impact.newsletterItems?.[0].title).toBe('Crowd Mood Shift: Neutral → Bloodthirsty');
    });

    it('calls gazette and rivalry logic with expected mock data', () => {
      const mockFights = [{ id: 'fight1' }];
      vi.spyOn(historyUtilsMod, 'getFightsForWeek').mockReturnValue(mockFights as any);

      const mockRivalries = [{ id: 'riv1' }];
      vi.spyOn(rivalryLogicMod, 'updateRivalriesFromBouts').mockReturnValue(mockRivalries as any);

      const state = {
        week: 15,
        arenaHistory: [],
        graveyard: [],
        moodHistory: [],
        crowdMood: 'Neutral',
        rivalries: [],
      } as unknown as GameState;

      const impact = finalizeWeekSideEffectsToImpact(state, []);

      expect(historyUtilsMod.getFightsForWeek).toHaveBeenCalledWith(state.arenaHistory, 15);
      expect(gazetteNarrativeMod.generateWeeklyGazette).toHaveBeenCalled();
      expect(rivalryLogicMod.updateRivalriesFromBouts).toHaveBeenCalled();
      expect(NewsletterFeed.closeWeekToIssue).toHaveBeenCalledWith(15);

      expect(impact.gazettes).toEqual(['Mock Gazette']);
      expect(impact.rivalries).toEqual(mockRivalries);
    });
  });
});
