import { DisplayConnection } from "./displayConnection.ts";
import { StationBoardResponse } from "../api/stationBoardResponse.ts";
import { processConnections } from "./processConnections.ts";

interface StationBoardResult {
  connections: DisplayConnection[];
  stationName: string;
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

  if (!departureResponse.ok) {
    throw new Error(
      `Failed to fetch departures: ${departureResponse.statusText}`,
    );
  }
  if (!arrivalResponse.ok) {
    throw new Error(`Failed to fetch arrivals: ${arrivalResponse.statusText}`);
  }

  const departureData: StationBoardResponse = await departureResponse.json();
  const arrivalData: StationBoardResponse = await arrivalResponse.json();

  return {
    connections: processConnections(departureData, arrivalData),
    stationName: departureData.stop.name,
  };
}
