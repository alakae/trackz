import { Terminal } from "../api/terminal.ts";

export type Mode = "Departure" | "Arrival";

export interface DisplayConnection {
  time: string;
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
  arr_delay: string;
  dep_delay: string;
  mode: Mode;
}
