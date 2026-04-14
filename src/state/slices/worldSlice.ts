import { StateCreator } from "zustand";
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
  HallEntry
} from "@/types/state.types";
import { FightSummary } from "@/types/combat.types";
import { truncateArray } from "@/utils/stateUtils";
import { updatePromoterHistory as engineUpdatePromoterHistory } from "@/engine/promoters";
import { respondToBoutOffer as engineRespondToBoutOffer } from "@/state/mutations/contractMutations";

export interface WorldSlice {
  year: number;
  week: number;
  day: number;
  season: Season;
  weather: WeatherType;
  promoters: Record<string, Promoter>;
  boutOffers: Record<string, BoutOffer>;
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
  isFTUE: boolean;
  ftueStep?: number;
  ftueComplete: boolean;
  player: Owner;
  coachDismissed: string[];
  rivalries: any[];
  matchHistory: any[];
  playerChallenges: string[];
  playerAvoids: string[];
  ownerGrudges: any[];
  phase: "planning" | "resolution";
  setWeek: (week: number) => void;
  initializeStable: (name: string, stableName: string) => void;
  appendFight: (summary: FightSummary) => void;
  updateBoutOfferStatus: (offerId: string, status: BoutOffer["status"]) => void;
  respondToBoutOffer: (offerId: string, warriorId: string, response: "Accepted" | "Declined") => void;
  clearExpiredOffers: () => void;
  updatePromoterHistory: (promoterId: string, purse: number, boutId: string) => void;
  replacePromoter: (oldId: string, newPromoter: Promoter) => void;
  updateWarriorStatus: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number, rivalStableId?: string) => void;
  renameStable: (newName: string) => void;
  renamePlayer: (newName: string) => void;
}

export const createWorldSlice: StateCreator<any, [], [], WorldSlice> = (set, get) => ({
  year: 1,
  week: 1,
  day: 0,
  season: "Spring" as Season,
  weather: "Clear" as WeatherType,
  promoters: {},
  boutOffers: {},
  rivals: [],
  gazettes: [],
  scoutReports: [],
  arenaHistory: [],
  newsletter: [],
  hallOfFame: [],
  crowdMood: "Neutral" as CrowdMoodType,
  moodHistory: [],
  settings: {
    featureFlags: {
      tournaments: true,
      scouting: true,
    },
  },
  isFTUE: false,
  ftueComplete: false,
  player: { id: "p1", name: "Rookie", stableName: "Fresh Stable", fame: 0, renown: 0, titles: 0 },
  coachDismissed: [],
  rivalries: [],
  matchHistory: [],
  playerChallenges: [],
  playerAvoids: [],
  ownerGrudges: [],
  phase: "planning",

  setWeek: (week) => set({ week }),

  initializeStable: (name: string, stableName: string) => {
    set((state: any) => ({
      player: {
        ...state.player,
        name,
        stableName,
      },
      treasury: 500, // Starts capital
    }));
  },

  appendFight: (summary: FightSummary) => {
    set((state: any) => {
      const nextHistory = truncateArray([...state.arenaHistory, summary], 500).map((f: FightSummary, i: number, arr: any[]) => {
        // Keep transcripts only for the last 20 fights to save memory
        if (arr.length - i > 20 && f.transcript) {
          const { transcript, ...rest } = f;
          return rest;
        }
        return f;
      });

      return {
        arenaHistory: nextHistory,
      };
    });
  },

  updateBoutOfferStatus: (offerId, status) => {
    set((state: any) => {
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
    set((state: any) => engineRespondToBoutOffer(state, offerId, warriorId, response));
  },

  clearExpiredOffers: () => {
    set((state: any) => {
      const newOffers = { ...state.boutOffers };
      let changed = false;

      for (const id of Object.keys(newOffers) as string[]) {
        const offer = newOffers[id];
        if (offer.status === "Proposed" && state.week >= offer.expirationWeek) {
          newOffers[id] = { ...offer, status: "Expired" };
          changed = true;
        }
      }

      return changed ? { boutOffers: newOffers } : state;
    });
  },

  updatePromoterHistory: (promoterId, purse, boutId) => {
    set((state: any) => engineUpdatePromoterHistory(state, promoterId, purse, boutId));
  },

  replacePromoter: (oldId, newPromoter) => {
    set((state: any) => {
      const newPromoters = { ...state.promoters };
      delete newPromoters[oldId];
      newPromoters[newPromoter.id] = newPromoter;

      return {
        promoters: newPromoters,
      };
    });
  },

  updateWarriorStatus: (warriorId, won, killed, fameDelta, popDelta, rivalStableId) => {
    set((state: any) => {
      if (rivalStableId) {
        return {
          rivals: state.rivals.map((r: any) => r.owner.id === rivalStableId
            ? {
                ...r,
                roster: r.roster.map((w: any) => w.id === warriorId
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
                  : w)
              }
            : r)
        };
      }

      return {
        roster: state.roster.map((w: any) => w.id === warriorId
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
          : w)
      };
    });
  },

  renameStable: (newName: string) => {
    set((state: any) => ({
      player: { ...state.player, stableName: newName }
    }));
  },

  renamePlayer: (newName: string) => {
    set((state: any) => ({
      player: { ...state.player, name: newName }
    }));
  }
});
