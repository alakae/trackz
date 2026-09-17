import { Station } from "../api/station.ts";
import { fetchMedianDepartureDelay } from "./fetchStationDelay.ts";
import { classifyDelay, StationDelaySummary } from "./stationDelay.ts";

// No "top stations in Switzerland" endpoint exists on search.ch's timetable
// API (completion.json is a term-keyed autocomplete only), so the list of
// major stations to show is curated by hand.
export const TOP_STATIONS = [
  "Zürich HB",
  "Genève",
  "Bern",
  "Basel SBB",
  "Lausanne",
  "Luzern",
  "Winterthur",
  "St. Gallen",
  "Lugano",
  "Biel/Bienne",
  "Zug",
  "Chur",
];

async function resolveStationId(name: string): Promise<Station> {
  const response = await fetch(
    `https://search.ch/timetable/api/completion.json?show_ids=1&term=${encodeURIComponent(name)}`,
  );
  const results: Station[] = await response.json();
  const match = results.find(
    (r) =>
      r.iconclass === "sl-icon-type-train" ||
      r.iconclass === "sl-icon-type-strain",
  );

  if (!match) {
    throw new Error(`No train station found for "${name}"`);
  }

  return match;
}

async function fetchStationDelaySummary(
  name: string,
): Promise<StationDelaySummary> {
  try {
    const station = await resolveStationId(name);
    const { medianDelayMinutes, sampleSize } = await fetchMedianDepartureDelay(
      station.id,
    );

    return {
      id: station.id,
      name,
      medianDelayMinutes,
      sampleSize,
      severity: classifyDelay(medianDelayMinutes),
    };
  } catch (error) {
    console.error(`Failed to fetch delay for station "${name}":`, error);
    return {
      id: -1,
      name,
      medianDelayMinutes: null,
      sampleSize: 0,
      severity: "unknown",
    };
  }
}

export async function fetchTopStationDelays(): Promise<StationDelaySummary[]> {
  return Promise.all(TOP_STATIONS.map(fetchStationDelaySummary));
}
