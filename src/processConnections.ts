import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import { DisplayConnection, Mode } from "./display/displayConnection.ts";

const findMatchingDeparture = (
  arrival: DisplayConnection,
  departures: DisplayConnection[],
  allConnections: DisplayConnection[],
): DisplayConnection | undefined => {
  return departures.find((departure) => {
    // Check if same line and track
    if (
      arrival.line !== departure.line ||
      // arrival.track !== departure.track ||
      arrival["*Z"] !== departure["*Z"]
    ) {
      return false;
    }

    // Check if departure is at same time or after arrival
    const arrivalTime = new Date(arrival.time).getTime();
    const departureTime = new Date(departure.time).getTime();

    // Allow same time or up to 45 minutes difference
    if (
      departureTime < arrivalTime ||
      departureTime - arrivalTime > 45 * 60 * 1000
    ) {
      return false;
    }

    // Check if no other train uses the track in between
    const trackConflict = allConnections.some((conn) => {
      const connTime = new Date(conn.time).getTime();
      return (
        conn.track === arrival.track &&
        connTime > arrivalTime &&
        connTime < departureTime &&
        conn !== arrival &&
        conn !== departure
      );
    });

    return !trackConflict;
  });
};

export const processConnections = (
  departureData: StationBoardResponse,
  arrivalData: StationBoardResponse,
): DisplayConnection[] => {
  const now = new Date().getTime();
  const twoHoursFromNow = now + 2 * 60 * 60 * 1000;

  // Create combined list with source type
  const allConnections: DisplayConnection[] = [
    ...departureData.connections.map((conn) => ({
      ...conn,
      mode: "Departure" as Mode,
    })),
    ...arrivalData.connections.map((conn) => ({
      ...conn,
      mode: "Arrival" as Mode,
    })),
  ].filter((conn) => {
    const connTime = new Date(conn.time).getTime();
    return connTime >= now && connTime <= twoHoursFromNow;
  });

  // Sort by time
  allConnections.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const processedConnections: DisplayConnection[] = [];
  const usedConnections = new Set<DisplayConnection>();

  // Process arrivals to find passing trains
  const arrivals = allConnections.filter((conn) => conn.mode === "Arrival");
  const departures = allConnections.filter((conn) => conn.mode === "Departure");

  for (const arrival of arrivals) {
    if (usedConnections.has(arrival)) continue;

    const matchingDeparture = findMatchingDeparture(
      arrival,
      departures,
      allConnections,
    );

    if (matchingDeparture && !usedConnections.has(matchingDeparture)) {
      // Create a passing train entry
      processedConnections.push({
        ...matchingDeparture,
        mode: "Passing" as Mode,
        time: matchingDeparture.time,
        arr_delay: arrival.arr_delay,
        dep_delay: matchingDeparture.dep_delay,
      });

      usedConnections.add(arrival);
      usedConnections.add(matchingDeparture);
    } else {
      // Keep as regular arrival
      processedConnections.push(arrival);
      usedConnections.add(arrival);
    }
  }

  // Add remaining departures
  for (const departure of departures) {
    if (!usedConnections.has(departure)) {
      processedConnections.push(departure);
    }
  }

  return processedConnections.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
};
