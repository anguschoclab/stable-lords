import { StateCreator } from 'zustand';
import {
  GameState,
  Warrior,
  PoolWarrior,
  DeathEvent,
  InsightToken,
  Trainer,
  TrainingAssignment,
  SeasonalGrowth,
  RestState,
} from '@/types/state.types';
import type { GameStore } from '@/state/useGameStore';
import {
  type WarriorId,
  type StableId,
  type InsightId,
  type ShieldSize,
} from '@/types/shared.types';

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
  unacknowledgedDeaths: WarriorId[];
  setRoster: (roster: Warrior[]) => void;
  addWarrior: (warrior: Warrior) => void;
  killWarrior: (
    warriorId: WarriorId,
    killedBy: string,
    cause: string,
    deathEvent?: DeathEvent
  ) => void;
  retireWarrior: (warriorId: WarriorId) => void;
  consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => void;
  updateWarriorEquipment: (
    warriorId: WarriorId,
    equipment: { weapon: string; armor: string; shield: string; helm: string }
  ) => void;
  renameWarrior: (warriorId: WarriorId, newName: string) => void;
  acknowledgeDeath: (warriorId: WarriorId) => void;
}

export const createRosterSlice: StateCreator<GameStore, [], [], RosterSlice> = (set, get) => ({
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

  addWarrior: (warrior) => set((state: GameStore) => ({ roster: [...state.roster, warrior] })),

  killWarrior: (warriorId, killedBy, cause, deathEvent) => {
    set((state: GameStore) => {
      const victim = state.roster.find((w: Warrior) => w.id === warriorId);
      if (!victim) return state;

      const dead: Warrior = {
        ...victim,
        status: 'Dead',
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
    set((state: GameStore) => {
      const warrior = state.roster.find((w: Warrior) => w.id === warriorId);
      if (!warrior) return state;

      const ret: Warrior = {
        ...warrior,
        status: 'Retired',
        retiredWeek: state.week,
      };

      return {
        roster: state.roster.filter((w: Warrior) => w.id !== warriorId),
        retired: [...state.retired, ret],
      };
    });
  },

  consumeInsightToken: (tokenId, warriorId) => {
    set((state: GameStore) => {
      const token = state.insightTokens?.find((t: InsightToken) => t.id === tokenId);
      if (!token) return state;

      const nextRoster = state.roster.map((w: Warrior) => {
        if (w.id !== warriorId) return w;

        const draft = { ...w };
        if (!draft.favorites) {
          draft.favorites = {
            weaponId: 'gladius',
            rhythm: { oe: 0.5, al: 0.5 },
            discovered: { weapon: false, rhythm: false, weaponHints: 0, rhythmHints: 0 },
          };
        }

        if (token.type === 'Weapon') {
          draft.favorites.discovered.weapon = true;
        } else if (token.type === 'Rhythm') {
          draft.favorites.discovered.rhythm = true;
        } else if (token.type === 'Style') {
          if (draft.baseSkills)
            draft.baseSkills = { ...draft.baseSkills, ATT: draft.baseSkills.ATT + 1 };
        } else if (token.type === 'Attribute') {
          const primaries = ['ST', 'WT', 'SP', 'DF'] as const;
          const attrKey = primaries[Math.floor(Math.random() * primaries.length)]!;
          draft.attributes = {
            ...draft.attributes,
            [attrKey]: (draft.attributes[attrKey] || 10) + 1,
          };
        } else if (token.type === 'Tactic') {
          draft.flair = [...(draft.flair || []), 'Tactical Insight'];
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
    set((state: GameStore) => {
      const nextRoster = state.roster.map((w: Warrior) => {
        if (w.id !== warriorId) return w;
        return {
          ...w,
          gear: {
            ...w.gear,
            weapon: { name: equipment.weapon },
            armor: equipment.armor,
            shield: equipment.shield as ShieldSize,
            helm: equipment.helm,
          },
        };
      });

      return { roster: nextRoster };
    });
  },

  renameWarrior: (warriorId, newName) => {
    set((state: GameStore) => {
      const updateList = (list: Warrior[]) =>
        list.map((w) => (w.id === warriorId ? { ...w, name: newName } : w));

      return {
        roster: updateList(state.roster),
        graveyard: updateList(state.graveyard),
        retired: updateList(state.retired),
      };
    });
  },

  acknowledgeDeath: (warriorId) => {
    set((state: GameStore) => ({
      unacknowledgedDeaths: (state.unacknowledgedDeaths || []).filter((id) => id !== warriorId),
    }));
  },
});
