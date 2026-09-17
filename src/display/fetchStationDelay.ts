import { isStationBoardResponse } from "./fetchStationBoard.ts";

// Sampling further out than the next few departures dilutes the sample
// with connections that are still "on schedule" (predicted delay hasn't
// materialized yet) — near-term departures are where real delays show up.
export const DEPARTURES_SAMPLED_PER_STATION = 10;

function parseDelayMinutes(delay: string | undefined): number | undefined {
  if (delay === undefined) return undefined;
  const minutes = Number.parseInt(delay.replace("+", ""), 10);
  return Number.isNaN(minutes) ? undefined : minutes;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function fetchMedianDepartureDelay(
  stationId: number,
): Promise<{ medianDelayMinutes: number | null; sampleSize: number }> {
  const now = new Date();
  const dateParam = now.toISOString().split("T")[0];
  const timeParam = now.toTimeString().split(" ")[0].substring(0, 5);
  const url =
    `https://search.ch/timetable/api/stationboard.json?stop=${stationId}` +
    `&mode=departure&show_delays=1&transportation_types=train` +
    `&limit=${DEPARTURES_SAMPLED_PER_STATION}&date=${dateParam}&time=${timeParam}`;

  const response = await fetch(url);
  const data: unknown = await response.json();

  if (!isStationBoardResponse(data)) {
    throw new Error(`Failed to fetch stationboard: ${response.statusText}`);
  }

  const delays = data.connections
    .map((conn) => parseDelayMinutes(conn.dep_delay))
    .filter((delay): delay is number => delay !== undefined);

  if (delays.length === 0) {
    return { medianDelayMinutes: null, sampleSize: 0 };
  }

  return { medianDelayMinutes: median(delays), sampleSize: delays.length };
}
