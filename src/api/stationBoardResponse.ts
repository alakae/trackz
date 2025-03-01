import { Connection } from "./connection.ts";

export interface StationBoardResponse {
  stop: {
    id: string;
    name: string;
    x: string;
    y: string;
    lon: number;
    lat: number;
  };
  connections: Connection[];
  request: string;
  eof: number;
}
