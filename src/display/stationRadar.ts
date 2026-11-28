import { Connection, SubsequentStop } from "../api/connection.ts";
import {
  ArrivalConnection,
  DepartureConnection,
  DisplayConnection,
  getEffectiveArrivalTime,
  getEffectiveDepartureTime,
} from "./displayConnection.ts";
import { fetchStationBoard } from "./fetchStationBoard.ts";
import { pointAlong, routeAlongTrack, TrackPoint } from "./radarTracks.ts";

// The station board (fetchStationBoard + processConnections) already joins
// arrivals and departures into Passing/Terminal entries for the track
// occupancy view. This module turns those same entries into paths across
// the map.
//
// All times here are "Swiss wall-clock milliseconds": a timetable time such
// as 21:38 becomes Date.UTC(…, 21, 38). That keeps the animation independent
// of the viewer's own time zone.

export type Direction = "in" | "out" | "through";
export type TrainCategory = "long" | "regional" | "sbahn" | "other";

export interface RadarStop {
  id: string;
  name: string;
  x: number; // LV03 easting in metres
  y: number; // LV03 northing in metres
  arr: number;
  dep: number;
}

export interface RadarTrain {
  key: string;
  // Raw "*Z" as the station table uses it, so hover links both views.
  trainNumber: string;
  line: string;
  // The line's own colours from search.ch ("039~fff~"), as in the table.
  color: { bg: string; fg: string };
  category: TrainCategory;
  direction: Direction;
  origin: string;
  destination: string;
  track: string;
  delayMin: number; // the larger of arrival and departure delay
  cancelled: boolean;
  // Effective (delay-adjusted) times at this station.
  arrival: number | null;
  departure: number | null;
  stops: RadarStop[]; // in travel order, includes this station
  // paths[i] is the drawn route from stops[i] to stops[i + 1]: straight, or
  // through the stations slower trains stop at (see radarTracks.ts).
  paths: TrackPoint[][];
  stationIndex: number;
}

export interface StationRadar {
  station: { id: string; name: string; x: number; y: number };
  trains: RadarTrain[];
  radiusM: number;
  loadedAt: number;
}

// Enough history for trains that left up to ~45 min ago, and a limit that
// still reaches ~75 min ahead at the busiest stations without fetching the
// whole day's onward stops.
const LOOK_BACK_MIN = 50;
const LIMIT = 260;
const HORIZON_MIN = 75;

const LONG_DISTANCE = new Set([
  "IC",
  "ICN",
  "ICE",
  "IR",
  "EC",
  "EN",
  "NJ",
  "TGV",
  "RJ",
  "RJX",
  "EXT",
  "PE",
  "GEX",
]);
const REGIONAL = new Set(["RE", "IRE", "R", "RB", "REX", "TER"]);

// Average straight-line speed used only when no route geometry is known.
const FALLBACK_KMH: Record<TrainCategory, number> = {
  long: 95,
  regional: 60,
  sbahn: 45,
  other: 50,
};

export function categorize(group: string | undefined): TrainCategory {
  const g = (group ?? "").toUpperCase();
  if (LONG_DISTANCE.has(g)) return "long";
  if (REGIONAL.has(g)) return "regional";
  if (g === "S" || g === "SN") return "sbahn";
  return "other";
}

export function zurichNow(): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) + new Date().getMilliseconds()
  );
}

export function parseApiTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
}

// DisplayConnection times are timetable strings parsed by `new Date()` in
// the viewer's zone; reading back their local fields recovers the timetable
// wall-clock time.
function wallClock(date: Date): number {
  const d = new Date(date);
  return Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  );
}

export function formatClock(ms: number, withSeconds = false): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return withSeconds ? `${hm}:${pad(d.getUTCSeconds())}` : hm;
}

// --- Paths -----------------------------------------------------------------

function onwardStops(stops: SubsequentStop[] | undefined, shift: number) {
  const out: RadarStop[] = [];
  for (const s of stops ?? []) {
    const arr = parseApiTime(s.arr) ?? parseApiTime(s.dep);
    const dep = parseApiTime(s.dep) ?? arr;
    const x = Number(s.x);
    const y = Number(s.y);
    if (arr === null || dep === null || !x || !y) continue;
    out.push({
      id: String(s.id),
      name: s.name,
      x,
      y,
      arr: arr + shift,
      dep: dep + shift,
    });
  }
  return out;
}

