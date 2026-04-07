import { StateCreator } from "zustand";
import { 
  Season, 
  WeatherType, 
  Promoter, 
  BoutOffer, 
  RivalStableData,
  GazetteStory,
  Owner,
  ScoutReportData
} from "@/types/state.types";
import { FightSummary } from "@/types/combat.types";
import { truncateArray } from "@/utils/stateUtils";
import { updatePromoterHistory as engineUpdatePromoterHistory } from "@/engine/promoters";

export interface WorldSlice {
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
  player: Owner;
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
  player: { id: "p1", name: "Rookie", stableName: "Fresh Stable", fame: 0, renown: 0, titles: 0 },

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
    set((state: any) => {
      const offer = state.boutOffers[offerId];
      if (!offer) return state;

      const newResponses = {
        ...offer.responses,
        [warriorId]: response,
      };

      // Check if all parties have responded
      let newStatus = offer.status;
      const allParticipatingWarriors = offer.warriorIds;
      const allResponded = allParticipatingWarriors.every((wid: string) => newResponses[wid] && newResponses[wid] !== "Pending");
      
      if (allResponded) {
        const anyDeclined = allParticipatingWarriors.some((wid: string) => newResponses[wid] === "Declined");
        newStatus = anyDeclined ? "Rejected" : "Signed";
      }

      return {
        boutOffers: {
          ...state.boutOffers,
          [offerId]: {
            ...offer,
            responses: newResponses,
            status: newStatus,
          },
        },
      };
    });
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
