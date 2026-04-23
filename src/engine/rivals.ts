/**
 * Rivals Module - Re-exports from split rival modules
 * This file maintains backward compatibility while following SRP
 */

// Re-export from split modules
export { getStableTemplates, generateRivalStables } from './rivals/rivalStableFactory';
export { biasedAttrs, createRivalWarrior } from './rivals/rivalWarriorFactory';
export { generateStableTrainers } from './rivals/rivalTrainerFactory';
export {
  pickRivalOpponent,
  generateRivalryNarrative,
  calculateRivalryScore,
} from './rivals/rivalUtils';
