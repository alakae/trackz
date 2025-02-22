// Base interface with common properties
import { Terminal } from "../api/terminal.ts";

export type Mode = "Departure" | "Arrival" | "Passing";

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
  track: string;
  mode: Mode;
}

// Specific interfaces for each mode
export interface ArrivalConnection extends BaseConnection {
  mode: "Arrival";
  arrival_time: string;
  arr_delay: string;
}

export interface DepartureConnection extends BaseConnection {
  mode: "Departure";
  departure_time: string;
  dep_delay: string;
}

export interface PassingConnection extends BaseConnection {
  mode: "Passing";
  arrival_time: string;
  departure_time: string;
  arr_delay: string;
  dep_delay: string;
}

// Combined type for all connection types
export type DisplayConnection =
  | ArrivalConnection
  | DepartureConnection
  | PassingConnection;
