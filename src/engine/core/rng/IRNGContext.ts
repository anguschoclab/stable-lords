import { IRNGService } from "./IRNGService";

/**
 * RNG Context Interface
 * Provides a context for managing RNG instances with different seeds.
 * Enables hierarchical RNG contexts for deterministic simulation.
 */
export interface IRNGContext {
  /**
   * Gets an RNG service instance with the specified seed.
   * If no seed is provided, uses the base seed of the context.
   */
  getRNG(seed?: number): IRNGService;

  /**
   * Creates a child context with an offset seed.
   * Useful for creating isolated RNG contexts for subsystems.
   */
  createChild(seedOffset: number): IRNGContext;

  /**
   * Gets the base seed of this context.
   */
  getBaseSeed(): number;
}
