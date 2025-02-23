// Base interface with common properties
import { Terminal } from "../api/terminal.ts";

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
  track: string;
  mode: Mode;
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

export interface PassingConnection extends BaseConnection {
  mode: "Passing";
  arrival_time: Date;
  departure_time: Date;
  arr_delay: number | undefined;
  dep_delay: number | undefined;
}

export interface TerminalConnection extends BaseConnection {
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
