import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import {
  ArrivalConnection,
  DepartureConnection,
  DisplayConnection,
  PassingConnection,
  TerminalConnection,
} from "./display/displayConnection.ts";

const findMatchingDeparture = (
  arrival: ArrivalConnection,
  departures: DepartureConnection[],
  allConnections: DisplayConnection[],
): DepartureConnection | undefined => {
  return departures.find((departure) => {
    if (arrival.line !== departure.line || arrival["*Z"] !== departure["*Z"]) {
      return false;
    }

    const arrivalTime = new Date(arrival.arrival_time).getTime();
    const departureTime = new Date(departure.departure_time).getTime();

    if (
      departureTime < arrivalTime ||
      departureTime - arrivalTime > 45 * 60 * 1000
    ) {
      return false;
    }

    const trackConflict = allConnections.some((conn) => {
      const connTime = new Date(
        conn.mode === "Departure" ? conn.departure_time : conn.arrival_time,
      ).getTime();
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

const findMatchingTerminalDeparture = (
  arrival: ArrivalConnection,
  departures: DepartureConnection[],
  allConnections: DisplayConnection[],
): DepartureConnection | undefined => {
  return departures.find((departure) => {
    // Match line and train number
    if (arrival.line !== departure.line) {
      return false;
    }

    const arrivalTime = new Date(arrival.arrival_time).getTime();
    const departureTime = new Date(departure.departure_time).getTime();

    // Check if departure is within 1h30m window
    if (
      departureTime < arrivalTime ||
      departureTime - arrivalTime > 90 * 60 * 1000 // 1h30m in milliseconds
    ) {
      return false;
    }

    // Check for track conflicts between arrival and departure
    const trackConflict = allConnections.some((conn) => {
      const connTime = new Date(
        conn.mode === "Departure" ? conn.departure_time : conn.arrival_time,
      ).getTime();
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
      type: conn.type,
      operator: conn.operator,
      line: conn.line,
      color: conn.color,
      type_name: conn.type_name,
      terminal: conn.terminal,
      "*G": conn["*G"],
      "*L": conn["*L"],
      "*Z": conn["*Z"],
      track: parseInt(conn.track, 10) || undefined,
      changed_track: conn.track?.includes("!"),
      mode: "Departure" as const,
      departure_time: new Date(conn.time), // Map time to departure_time
      dep_delay:
        parseInt(conn.dep_delay?.replace("+", "") || "0", 10) || undefined,
    })),
    ...arrivalData.connections.map((conn) => ({
      type: conn.type,
      operator: conn.operator,
      line: conn.line,
      color: conn.color,
      type_name: conn.type_name,
      terminal: conn.terminal,
      "*G": conn["*G"],
      "*L": conn["*L"],
      "*Z": conn["*Z"],
      track: parseInt(conn.track, 10) || undefined,
      changed_track: conn.track?.includes("!"),
      mode: "Arrival" as const,
      arrival_time: new Date(conn.time), // Map time to arrival_time
      arr_delay:
        parseInt(conn.arr_delay?.replace("+", "") || "0", 10) || undefined,
    })),
  ].filter((conn) => {
    const connTime = new Date(
      conn.mode === "Departure" ? conn.departure_time : conn.arrival_time,
    ).getTime();
    return connTime >= now && connTime <= twoHoursFromNow;
  });

  // Sort by time
  allConnections.sort((a, b) => {
    const timeA = new Date(
      a.mode === "Departure" ? a.departure_time : a.arrival_time,
    ).getTime();
    const timeB = new Date(
      b.mode === "Departure" ? b.departure_time : b.arrival_time,
    ).getTime();
    return timeA - timeB;
  });

  const processedConnections: DisplayConnection[] = [];
  const usedConnections = new Set<DisplayConnection>();

  // Process arrivals to find passing trains
  const arrivals = allConnections.filter(
    (conn): conn is ArrivalConnection => conn.mode === "Arrival",
  );
  const departures = allConnections.filter(
    (conn): conn is DepartureConnection => conn.mode === "Departure",
  );

  for (const arrival of arrivals) {
    if (usedConnections.has(arrival)) continue;

    // First try to match as passing train (existing logic)
    const matchingDeparture = findMatchingDeparture(
      arrival,
      departures,
      allConnections,
    );

    if (matchingDeparture && !usedConnections.has(matchingDeparture)) {
      // Create passing train entry (existing logic)
      const passingConnection: PassingConnection = {
        ...matchingDeparture,
        mode: "Passing",
        arrival_time: arrival.arrival_time,
        departure_time: matchingDeparture.departure_time,
        arr_delay: arrival.arr_delay,
        dep_delay: matchingDeparture.dep_delay,
      };

      processedConnections.push(passingConnection);
      usedConnections.add(arrival);
      usedConnections.add(matchingDeparture);
    } else {
      // Try to match as a terminating train with later departure
      const matchingTerminalDeparture = findMatchingTerminalDeparture(
        arrival,
        departures,
        allConnections,
      );

      if (
        matchingTerminalDeparture &&
        !usedConnections.has(matchingTerminalDeparture)
      ) {
        // Create a terminal connection that combines both arrival and departure
        const terminalConnection: TerminalConnection = {
          ...arrival,
          mode: "Terminal",
          arrival_time: arrival.arrival_time,
          departure_time: matchingTerminalDeparture.departure_time,
          arr_delay: arrival.arr_delay,
          dep_delay: matchingTerminalDeparture.dep_delay,
        };

        processedConnections.push(terminalConnection);
        usedConnections.add(arrival);
        usedConnections.add(matchingTerminalDeparture);
      } else {
        // No match found, add as standalone arrival
        processedConnections.push(arrival);
        usedConnections.add(arrival);
      }
    }
  }

  // Add remaining departures
  for (const departure of departures) {
    if (!usedConnections.has(departure)) {
      processedConnections.push(departure);
    }
  }

  // Sort by arrival_time or departure_time
  return processedConnections.sort((a, b) => {
    const timeA = new Date(
      a.mode === "Departure" ? a.departure_time : a.arrival_time,
    ).getTime();
    const timeB = new Date(
      b.mode === "Departure" ? b.departure_time : b.arrival_time,
    ).getTime();
    return timeA - timeB;
  });
};
