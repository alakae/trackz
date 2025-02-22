import { StationBoardResponse } from "./api/stationBoardResponse.ts";

import { DisplayConnection, Mode } from "./display/displayConnection.ts";

export const processConnections = (
  departureData: StationBoardResponse,
  arrivalData: StationBoardResponse,
): DisplayConnection[] => {
  const now = new Date().getTime();
  const twoHoursFromNow = now + 2 * 60 * 60 * 1000;

  return [
    ...departureData.connections.map((conn) => ({
      ...conn,
      mode: "Departure" as Mode,
    })),
    ...arrivalData.connections.map((conn) => ({
      ...conn,
      mode: "Arrival" as Mode,
    })),
  ]
    .filter(
      (conn) =>
        new Date(conn.time).getTime() >= now &&
        new Date(conn.time).getTime() <= twoHoursFromNow,
    )
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};
