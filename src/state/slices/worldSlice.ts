import { StateCreator } from 'zustand';
import type { GameStore } from '@/state/useGameStore';
import {
  Season,
  WeatherType,
  Promoter,
  BoutOffer,
  RivalStableData,
  GazetteStory,
  Owner,
  ScoutReportData,
  CrowdMoodType,
  NewsletterItem,
  HallEntry,
  Rivalry,
  MatchRecord,
  OwnerGrudge,
} from '@/types/state.types';
import { FightSummary } from '@/types/combat.types';
import { truncateArray } from '@/utils/stateUtils';
import { updatePromoterHistory as engineUpdatePromoterHistory } from '@/engine/promoters';
import { respondToBoutOffer as engineRespondToBoutOffer } from '@/state/mutations/contractMutations';
import {
  type WarriorId,
  type StableId,
  type PromoterId,
  type BoutOfferId,
  type FightId,
  type TournamentId,
} from '@/types/shared.types';

export interface ArenaPreferences {
  defaultViewMode: 'log' | 'arena';
  audioEnabled: boolean;
  audioVolume: number;
  effectsEnabled: boolean;
  screenShakeIntensity: 'off' | 'low' | 'medium' | 'high';
}

export interface WorldSlice {
  year: number;
  week: number;
  day: number;
  season: Season;
  weather: WeatherType;
  promoters: Record<PromoterId, Promoter>;
  boutOffers: Record<BoutOfferId, BoutOffer>;
  rivals: RivalStableData[];
  gazettes: GazetteStory[];
  scoutReports: ScoutReportData[];
  arenaHistory: FightSummary[];
  newsletter: NewsletterItem[];
  hallOfFame: HallEntry[];
  crowdMood: CrowdMoodType;
  moodHistory: { week: number; mood: CrowdMoodType }[];
  settings: {
    featureFlags: {
      tournaments: boolean;
      scouting: boolean;
    };
  };
  arenaPreferences: ArenaPreferences;
  isFTUE: boolean;
  ftueStep?: number;
  ftueComplete: boolean;
  player: Owner;
  coachDismissed: string[];
  rivalries: Rivalry[];
  matchHistory: MatchRecord[];
  playerChallenges: string[];
  playerAvoids: string[];
  ownerGrudges: OwnerGrudge[];
  phase: 'planning' | 'resolution';
  setWeek: (week: number) => void;
  setArenaPreferences: (prefs: Partial<ArenaPreferences>) => void;
  initializeStable: (name: string, stableName: string) => void;
  appendFight: (summary: FightSummary) => void;
  updateBoutOfferStatus: (offerId: BoutOfferId, status: BoutOffer['status']) => void;
  respondToBoutOffer: (
    offerId: BoutOfferId,
    warriorId: WarriorId,
    response: 'Accepted' | 'Declined'
  ) => void;
  clearExpiredOffers: () => void;
  updatePromoterHistory: (promoterId: PromoterId, purse: number, boutId: FightId) => void;
  replacePromoter: (oldId: PromoterId, newPromoter: Promoter) => void;
  updateWarriorStatus: (
    warriorId: WarriorId,
    won: boolean,
    killed: boolean,
    fameDelta: number,
    popDelta: number,
    rivalStableId?: StableId
  ) => void;
  renameStable: (newName: string) => void;
  renamePlayer: (newName: string) => void;
}

