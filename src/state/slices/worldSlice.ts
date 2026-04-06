import { StateCreator } from "zustand";
import { 
  GameState, 
  Season, 
  WeatherType, 
  Promoter, 
  BoutOffer, 
  RivalStableData,
  GazetteStory
} from "@/types/state.types";

export interface WorldSlice {
  week: number;
  day: number;
  season: Season;
  weather: WeatherType;
  promoters: Record<string, Promoter>;
  boutOffers: Record<string, BoutOffer>;
  rivals: RivalStableData[];
  gazettes: GazetteStory[];
  setWeek: (week: number) => void;
}

export const createWorldSlice: StateCreator<any, [], [], WorldSlice> = (set) => ({
  week: 1,
  day: 0,
  season: "Spring" as Season,
  weather: "Clear" as WeatherType,
  promoters: {},
  boutOffers: {},
  rivals: [],
  gazettes: [],

  setWeek: (week) => set({ week }),
});
