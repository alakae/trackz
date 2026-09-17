import type { RadarStop, RadarTrain } from "./stationRadar.ts";

// The timetable only gives stations, so a train skipping stops would be
// drawn as a straight chord between the stations it does stop at. Slower
// trains on the same line stop at the stations in between, though, so the
// stops of all trains together trace the real network. This module builds
// that station graph, drops the chords, and routes every hop along what
// remains: an express from Zug to Luzern then runs through Rotkreuz,
// Gisikon-Root, Buchrain and Ebikon like the S-Bahn does.

export interface TrackPoint {
  x: number;
  y: number;
}

// A chord is replaced only if the way through intermediate stations is at
// most this much longer...
const MAX_DETOUR = 1.45;
// ...and the slower trains cover it in at most this multiple of the direct
// hop's running time. Base tunnels and high-speed lines fail this test (the
// Gotthard base tunnel vs. the mountain line), so they stay direct.
const MAX_SLOWDOWN = 1.8;
// Known limitation: a tunnel with no stations of its own is invisible to
// this graph, so when it is only a little faster than the old line it fails
// to beat these thresholds and its trains are drawn along the old line:
// - Zürich HB–Thalwil (Zimmerberg tunnel) follows the lakeside S-Bahn
//   stations, a little east of the tunnel.
// - Zürich HB–Oerlikon (Weinberg tunnel) goes via Wipkingen.
// Times and positions at the stations stay right; only the track in between
// is off. Fixing it needs real track geometry rather than stations.

// Bound for routing a hop through the reduced graph.
const ROUTE_DETOUR = 1.6;

interface Edge {
  a: string;
  b: string;
  length: number; // metres
  time: number; // fastest observed running time, ms
}

interface Graph {
  pos: Map<string, TrackPoint>;
  adj: Map<string, Set<string>>;
  edges: Map<string, Edge>;
}

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const dist = (p: TrackPoint, q: TrackPoint) => Math.hypot(p.x - q.x, p.y - q.y);

function link(g: Graph, a: string, b: string) {
  if (!g.adj.has(a)) g.adj.set(a, new Set());
  if (!g.adj.has(b)) g.adj.set(b, new Set());
  g.adj.get(a)!.add(b);
  g.adj.get(b)!.add(a);
}

function unlink(g: Graph, a: string, b: string) {
  g.adj.get(a)?.delete(b);
  g.adj.get(b)?.delete(a);
}

function buildGraph(trains: RadarTrain[]): Graph {
  const g: Graph = { pos: new Map(), adj: new Map(), edges: new Map() };
  for (const train of trains) {
    train.stops.forEach((s: RadarStop, i) => {
      g.pos.set(s.id, { x: s.x, y: s.y });
      const next = train.stops[i + 1];
      if (!next || next.id === s.id) return;
      const length = dist(s, next);
      if (length === 0) return;
      const time = Math.max(0, next.arr - s.dep);
      const k = edgeKey(s.id, next.id);
      const known = g.edges.get(k);
      if (known) {
        known.time = Math.min(known.time, time);
      } else {
        g.edges.set(k, { a: s.id, b: next.id, length, time });
        link(g, s.id, next.id);
      }
    });
  }
  return g;
}

// Small binary heap for A*.
class MinHeap {
  private items: { id: string; f: number }[] = [];

  get size() {
    return this.items.length;
  }

