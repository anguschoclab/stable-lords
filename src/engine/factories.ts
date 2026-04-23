/**
 * Factories Module - Re-exports from split factory modules
 * This file maintains backward compatibility while following SRP
 */

// Re-export from split modules
export { makeWarrior } from './factories/warriorFactory';
export { createFreshState } from './factories/gameStateFactory';
export { makeFightSummary } from './factories/combatFactory';
