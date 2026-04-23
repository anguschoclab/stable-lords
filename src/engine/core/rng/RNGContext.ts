import { IRNGContext } from './IRNGContext';
import { IRNGService } from './IRNGService';
import { SeededRNGService } from './SeededRNGService';

/**
 * RNG Context Implementation
 * Manages RNG instances with a base seed and supports child contexts.
 */
export class RNGContext implements IRNGContext {
  constructor(private baseSeed: number) {}

  getRNG(seed?: number): IRNGService {
    return new SeededRNGService(seed ?? this.baseSeed);
  }

  createChild(seedOffset: number): IRNGContext {
    return new RNGContext(this.baseSeed + seedOffset);
  }

  getBaseSeed(): number {
    return this.baseSeed;
  }
}
