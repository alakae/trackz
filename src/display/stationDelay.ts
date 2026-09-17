export type DelaySeverity = "low" | "medium" | "high" | "unknown";

export interface StationDelaySummary {
  id: number;
  name: string;
  medianDelayMinutes: number | null;
  sampleSize: number;
  severity: DelaySeverity;
}

// Median departure delay, in minutes, below which a station counts as "low".
export const LOW_DELAY_THRESHOLD_MIN = 2;
// Median departure delay, in minutes, at or above which a station counts as "high".
export const HIGH_DELAY_THRESHOLD_MIN = 5;

export function classifyDelay(
  medianDelayMinutes: number | null,
): DelaySeverity {
  if (medianDelayMinutes === null) return "unknown";
  if (medianDelayMinutes < LOW_DELAY_THRESHOLD_MIN) return "low";
  if (medianDelayMinutes < HIGH_DELAY_THRESHOLD_MIN) return "medium";
  return "high";
}
