import { Terminal } from "./terminal.ts";

export interface Connection {
  time: string; // Format: "YYYY-MM-DD HH:mm:ss"
  type: string; // e.g., "strain"
  line: string; // e.g., "S40", "S13"
  operator: string; // e.g., "SOB-sob"
  color: string; // e.g., "039~fff~"
  type_name: string; // e.g., "S-Bahn"
  terminal: Terminal; // destination station details
  "*G": string; // e.g., "S"
  "*L": string; // e.g., "40", "13"
  "*Z": string; // e.g., "016951"
  track: string; // e.g., "6"
  arr_delay: string; // e.g., "+0"
  dep_delay: string; // e.g., "+0"
}
