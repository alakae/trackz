import { DisplayConnection } from "./displayConnection.ts";
import { StationBoardResponse } from "../api/stationBoardResponse.ts";
import { processConnections } from "./processConnections.ts";

interface StationBoardResult {
  connections: DisplayConnection[];
  stationName: string;
}

function isStationBoardResponse(data: unknown): data is StationBoardResponse {
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
): Promise<StationBoardResult> {
  const baseURL = "https://search.ch/timetable/api/stationboard.json";
  const now = new Date();
  now.setHours(now.getHours() - 2);
  const dateParam = now.toISOString().split("T")[0];
  const timeParam = now.toTimeString().split(" ")[0].substring(0, 5);
  const queryParams = `stop=${encodeURIComponent(label)}&show_tracks=1&show_delays=1&transportation_types=train&date=${dateParam}&time=${timeParam}`;

  const departureURL = `${baseURL}?${queryParams}&mode=departure`;
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
  };
}
