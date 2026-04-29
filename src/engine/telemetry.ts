/**
 * Simple telemetry interface for batch advancement monitoring
 * Implement this interface in your application to collect metrics
 */

export interface TelemetryProvider {
  /** Record timing for an operation */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void;
  /** Increment a counter */
  increment(name: string, tags?: Record<string, string>): void;
  /** Record a gauge value */
  gauge(name: string, value: number, tags?: Record<string, string>): void;
}

// No-op provider for default behavior
const noopProvider: TelemetryProvider = {
  timing: () => {},
  increment: () => {},
  gauge: () => {},
};

let globalProvider: TelemetryProvider = noopProvider;

/**
 * Set the global telemetry provider
 */
export function setTelemetryProvider(provider: TelemetryProvider): void {
  globalProvider = provider;
}

/**
 * Get the current telemetry provider
 */
export function getTelemetryProvider(): TelemetryProvider {
  return globalProvider;
}

/**
 * Telemetry helper functions for batch advancement
 */
export const telemetry = {
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    globalProvider.timing(name, durationMs, tags);
  },
  increment(name: string, tags?: Record<string, string>): void {
    globalProvider.increment(name, tags);
  },
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    globalProvider.gauge(name, value, tags);
  },
};

// Named telemetry events for consistency
export const TelemetryEvents = {
  // Timing events
  ADVANCE_QUARTER: 'advance_quarter',
  ADVANCE_YEAR: 'advance_year',
  SKIP_TO_QUARTER_END: 'skip_to_quarter_end',
  SKIP_TO_YEAR_END: 'skip_to_year_end',
  FLUSH_DEFERRED_ARCHIVES: 'flush_deferred_archives',

  // Counter events
  ADVANCE_QUARTER_SUCCESS: 'advance_quarter_success',
  ADVANCE_QUARTER_ERROR: 'advance_quarter_error',
  ADVANCE_YEAR_SUCCESS: 'advance_year_success',
  ADVANCE_YEAR_ERROR: 'advance_year_error',
  STOP_CONDITION_TRIGGERED: 'stop_condition_triggered',

  // Gauge events
  FEATURE_FLAG_QUARTER: 'feature_flag_quarter',
  FEATURE_FLAG_YEAR: 'feature_flag_year',
  FEATURE_FLAG_HEADLESS: 'feature_flag_headless',
  DEFERRED_LOGS_COUNT: 'deferred_logs_count',
} as const;

// Common tag keys
export const TelemetryTags = {
  HEADLESS: 'headless',
  STOP_REASON: 'stop_reason',
  WEEKS_COMPLETED: 'weeks_completed',
  ERROR_TYPE: 'error_type',
} as const;
