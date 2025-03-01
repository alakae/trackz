import { DisplayConnection } from "./display/displayConnection.ts";
import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import { processConnections } from "./processConnections.ts";

interface StationBoardResult {
  connections: DisplayConnection[];
  stationName: string;
}

export async function fetchStationBoard(
  label: string,
): Promise<StationBoardResult> {
  const [departureResponse, arrivalResponse] = await Promise.all([
    fetch(
      `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
        label,
      )}&show_tracks=1&show_delays=1&mode=departure&transportation_types=train`,
    ),
    fetch(
      `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
        label,
      )}&show_tracks=1&show_delays=1&mode=arrival&transportation_types=train`,
    ),
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
