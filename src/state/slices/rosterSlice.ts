import { StateCreator } from "zustand";
import { GameState, Warrior, PoolWarrior } from "@/types/state.types";

export interface RosterSlice {
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  recruitPool: PoolWarrior[];
  rosterBonus: number;
  setRoster: (roster: Warrior[]) => void;
  addWarrior: (warrior: Warrior) => void;
}

export const createRosterSlice: StateCreator<any, [], [], RosterSlice> = (set) => ({
  roster: [],
  graveyard: [],
  retired: [],
  recruitPool: [],
  rosterBonus: 0,

  setRoster: (roster) => set({ roster }),
  addWarrior: (warrior) => set((state: any) => ({ roster: [...state.roster, warrior] })),
});
