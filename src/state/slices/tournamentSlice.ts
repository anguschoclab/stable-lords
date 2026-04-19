import { StateCreator } from "zustand";
import { TournamentEntry } from "@/types/state.types";
import { type TournamentId } from "@/types/shared.types";
import type { GameStore } from "@/state/useGameStore";

export interface TournamentSlice {
  tournaments: TournamentEntry[];
  isTournamentWeek: boolean;
  activeTournamentId?: TournamentId;
  setTournaments: (tournaments: TournamentEntry[]) => void;
  setTournamentWeek: (isTournamentWeek: boolean) => void;
  setActiveTournament: (id?: TournamentId) => void;
}

export const createTournamentSlice: StateCreator<GameStore, [], [], TournamentSlice> = (set) => ({
  tournaments: [],
  isTournamentWeek: false,
  activeTournamentId: undefined,

  setTournaments: (tournaments) => set({ tournaments }),
  setTournamentWeek: (isTournamentWeek) => set({ isTournamentWeek }),
  setActiveTournament: (activeTournamentId) => set({ activeTournamentId }),
});