// Every departure describes the stop sequence and running times away from
// this station. Mirrored, the same corridor describes how trains on that
// line approach it, which search.ch does not report for arrivals.
interface Corridor {
  line: string;
  group: string;
  stops: RadarStop[]; // times relative to leaving this station (offset 0)
}

function corridorOf(dep: Connection): Corridor | null {
  const start = parseApiTime(dep.time);
  if (start === null) return null;
  const stops = onwardStops(dep.subsequent_stops, -start);
  return stops.length ? { line: dep.line, group: dep["*G"], stops } : null;
}

function approachPath(
  corridors: Corridor[],
  arrival: ArrivalConnection,
  station: StationRadar["station"],
  arrivalAt: number,
): RadarStop[] | null {
  const origin = arrival.terminal;
  let best: { corridor: Corridor; index: number; score: number } | null = null;
  for (const corridor of corridors) {
    const index = corridor.stops.findIndex(
      (s) => s.id === String(origin.id) || s.name === origin.name,
    );
    if (index < 0) continue;
    const rank =
      corridor.line === arrival.line
        ? 0
        : corridor.group === arrival["*G"]
          ? 1
          : 2;
    // Same line first, then same category; ties go to the quicker run.
    const score = rank * 1e9 + corridor.stops[index].arr;
    if (!best || score < best.score) best = { corridor, index, score };
  }
  if (best) {
    // Walk the corridor backwards: origin first, the neighbour stop last.
    return best.corridor.stops
      .slice(0, best.index + 1)
      .reverse()
      .map((s) => ({ ...s, arr: arrivalAt - s.dep, dep: arrivalAt - s.arr }));
  }
  const x = Number(origin.x);
  const y = Number(origin.y);
  if (!x || !y) return null;
  // Unknown corridor: come in on a straight line at a plausible speed.
  const km = Math.hypot(x - station.x, y - station.y) / 1000;
  const minutes = (km / FALLBACK_KMH[categorize(arrival["*G"])]) * 60;
  const start = arrivalAt - Math.max(3, minutes) * 60_000;
  return [
    { id: String(origin.id), name: origin.name, x, y, arr: start, dep: start },
  ];
}

function arrivalLeg(conn: DisplayConnection): ArrivalConnection | null {
  if (conn.mode === "Arrival") return conn;
  if (conn.mode === "Passing" || conn.mode === "Terminal") {
    return conn.arrival_leg;
  }
  return null;
}

function departureLeg(conn: DisplayConnection): DepartureConnection | null {
  if (conn.mode === "Departure") return conn;
  if (conn.mode === "Passing" || conn.mode === "Terminal") {
    return conn.departure_leg;
  }
  return null;
}

function toTrain(
  conn: DisplayConnection,
  corridors: Corridor[],
  station: StationRadar["station"],
): RadarTrain | null {
  const inbound = arrivalLeg(conn);
  const outbound = departureLeg(conn);
  const arrivalAt = inbound
    ? wallClock(getEffectiveArrivalTime(inbound))
    : null;
  const departureAt = outbound
    ? wallClock(getEffectiveDepartureTime(outbound))
    : null;

  const approach =
    inbound && arrivalAt !== null
      ? approachPath(corridors, inbound, station, arrivalAt)
      : [];
  if (approach === null) return null;
  const onward = outbound
    ? onwardStops(outbound.subsequent_stops, (outbound.dep_delay ?? 0) * 60_000)
    : [];
  if (!approach.length && !onward.length) return null;

  const here: RadarStop = {
    ...station,
    arr: arrivalAt ?? departureAt ?? 0,
    dep: Math.max(departureAt ?? 0, arrivalAt ?? 0),
  };
  const first = inbound ?? outbound!;
  const [bg, fg] = (conn.color ?? "").split("~");
  return {
    key: `${conn.mode}|${first.line}|${first["*Z"]}|${here.arr}`,
    trainNumber: conn["*Z"] ?? "",
    line: first.line,
    color: { bg: bg ? `#${bg}` : "#666", fg: fg ? `#${fg}` : "#fff" },
    category: categorize(first["*G"]),
    direction: inbound && outbound ? "through" : inbound ? "in" : "out",
    origin: inbound ? inbound.terminal.name : station.name,
    destination: outbound ? outbound.terminal.name : station.name,
    track: conn.track ?? "",
    delayMin: Math.max(inbound?.arr_delay ?? 0, outbound?.dep_delay ?? 0),
    cancelled: Boolean(inbound?.cancelled || outbound?.cancelled),
    arrival: arrivalAt,
    departure: departureAt,
    stops: [...approach, here, ...onward],
    paths: [],
    stationIndex: approach.length,
  };
}

