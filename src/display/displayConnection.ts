// Base interface with common properties
import { Terminal } from "../api/terminal.ts";
import { SubsequentStop } from "../api/connection.ts";

export type Mode = "Departure" | "Arrival" | "Passing" | "Terminal";

interface BaseConnection {
  type: string;
  line: string;
  operator: string;
  color: string;
  type_name: string;
  terminal: Terminal;
  "*G": string;
  "*L": string;
  "*Z": string;
  track: string | undefined;
  changed_track: boolean;
  mode: Mode;
  // search.ch reports a cancellation as delay "X".
  cancelled?: boolean;
  // Onward stops; only present on departures fetched with them.
  subsequent_stops?: SubsequentStop[];
}

// Specific interfaces for each mode
export interface ArrivalConnection extends BaseConnection {
  mode: "Arrival";
  arrival_time: Date;
  arr_delay: number | undefined;
}

export interface DepartureConnection extends BaseConnection {
  mode: "Departure";
  departure_time: Date;
  dep_delay: number | undefined;
}

// The arrival and departure a joined entry was built from, so consumers can
// still reach e.g. where the train came from (a passing entry otherwise
// carries the departure's terminal) or the departure's onward stops.
interface JoinedLegs {
  arrival_leg: ArrivalConnection;
  departure_leg: DepartureConnection;
}

export interface PassingConnection extends BaseConnection, JoinedLegs {
  mode: "Passing";
  arrival_time: Date;
  departure_time: Date;
  arr_delay: number | undefined;
  dep_delay: number | undefined;
}

export interface TerminalConnection extends BaseConnection, JoinedLegs {
  mode: "Terminal";
  arrival_time: Date;
  departure_time: Date;
  arr_delay: number | undefined;
  dep_delay: number | undefined;
}

// Combined type for all connection types
export type DisplayConnection =
  | ArrivalConnection
  | DepartureConnection
  | PassingConnection
  | TerminalConnection;

export function getEffectiveArrivalTime(
  connection: ArrivalConnection | PassingConnection | TerminalConnection,
): Date {
  const delay = connection.arr_delay ?? 0;
  const effectiveTime = new Date(connection.arrival_time);
  effectiveTime.setMinutes(effectiveTime.getMinutes() + delay);
  return effectiveTime;
}

export function getEffectiveDepartureTime(
  connection: DepartureConnection | PassingConnection | TerminalConnection,
): Date {
  const delay = connection.dep_delay ?? 0;
  const effectiveTime = new Date(connection.departure_time);
  effectiveTime.setMinutes(effectiveTime.getMinutes() + delay);
  return effectiveTime;
}
