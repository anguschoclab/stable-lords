import { StateCreator } from "zustand";
import { GameState, LedgerEntry, Promoter, BoutOffer, RankingEntry, AnnualAward } from "@/types/state.types";
import { canTransact as _canTransact } from "@/utils/economyUtils";

export interface EconomySlice {
  treasury: number;
  ledger: LedgerEntry[];
  fame: number;
  popularity: number;
  promoters: Record<string, Promoter>;
  boutOffers: Record<string, BoutOffer>;
  realmRankings: Record<string, RankingEntry>;
  awards: AnnualAward[];
  rosterBonus: number;
  addFunds: (amount: number, label: string, category: LedgerEntry["category"]) => void;
  deductFunds: (amount: number, label: string, category: LedgerEntry["category"]) => boolean;
}

export const createEconomySlice: StateCreator<any, [], [], EconomySlice> = (set, get) => ({
  treasury: 0,
  ledger: [],
  fame: 0,
  popularity: 0,
  promoters: {},
  boutOffers: {},
  realmRankings: {},
  awards: [],
  rosterBonus: 0,

  addFunds: (amount, label, category) => {
    set((state: any) => ({
      treasury: state.treasury + amount,
      ledger: [
        ...state.ledger,
        { week: state.week, label, amount, category }
      ]
    }));
  },

  deductFunds: (amount, label, category) => {
    if (!_canTransact(get().treasury, amount)) {
      return false;
    }

    set((state: any) => ({
      treasury: state.treasury - amount,
      ledger: [
        ...state.ledger,
        { week: state.week, label, amount: -amount, category }
      ]
    }));
    return true;
  }
});