  push(id: string, f: number) {
    const a = this.items;
    a.push({ id, f });
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop(): { id: string; f: number } {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

// Shortest path by length (A*, straight-line heuristic), giving up beyond
// maxLength. Returns the station ids from `from` to `to`.
function shortestPath(
  g: Graph,
  from: string,
  to: string,
  maxLength: number,
): string[] | null {
  const target = g.pos.get(to);
  if (!target || !g.pos.has(from)) return null;
  const best = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const heap = new MinHeap();
  heap.push(from, dist(g.pos.get(from)!, target));
  while (heap.size) {
    const { id, f } = heap.pop();
    if (f > maxLength) return null;
    if (id === to) {
      const path = [to];
      while (path[0] !== from) path.unshift(prev.get(path[0])!);
      return path;
    }
    const here = best.get(id)!;
    if (f - dist(g.pos.get(id)!, target) > here + 1e-6) continue; // stale
    for (const next of g.adj.get(id) ?? []) {
      const d = here + g.edges.get(edgeKey(id, next))!.length;
      if (d < (best.get(next) ?? Infinity)) {
        best.set(next, d);
        prev.set(next, id);
        heap.push(next, d + dist(g.pos.get(next)!, target));
      }
    }
  }
  return null;
}

function pathLength(g: Graph, path: string[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += g.edges.get(edgeKey(path[i - 1], path[i]))!.length;
  }
  return total;
}

function pathTime(g: Graph, path: string[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += g.edges.get(edgeKey(path[i - 1], path[i]))!.time;
  }
  return total;
}

// Drop chords, longest first, while a believable way through intermediate
// stations exists. Returns the ids of the dropped edges.
function dropChords(g: Graph): Set<string> {
  const dropped = new Set<string>();
  const byLength = [...g.edges.entries()].sort(
    (x, y) => y[1].length - x[1].length,
  );
  for (const [k, e] of byLength) {
    unlink(g, e.a, e.b);
    const path = shortestPath(g, e.a, e.b, e.length * MAX_DETOUR);
    const believable =
      path !== null &&
      path.length > 2 &&
      pathLength(g, path) <= e.length * MAX_DETOUR &&
      pathTime(g, path) <= Math.max(e.time, 60_000) * MAX_SLOWDOWN;
    if (believable) dropped.add(k);
    else link(g, e.a, e.b);
  }
  return dropped;
}

// Fill train.paths: paths[i] is the polyline from stops[i] to stops[i + 1].
export function routeAlongTrack(trains: RadarTrain[]) {
  const g = buildGraph(trains);
  const dropped = dropChords(g);
  const cache = new Map<string, TrackPoint[]>();

  const route = (a: RadarStop, b: RadarStop): TrackPoint[] => {
    const straight = [
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
    ];
    if (a.id === b.id || !dropped.has(edgeKey(a.id, b.id))) return straight;
    const k = `${a.id}>${b.id}`;
    const hit = cache.get(k);
    if (hit) return hit;
    const ids = shortestPath(g, a.id, b.id, dist(a, b) * ROUTE_DETOUR);
    const points = ids ? ids.map((id) => g.pos.get(id)!) : straight;
    cache.set(k, points);
    return points;
  };

  for (const train of trains) {
    train.paths = train.stops
      .slice(0, -1)
      .map((s, i) => route(s, train.stops[i + 1]));
  }
}

// The point a fraction p (0..1) of the way along a polyline, by distance.
export function pointAlong(path: TrackPoint[], p: number): TrackPoint {
  if (path.length === 1) return path[0];
  let total = 0;
  for (let i = 1; i < path.length; i++) total += dist(path[i - 1], path[i]);
  let left = Math.max(0, Math.min(1, p)) * total;
  for (let i = 1; i < path.length; i++) {
    const seg = dist(path[i - 1], path[i]);
    if (left <= seg || i === path.length - 1) {
      const f = seg > 0 ? Math.min(1, left / seg) : 1;
      return {
        x: path[i - 1].x + (path[i].x - path[i - 1].x) * f,
        y: path[i - 1].y + (path[i].y - path[i - 1].y) * f,
      };
    }
    left -= seg;
  }
  return path[path.length - 1];
}

// Where a route first runs into a circle around `centre` for the last time
// before reaching it: the point on the circle plus the direction of travel
// there. Used to put a train that is still beyond the radar's edge on the
// spot where its track enters, rather than in its straight-line direction.
export function rimEntry(
  paths: TrackPoint[][],
  hops: number,
  centre: TrackPoint,
  radius: number,
): { x: number; y: number; dx: number; dy: number } | null {
  const line = paths.slice(0, hops).flat();
  for (let i = line.length - 1; i > 0; i--) {
    const a = line[i - 1];
    const b = line[i];
    if (dist(a, centre) <= radius || dist(b, centre) > radius) continue;
    // Solve |a + t(b - a) - centre| = radius for the crossing on a→b.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const fx = a.x - centre.x;
    const fy = a.y - centre.y;
    const qa = dx * dx + dy * dy;
    const qb = 2 * (fx * dx + fy * dy);
    const qc = fx * fx + fy * fy - radius * radius;
    const root = Math.sqrt(Math.max(0, qb * qb - 4 * qa * qc));
    const t = Math.min(1, Math.max(0, (-qb - root) / (2 * qa)));
    return { x: a.x + dx * t, y: a.y + dy * t, dx, dy };
  }
  return null;
}
