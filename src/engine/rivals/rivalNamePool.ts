/**
 * Rival Name Pool - Manages name pools for rivals
 * Extracted from rivals.ts to follow SRP
 */

const TRAINER_FIRST_NAMES = [
  "Aldric", "Brenna", "Caius", "Dara", "Eryx", "Fenna", "Galthor", "Hessa",
  "Ivor", "Jelena", "Korvin", "Lysa", "Maegor", "Nira", "Orvald", "Petra",
  "Quintus", "Rhea", "Soren", "Thessa", "Ulric", "Vala", "Wyrd", "Xara",
];

export { TRAINER_FIRST_NAMES };

const PHILOSOPHY_TO_FOCUS: Record<string, ("Aggression" | "Defense" | "Endurance" | "Mind" | "Healing")[]> = {
  "Brute Force": ["Aggression", "Aggression", "Endurance"],
  "Speed Kills": ["Aggression", "Mind", "Endurance"],
  "Iron Defense": ["Defense", "Defense", "Endurance"],
  "Balanced": ["Aggression", "Defense", "Mind", "Endurance"],
  "Spectacle": ["Aggression", "Mind", "Healing"],
  "Cunning": ["Mind", "Mind", "Defense"],
  "Endurance": ["Endurance", "Endurance", "Healing"],
  "Specialist": ["Aggression", "Defense", "Mind"],
};

export { PHILOSOPHY_TO_FOCUS };
