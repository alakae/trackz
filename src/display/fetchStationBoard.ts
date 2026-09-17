import { DisplayConnection } from "./displayConnection.ts";
import { StationBoardResponse } from "../api/stationBoardResponse.ts";
import { processConnections } from "./processConnections.ts";

interface StationBoardResult {
  connections: DisplayConnection[];
  stationName: string;
  stop: StationBoardResponse["stop"];
  // The departure board as returned by search.ch, before processConnections
  // narrows it to the ±2 h window.
  departures: StationBoardResponse;
}

export interface StationBoardOptions {
  // Ask search.ch for each departure's onward stops (larger payload).
  withSubsequentStops?: boolean;
  // Cap on connections per request; search.ch otherwise returns ~24 h.
  limit?: number;
  // How far back the board starts. Defaults to two hours.
  lookBackMinutes?: number;
}

export function isStationBoardResponse(
  data: unknown,
): data is StationBoardResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "stop" in data &&
    "connections" in data &&
    Array.isArray((data as StationBoardResponse).connections)
  );
}

// search.ch's API sometimes returns HTTP 404 on a fully valid stationboard
// payload (seen for mode=arrival combined with show_tracks/show_delays on
// larger result sets), while genuine errors ("stop not found", etc.) come
// back as HTTP 200 with a "messages" array instead of stop/connections. So
// success is judged by the body shape rather than response.ok/status.
async function parseStationBoard(
  response: Response,
  label: string,
): Promise<StationBoardResponse> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to fetch ${label}: ${response.statusText}`);
  }

  if (!isStationBoardResponse(data)) {
    throw new Error(`Failed to fetch ${label}: ${response.statusText}`);
  }

  return data;
}

export async function fetchStationBoard(
  label: string,
  options: StationBoardOptions = {},
): Promise<StationBoardResult> {
  const { withSubsequentStops = false, limit, lookBackMinutes = 120 } = options;
  const baseURL = "https://search.ch/timetable/api/stationboard.json";
  const now = new Date();
  now.setMinutes(now.getMinutes() - lookBackMinutes);
  const dateParam = now.toISOString().split("T")[0];
  const timeParam = now.toTimeString().split(" ")[0].substring(0, 5);
  const queryParams =
    `stop=${encodeURIComponent(label)}&show_tracks=1&show_delays=1&transportation_types=train&date=${dateParam}&time=${timeParam}` +
    (limit ? `&limit=${limit}` : "");

  const departureURL =
    `${baseURL}?${queryParams}&mode=departure` +
    (withSubsequentStops ? "&show_subsequent_stops=1" : "");
  const arrivalURL = `${baseURL}?${queryParams}&mode=arrival`;

  const [departureResponse, arrivalResponse] = await Promise.all([
    fetch(departureURL),
    fetch(arrivalURL),
  ]);

  const [departureData, arrivalData] = await Promise.all([
    parseStationBoard(departureResponse, "departures"),
    parseStationBoard(arrivalResponse, "arrivals"),
  ]);

  return {
    connections: processConnections(departureData, arrivalData),
    stationName: departureData.stop.name,
    stop: departureData.stop,
    departures: departureData,
  };
}
