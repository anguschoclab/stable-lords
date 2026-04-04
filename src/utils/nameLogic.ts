import { SeededRNG } from "@/utils/random";

/**
 * Stable Lords — Name Logic
 * Utilities for generating dynastic and successor names.
 */

const HONORIFICS = ["II", "III", "IV", "Jr.", "the Younger", "the Heir", "V"];
const PREFIXES = ["Legacy of", "Blood of", "Protege of", "Shadow of"];

export function generateDynasticName(originalName: string, seed: number): string {
  const rng = new SeededRNG(seed);
  const roll = rng.next();

  if (roll < 0.6) {
    // Suffix style: Silas Blackwood II
    const suffix = rng.pick(HONORIFICS);
    return `${originalName} ${suffix}`;
  } else if (roll < 0.9) {
    // Prefix style: Legacy of Silas Blackwood
    const first = originalName.split(" ")[0];
    const prefix = rng.pick(PREFIXES);
    return `${prefix} ${first}`;
  } else {
    // Surname match: Lucius Blackwood
    const last = originalName.split(" ").slice(1).join(" ");
    const newFirst = ["Marcus", "Lucius", "Julius", "Titus", "Gaius", "Aurelius"];
    return `${rng.pick(newFirst)} ${last}`;
  }
}
