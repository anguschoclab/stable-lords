import { StateCreator } from "zustand";
import { GameState, Warrior, PoolWarrior, DeathEvent, InsightToken, Trainer, TrainingAssignment, SeasonalGrowth, RestState } from "@/types/state.types";

export interface RosterSlice {
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  recruitPool: PoolWarrior[];
  insightTokens: InsightToken[];
  trainers: Trainer[];
  hiringPool: Trainer[];
  trainingAssignments: TrainingAssignment[];
  seasonalGrowth: SeasonalGrowth[];
  restStates: RestState[];
  rosterBonus: number;
  unacknowledgedDeaths: string[];
  setRoster: (roster: Warrior[]) => void;
  addWarrior: (warrior: Warrior) => void;
  killWarrior: (warriorId: string, killedBy: string, cause: string, deathEvent?: DeathEvent) => void;
  retireWarrior: (warriorId: string) => void;
  consumeInsightToken: (tokenId: string, warriorId: string) => void;
  updateWarriorEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => void;
  renameWarrior: (warriorId: string, newName: string) => void;
}

export const createRosterSlice: StateCreator<any, [], [], RosterSlice> = (set, get) => ({
  roster: [],
  graveyard: [],
  retired: [],
  recruitPool: [],
  insightTokens: [],
  trainers: [],
  hiringPool: [],
  trainingAssignments: [],
  seasonalGrowth: [],
  restStates: [],
  rosterBonus: 0,
  unacknowledgedDeaths: [],

  setRoster: (roster) => set({ roster }),

  addWarrior: (warrior) => set((state: any) => ({ roster: [...state.roster, warrior] })),

  killWarrior: (warriorId, killedBy, cause, deathEvent) => {
    set((state: any) => {
      const victim = state.roster.find((w: Warrior) => w.id === warriorId);
      if (!victim) return state;

      const dead: Warrior = {
        ...victim,
        status: "Dead",
        deathWeek: state.week,
        deathCause: cause,
        killedBy,
        deathEvent,
        isDead: true,
        dateOfDeath: `Week ${state.week}, ${state.season}`,
        causeOfDeath: cause,
      };

      return {
        roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
        graveyard: [...state.graveyard, dead],
        unacknowledgedDeaths: [...(state.unacknowledgedDeaths || []), warriorId],
      };
    });
  },

  retireWarrior: (warriorId) => {
    set((state: any) => {
      const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
      if (!warrior) return state;

      const ret: Warrior = {
        ...warrior,
        status: "Retired",
        retiredWeek: state.week,
      };

      return {
        roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
        retired: [...state.retired, ret],
      };
    });
  },

  consumeInsightToken: (tokenId, warriorId) => {
    set((state: any) => {
      const token = state.insightTokens?.find((t: InsightToken) => t.id === tokenId);
      if (!token) return state;

      const nextRoster = state.roster.map((w: Warrior) => {
        if (w.id !== warriorId) return w;
        
        const draft = { ...w };
        if (!draft.favorites) {
           draft.favorites = {
             weaponId: "gladius",
             rhythm: { oe: 0.5, al: 0.5 },
             discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 }
           };
        }

        if (token.type === "Weapon") {
          draft.favorites.discovered.weapon = true;
        } else if (token.type === "Rhythm") {
          draft.favorites.discovered.rhythm = true;
        }

        return draft;
      });

      return {
        roster: nextRoster,
        insightTokens: state.insightTokens.filter((t: InsightToken) => t.id !== tokenId),
      };
    });
  },

  updateWarriorEquipment: (warriorId, equipment) => {
    set((state: any) => {
      const nextRoster = state.roster.map((w: Warrior) => {
        if (w.id !== warriorId) return w;
        return {
          ...w,
          gear: {
            ...w.gear,
            weapon: { name: equipment.weapon },
            armor: equipment.armor,
            shield: equipment.shield as any,
            helm: equipment.helm,
          }
        };
      });

      return { roster: nextRoster };
    });
  },

  renameWarrior: (warriorId, newName) => {
    set((state: any) => {
      const updateList = (list: Warrior[]) => list.map(w => w.id === warriorId ? { ...w, name: newName } : w);
      
      return {
        roster: updateList(state.roster),
        graveyard: updateList(state.graveyard),
        retired: updateList(state.retired),
      };
    });
  },
});