function viewRadius(trains: RadarTrain[], station: StationRadar["station"]) {
  // Size the map so it shows roughly the last/next half hour of running.
  const distances: number[] = [];
  for (const train of trains) {
    const here = train.stops[train.stationIndex];
    for (const s of train.stops) {
      const dt = Math.min(
        Math.abs(s.arr - here.dep),
        Math.abs(s.dep - here.arr),
      );
      if (dt <= 30 * 60_000) {
        distances.push(Math.hypot(s.x - station.x, s.y - station.y));
      }
    }
  }
  if (!distances.length) return 20_000;
  distances.sort((a, b) => a - b);
  const p90 = distances[Math.floor(distances.length * 0.9)];
  return Math.min(120_000, Math.max(6_000, p90 * 1.12));
}

export async function fetchStationRadar(label: string): Promise<StationRadar> {
  const board = await fetchStationBoard(label, {
    withSubsequentStops: true,
    limit: LIMIT,
    lookBackMinutes: LOOK_BACK_MIN,
  });
  const now = zurichNow();
  const station = {
    id: String(board.stop.id),
    name: board.stop.name,
    x: Number(board.stop.x),
    y: Number(board.stop.y),
  };
  // Corridors may come from any departure in the payload, not only those in
  // the board's ±2 h window: late at night the return working of a line is
  // often further away than that.
  const corridors = board.departures.connections
    .map(corridorOf)
    .filter((c): c is Corridor => c !== null);

  const trains = board.connections
    .map((conn) => toTrain(conn, corridors, station))
    .filter((t): t is RadarTrain => t !== null)
    .filter((t) => t.stops[t.stationIndex].arr <= now + HORIZON_MIN * 60_000);

  if (!trains.length) {
    throw new Error(`No train movements found around ${station.name}.`);
  }
  routeAlongTrack(trains);
  return {
    station,
    trains,
    radiusM: viewRadius(trains, station),
    loadedAt: now,
  };
}

// --- Live state ------------------------------------------------------------

export type Phase =
  "waiting" | "approaching" | "platform" | "departed" | "gone";

export interface TrainState {
  phase: Phase;
  x: number;
  y: number;
  segment: number; // index of the stop just left (or being dwelt at)
  dwelling: boolean;
}

const ease = (p: number) => p * p * (3 - 2 * p);

export function trainState(train: RadarTrain, t: number): TrainState {
  const s = train.stops;
  const here = s[train.stationIndex];
  const first = s[0];
  const last = s[s.length - 1];
  if (t < first.dep) {
    return {
      phase: "waiting",
      x: first.x,
      y: first.y,
      segment: 0,
      dwelling: true,
    };
  }
  if (t > last.arr) {
    return {
      phase: "gone",
      x: last.x,
      y: last.y,
      segment: s.length - 1,
      dwelling: true,
    };
  }
  const phase: Phase =
    t < here.arr ? "approaching" : t <= here.dep ? "platform" : "departed";
  for (let i = 0; i < s.length; i++) {
    const stop = s[i];
    if (t >= stop.arr && t <= stop.dep) {
      return { phase, x: stop.x, y: stop.y, segment: i, dwelling: true };
    }
    const next = s[i + 1];
    if (next && t > stop.dep && t < next.arr) {
      const span = next.arr - stop.dep;
      const p = span > 0 ? ease((t - stop.dep) / span) : 1;
      const at = pointAlong(train.paths[i] ?? [stop, next], p);
      return { phase, x: at.x, y: at.y, segment: i, dwelling: false };
    }
  }
  return {
    phase,
    x: here.x,
    y: here.y,
    segment: train.stationIndex,
    dwelling: true,
  };
}
