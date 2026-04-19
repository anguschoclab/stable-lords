import type { StateImpact } from "../core/types";
import { MERGE_CONFIG } from "../core/config";
import { accumulateMerge, appendMerge, mapMerge, replaceMerge } from "../core/mergeStrategies";

export function mergeImpacts(impacts: StateImpact[]): StateImpact {
  const merged: StateImpact = {} as StateImpact;

  // Initialize merged with default values
  (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach(key => {
    const config = MERGE_CONFIG[key];
    if (Array.isArray(config.defaultValue)) {
      (merged as any)[key] = [...config.defaultValue];
    } else if (config.defaultValue instanceof Map) {
      (merged as any)[key] = new Map(config.defaultValue);
    } else {
      (merged as any)[key] = config.defaultValue;
    }
  });

  for (const imp of impacts) {
    (Object.keys(MERGE_CONFIG) as Array<keyof StateImpact>).forEach(key => {
      const config = MERGE_CONFIG[key];
      const value = imp[key];
      if (value === undefined || value === null) return;

      switch (config.strategy) {
        case 'accumulate':
          accumulateMerge(merged, key, value);
          break;
        case 'append':
          appendMerge(merged, key, value);
          break;
        case 'mapMerge':
          mapMerge(merged, key, value);
          break;
        case 'replace':
          replaceMerge(merged, key, value);
          break;
      }
    });
  }

  return merged;
}
