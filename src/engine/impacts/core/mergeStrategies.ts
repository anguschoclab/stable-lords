import type { StateImpact } from "./types";

export function accumulateMerge(merged: any, key: keyof StateImpact, value: any) {
  if (typeof value === 'number') {
    merged[key] = (merged[key] || 0) + value;
  }
}

export function appendMerge(merged: any, key: keyof StateImpact, value: any) {
  if (Array.isArray(value)) {
    merged[key] = (merged[key] || []).concat(value);
  }
}

export function mapMerge(merged: any, key: keyof StateImpact, value: any) {
  if (value instanceof Map) {
    const targetMap = merged[key] as Map<string, object>;
    value.forEach((val, mapKey) => {
      const existing = targetMap.get(mapKey as string) || {};
      targetMap.set(mapKey as string, { ...existing, ...val });
    });
  }
}

export function replaceMerge(merged: any, key: keyof StateImpact, value: any) {
  merged[key] = value;
}
