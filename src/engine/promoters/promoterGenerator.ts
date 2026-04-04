import { Promoter, PromoterPersonality } from "@/types/state.types";
import { FightingStyle } from "@/types/shared.types";
import { SeededRNG } from "@/utils/random";
import { generateId } from "@/utils/idUtils";

const PROMOTER_FIRST_NAMES = [
  "Silas", "Cassian", "Vesper", "Theron", "Marius", "Lucia", "Octavia", "Titus",
  "Flavia", "Gaius", "Livia", "Decimus", "Rufus", "Aurelia", "Quintilla", "Faustus",
  "Sextus", "Servius", "Manlius", "Vibius", "Spurius", "Appius", "Proculus", "Kaeso",
  "Tullia", "Hostia", "Graecina", "Claudia", "Fabia", "Junia", "Marcia", "Pomponia"
];

const PROMOTER_LAST_NAMES = [
  "Vane", "Blackwood", "Ironheart", "Sands", "Goldfinger", "Thorn", "Cross", "Bloodwell",
  "Shadowstep", "Stormborn", "Wolf", "Crow", "Vulture", "Serpent", "Lion", "Eagle",
  "Hawk", "Bear", "Boar", "Stag", "Raven", "Falcon", "Owl", "Drake",
  "Gale", "Frost", "Flint", "Steel", "Stone", "Ash", "Embers", "Pyre"
];

const PERSONALITIES: PromoterPersonality[] = ["Greedy", "Honorable", "Sadistic", "Flashy", "Corporate"];

export function generatePromoters(count: number, seed: number): Record<string, Promoter> {
  const rng = new SeededRNG(seed);
  const promoters: Record<string, Promoter> = {};

  const tiers: ("Local" | "Regional" | "National" | "Legendary")[] = [
    ...Array(15).fill("Local"),
    ...Array(8).fill("Regional"),
    ...Array(5).fill("National"),
    ...Array(2).fill("Legendary")
  ];

  for (let i = 0; i < count; i++) {
    const id = `promoter_${i}`;
    const firstName = rng.pick(PROMOTER_FIRST_NAMES);
    const lastName = rng.pick(PROMOTER_LAST_NAMES);
    const tier = tiers[i % tiers.length];

    promoters[id] = {
      id,
      name: `${firstName} ${lastName}`,
      age: 35 + rng.roll(0, 30),
      personality: rng.pick(PERSONALITIES),
      tier,
      capacity: tier === "Legendary" ? 2 : tier === "National" ? 4 : tier === "Regional" ? 6 : 10,
      biases: rng.shuffle(Object.values(FightingStyle)).slice(0, 2),
      history: {
        totalPursePaid: 0,
        notableBouts: [],
        legacyFame: 0
      }
    };
  }

  return promoters;
}
