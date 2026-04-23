/**
 * RNG Service Module — Type Exports Only
 * To avoid circular dependencies during simulation, always import
 * implementations directly from their respective files.
 */

export type { IRNGService } from './IRNGService';
export type { IRNGContext } from './IRNGContext';
// implementations must be imported directly to avoid circularity