export const createWorldSlice: StateCreator<GameStore, [], [], WorldSlice> = (set, get) => ({
  year: 1,
  week: 1,
  day: 0,
  season: 'Spring' as Season,
  weather: 'Clear' as WeatherType,
  promoters: {},
  boutOffers: {},
  rivals: [],
  gazettes: [],
  scoutReports: [],
  arenaHistory: [],
  newsletter: [],
  hallOfFame: [],
  crowdMood: 'Neutral' as CrowdMoodType,
  moodHistory: [],
  settings: {
    featureFlags: {
      tournaments: true,
      scouting: true,
    },
  },
  arenaPreferences: {
    defaultViewMode: 'arena',
    audioEnabled: true,
    audioVolume: 0.7,
    effectsEnabled: true,
    screenShakeIntensity: 'medium',
  },
  isFTUE: false,
  ftueComplete: false,
  player: {
    id: 'p1' as StableId,
    name: 'Rookie',
    stableName: 'Fresh Stable',
    fame: 0,
    renown: 0,
    titles: 0,
  },
  coachDismissed: [],
  rivalries: [],
  matchHistory: [],
  playerChallenges: [],
  playerAvoids: [],
  ownerGrudges: [],
  phase: 'planning',

  setWeek: (week) => set({ week }),

  setArenaPreferences: (prefs: Partial<ArenaPreferences>) => {
    set((draft: WorldSlice) => {
      draft.arenaPreferences = { ...draft.arenaPreferences, ...prefs };
    });
  },

  initializeStable: (name: string, stableName: string) => {
    set((state: WorldSlice) => ({
      player: {
        ...state.player,
        name,
        stableName,
      },
      treasury: 500, // Starts capital
    }));
  },

  appendFight: (summary: FightSummary) => {
    set((state: WorldSlice) => {
      const nextHistory = truncateArray([...state.arenaHistory, summary], 500).map(
        (f: FightSummary, i: number, arr: FightSummary[]) => {
          // Keep transcripts only for the last 20 fights to save memory
          if (arr.length - i > 20 && f.transcript) {
            const { transcript, ...rest } = f;
            return rest;
          }
          return f;
        }
      );

      return {
        arenaHistory: nextHistory,
      };
    });
  },

  updateBoutOfferStatus: (offerId, status) => {
    set((state: WorldSlice) => {
      if (!state.boutOffers[offerId]) return state;
      return {
        boutOffers: {
          ...state.boutOffers,
          [offerId]: { ...state.boutOffers[offerId], status },
        },
      };
    });
  },

  respondToBoutOffer: (offerId, warriorId, response) => {
    set((state) => engineRespondToBoutOffer(state, offerId, warriorId, response));
  },

  clearExpiredOffers: () => {
    set((state) => {
      const newOffers = { ...state.boutOffers };
      let changed = false;

      (Object.keys(newOffers) as BoutOfferId[]).forEach((id) => {
        const offer = newOffers[id];
        if (offer.status === 'Proposed' && state.week >= offer.expirationWeek) {
          newOffers[id] = { ...offer, status: 'Expired' };
          changed = true;
        }
      });

      return changed ? { boutOffers: newOffers } : state;
    });
  },

  updatePromoterHistory: (promoterId, purse, boutId) => {
    set((state) => engineUpdatePromoterHistory(state, promoterId, purse, boutId));
  },

  replacePromoter: (oldId, newPromoter) => {
    set((state: WorldSlice) => {
      const { [oldId]: removed, ...remainingPromoters } = state.promoters;
      const newPromoters = { ...remainingPromoters, [newPromoter.id]: newPromoter };

      return {
        promoters: newPromoters,
      };
    });
  },

  updateWarriorStatus: (warriorId, won, killed, fameDelta, popDelta, rivalStableId) => {
    set((state) => {
      if (rivalStableId) {
        return {
          rivals: state.rivals.map((r) =>
            r.owner.id === rivalStableId
              ? {
                  ...r,
                  roster: r.roster.map((w) =>
                    w.id === warriorId
                      ? {
                          ...w,
                          fame: Math.max(0, (w.fame || 0) + fameDelta),
                          popularity: Math.max(0, (w.popularity || 0) + popDelta),
                          career: {
                            ...w.career,
                            wins: (w.career?.wins || 0) + (won ? 1 : 0),
                            losses: (w.career?.losses || 0) + (won ? 0 : 1),
                            kills: (w.career?.kills || 0) + (killed ? 1 : 0),
                          },
                        }
                      : w
                  ),
                }
              : r
          ),
        };
      }

      return {
        roster: state.roster.map((w) =>
          w.id === warriorId
            ? {
                ...w,
                fame: Math.max(0, (w.fame || 0) + fameDelta),
                popularity: Math.max(0, (w.popularity || 0) + popDelta),
                career: {
                  ...w.career,
                  wins: (w.career?.wins || 0) + (won ? 1 : 0),
                  losses: (w.career?.losses || 0) + (won ? 0 : 1),
                  kills: (w.career?.kills || 0) + (killed ? 1 : 0),
                },
              }
            : w
        ),
      };
    });
  },

  renameStable: (newName: string) => {
    set((state: WorldSlice) => ({
      player: { ...state.player, stableName: newName },
    }));
  },

  renamePlayer: (newName: string) => {
    set((state: WorldSlice) => ({
      player: { ...state.player, name: newName },
    }));
  },
});
