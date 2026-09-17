import { useCallback, useEffect, useRef, useState } from "react";
import "../css/RadarView.css";
import {
  fetchStationRadar,
  formatClock,
  RadarTrain,
  StationRadar,
  trainState,
  zurichNow,
} from "../display/stationRadar.ts";
import { rimEntry } from "../display/radarTracks.ts";

// Drop-in alternative to StationDiagram: same hover contract, so the
// StationTable below it stays linked exactly as in the track view.
interface RadarViewProps {
  label: string;
  hoveredTrainNumber: string | null;
  onTrainHover: (trainNumber: string) => void;
  onTrainHoverEnd: () => void;
}

const REFRESH_MS = 60_000;
const TRAIL_STEPS = 5;
const TRAIL_STEP_MS = 25_000;
const RIM_ETA_MIN = 30;
const LABEL_ETA_MIN = 5;
const DEPARTED_ALPHA = 0.45;

// Colours already used elsewhere in the app.
const BRAND_RED = "#eb0000";
const DELAY_RED = "#ff4444";
const HIGHLIGHT = "#f8d649";

interface Hit {
  train: RadarTrain;
  px: number;
  py: number;
}

type Tip = { left: number; top: number } & (
  | { kind: "train"; train: RadarTrain }
  | { kind: "stop"; name: string; atPlatform: number | null }
);

const STOP_HIT_PX = 8;
const STATION_HIT_PX = 11;

function etaText(ms: number): string {
  if (ms < 30_000) return "now";
  if (ms < 10 * 60_000) {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  return `${Math.round(ms / 60_000)} min`;
}

function niceStep(radiusKm: number): number {
  const steps = [1, 2, 5, 10, 20, 25, 50];
  return steps.find((s) => radiusKm / s <= 4) ?? 50;
}

export const RadarView = ({
  label,
  hoveredTrainNumber,
  onTrainHover,
  onTrainHoverEnd,
}: RadarViewProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticRef = useRef<HTMLCanvasElement | null>(null);
  const radarRef = useRef<StationRadar | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  // Canvas text can't inherit CSS, so read the page's font once mounted.
  const fontRef = useRef("sans-serif");
  const hitsRef = useRef<Hit[]>([]);
  const hoverRef = useRef<string | null>(hoveredTrainNumber);
  const selectedRef = useRef<string | null>(null);

  const [radar, setRadar] = useState<StationRadar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(zurichNow());
  const [tip, setTip] = useState<Tip | null>(null);
  // Station dots on the map (LV03) for hovering, and the platform count.
  const stopsRef = useRef<{ name: string; x: number; y: number }[]>([]);
  const atPlatformRef = useRef(0);

  // Hover may come from the table as well as from the map.
  useEffect(() => {
    hoverRef.current = hoveredTrainNumber;
  }, [hoveredTrainNumber]);

  // Map projection: LV03 metres around the station → canvas pixels.
  const project = useCallback((x: number, y: number) => {
    const n = radarRef.current;
    const { w, h } = sizeRef.current;
    if (!n) return { px: 0, py: 0, scale: 1 };
    const scale = (Math.min(w, h) / 2 - 30) / n.radiusM;
    return {
      px: w / 2 + (x - n.station.x) * scale,
      py: h / 2 - (y - n.station.y) * scale,
      scale,
    };
  }, []);

  const renderStatic = useCallback(() => {
    const n = radarRef.current;
    const { w, h, dpr } = sizeRef.current;
    if (!n || !w) return;
    const off = staticRef.current ?? document.createElement("canvas");
    staticRef.current = off;
    off.width = w * dpr;
    off.height = h * dpr;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const { scale } = project(n.station.x, n.station.y);
    const rimPx = n.radiusM * scale;

    // Range rings.
    const stepKm = niceStep(n.radiusM / 1000);
    ctx.font = `400 11px ${fontRef.current}`;
    ctx.textAlign = "left";
    for (let km = stepKm; km * 1000 <= n.radiusM * 1.001; km += stepKm) {
      const r = km * 1000 * scale;
      ctx.strokeStyle = "rgba(170, 170, 170, 0.18)";
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(170, 170, 170, 0.6)";
      ctx.fillText(`${km} km`, cx + r * 0.7071 + 4, cy - r * 0.7071 - 4);
    }
    ctx.strokeStyle = "rgba(170, 170, 170, 0.35)";
    ctx.beginPath();
    ctx.arc(cx, cy, rimPx, 0, Math.PI * 2);
    ctx.stroke();

    // Corridors: every route segment touching this station.
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rimPx + 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(221, 221, 221, 0.35)";
    ctx.lineWidth = 1.2;
    // Each piece of track once: trains that share it share one line.
    const drawn = new Set<string>();
    ctx.beginPath();
    for (const train of n.trains) {
      for (const path of train.paths) {
        for (let i = 1; i < path.length; i++) {
          const a = path[i - 1];
          const b = path[i];
          const k =
            a.x < b.x || (a.x === b.x && a.y < b.y)
              ? `${a.x},${a.y}|${b.x},${b.y}`
              : `${b.x},${b.y}|${a.x},${a.y}`;
          if (drawn.has(k)) continue;
          drawn.add(k);
          const p = project(a.x, a.y);
          const q = project(b.x, b.y);
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(q.px, q.py);
        }
      }
    }
    ctx.stroke();

    // Stops, sized by how many trains serve them; label the busiest.
    const served = new Map<
      string,
      { name: string; x: number; y: number; n: number }
    >();
    for (const train of n.trains) {
      for (const s of train.stops) {
        if (s.id === n.station.id) continue;
        const e = served.get(s.id);
        if (e) e.n++;
        else served.set(s.id, { name: s.name, x: s.x, y: s.y, n: 1 });
      }
    }
    const inside = [...served.values()].filter(
      (s) => Math.hypot(s.x - n.station.x, s.y - n.station.y) <= n.radiusM,
    );
    stopsRef.current = inside.map(({ name, x, y }) => ({ name, x, y }));
    for (const s of inside) {
      const p = project(s.x, s.y);
      ctx.fillStyle = "rgba(221, 221, 221, 0.55)";
      ctx.beginPath();
      ctx.arc(p.px, p.py, Math.min(3.5, 1.4 + s.n / 12), 0, Math.PI * 2);
      ctx.fill();
    }
    const placed: { x: number; y: number }[] = [{ x: cx, y: cy }];
    let labelled = 0;
    for (const s of inside.sort((a, b) => b.n - a.n)) {
      if (labelled >= 14) break;
      const p = project(s.x, s.y);
      if (placed.some((q) => Math.hypot(q.x - p.px, q.y - p.py) < 70)) continue;
      placed.push({ x: p.px, y: p.py });
      labelled++;
      ctx.fillStyle = "rgba(240, 240, 240, 0.7)";
      ctx.fillText(s.name, p.px + 6, p.py + 4);
    }
    ctx.restore();
  }, [project]);

  // Data: load on mount (the parent remounts per station), refresh every
  // minute for fresh delays.
  useEffect(() => {
    let cancelled = false;
    let first = true;
    const load = async () => {
      try {
        const result = await fetchStationRadar(label);
        if (cancelled) return;
        // Keep the zoom stable across refreshes of the same station.
        if (!first && radarRef.current)
          result.radiusM = radarRef.current.radiusM;
        first = false;
        radarRef.current = result;
        setRadar(result);
        setError(null);
        renderStatic();
      } catch (err) {
        if (!cancelled && first) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [label, renderStatic]);

  // One-second tick for the clock overlay; the canvas animates on its own.
  useEffect(() => {
    const id = window.setInterval(() => setNow(zurichNow()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Canvas sizing.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    fontRef.current = getComputedStyle(wrap).fontFamily || "sans-serif";
    const resize = () => {
      const w = wrap.clientWidth;
      const h = Math.round(w < 600 ? w : Math.min(w * 0.7, 640));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w, h, dpr };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.height = `${h}px`;
      renderStatic();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [radar, renderStatic]);

  // Animation loop: real time only.
  useEffect(() => {
    if (!radar) return;
    let raf = 0;
    const frame = (stamp: number) => {
      raf = requestAnimationFrame(frame);
      const canvas = canvasRef.current;
      const n = radarRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !n) return;
      const t = zurichNow();
      const { w, h, dpr } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const { scale } = project(n.station.x, n.station.y);
      const rimPx = n.radiusM * scale;
      const pulse = (Math.sin(stamp / 320) + 1) / 2;
      const isFocus = (train: RadarTrain) =>
        (hoverRef.current !== null && hoverRef.current === train.trainNumber) ||
        selectedRef.current === train.key;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (staticRef.current) ctx.drawImage(staticRef.current, 0, 0, w, h);

      // Selected route.
      const sel = n.trains.find((tr) => tr.key === selectedRef.current);
      if (sel) {
        ctx.save();
        ctx.strokeStyle = HIGHLIGHT;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        sel.paths.flat().forEach((pt, i) => {
          const p = project(pt.x, pt.y);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Station ring; the dot itself is drawn last, on top of the trains.
      ctx.strokeStyle = `rgba(235, 0, 0, ${0.25 + pulse * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();

      const hits: Hit[] = [];
      const labels: { x: number; y: number; w: number }[] = [];
      let atPlatform = 0;
      ctx.font = `600 11px ${fontRef.current}`;

      for (const train of n.trains) {
        if (train.cancelled) continue;
        const st = trainState(train, t);
        if (st.phase === "waiting" || st.phase === "gone") continue;
        if (st.phase === "platform") {
          atPlatform++;
          continue;
        }
        const focus = isFocus(train);
        const alpha = st.phase === "approaching" ? 1 : DEPARTED_ALPHA;
        const p = project(st.x, st.y);
        const dist = Math.hypot(p.px - cx, p.py - cy);

        if (dist > rimPx) {
          // Beyond the map: approaching trains wait on the rim.
          if (st.phase !== "approaching" || train.arrival === null) continue;
          const eta = train.arrival - t;
          if (eta > RIM_ETA_MIN * 60_000) continue;
          // Sit where its route enters the map, pointing along the track.
          const entry = rimEntry(
            train.paths,
            train.stationIndex,
            n.station,
            n.radiusM,
          );
          if (!entry) continue;
          const { px: rx, py: ry } = project(entry.x, entry.y);
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(Math.atan2(-entry.dy, entry.dx) + Math.PI);
          ctx.fillStyle = focus ? HIGHLIGHT : train.color.bg;
          ctx.strokeStyle = train.color.fg;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.55 + 0.45 * (1 - eta / (RIM_ETA_MIN * 60_000));
          ctx.beginPath();
          ctx.moveTo(-9, 0);
          ctx.lineTo(2, -5);
          ctx.lineTo(2, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          hits.push({ train, px: rx, py: ry });
          continue;
        }

        // Comet trail along the real route.
        ctx.fillStyle = train.color.bg;
        for (let k = TRAIL_STEPS; k >= 1; k--) {
          const tp = trainState(train, t - k * TRAIL_STEP_MS);
          if (tp.phase === "waiting") continue;
          const q = project(tp.x, tp.y);
          ctx.globalAlpha = alpha * 0.35 * (1 - k / (TRAIL_STEPS + 1));
          ctx.beginPath();
          ctx.arc(q.px, q.py, 4 * (1 - k / 8), 0, Math.PI * 2);
          ctx.fill();
        }

        const r = focus ? 7 : 5;
        ctx.globalAlpha = alpha;
        if (train.delayMin >= 3) {
          ctx.strokeStyle = DELAY_RED;
          ctx.globalAlpha = alpha * (0.5 + pulse * 0.5);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.px, p.py, r + 3 + pulse * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = alpha;
        }
        ctx.fillStyle = train.color.bg;
        ctx.strokeStyle = focus ? HIGHLIGHT : train.color.fg;
        ctx.lineWidth = focus ? 2 : 1;
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        hits.push({ train, px: p.px, py: p.py });

        // Line badge for trains about to arrive (and whatever is focused),
        // in the line's own colours like the track table.
        const eta = train.arrival !== null ? train.arrival - t : Infinity;
        if (
          focus ||
          (st.phase === "approaching" && eta <= LABEL_ETA_MIN * 60_000)
        ) {
          const text =
            st.phase === "approaching"
              ? `${train.line}  ${etaText(eta)}`
              : train.line;
          const tw = ctx.measureText(text).width + 10;
          const lx = p.px + 9;
          const ly = p.py - 9;
          if (
            !focus &&
            labels.some(
              (b) =>
                Math.abs(b.x - lx) < (b.w + tw) / 2 && Math.abs(b.y - ly) < 16,
            )
          ) {
            continue;
          }
          labels.push({ x: lx, y: ly, w: tw });
          ctx.globalAlpha = alpha;
          ctx.fillStyle = train.color.bg;
          ctx.fillRect(lx, ly - 9, tw, 17);
          if (focus) {
            ctx.strokeStyle = HIGHLIGHT;
            ctx.lineWidth = 2;
            ctx.strokeRect(lx, ly - 9, tw, 17);
          }
          ctx.fillStyle = train.color.fg;
          ctx.fillText(text, lx + 5, ly + 4);
          ctx.globalAlpha = 1;
        }
      }

      // Stationary trains aren't drawn; the station dot shows how many there are.
      atPlatformRef.current = atPlatform;
      ctx.fillStyle = BRAND_RED;
      ctx.beginPath();
      ctx.arc(cx, cy, atPlatform ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
      if (atPlatform) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 11px ${fontRef.current}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(atPlatform), cx, cy + 0.5);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }

      hitsRef.current = hits;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [radar, project]);

  const findHit = (
    clientX: number,
    clientY: number,
  ): {
    hit: Hit | null;
    stop: { name: string; atPlatform: number | null } | null;
    x: number;
    y: number;
  } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { hit: null, stop: null, x: 0, y: 0 };
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const n = radarRef.current;
    // The station dot is drawn on top of the trains, so it wins the hover.
    if (n) {
      const c = project(n.station.x, n.station.y);
      if (Math.hypot(c.px - x, c.py - y) <= STATION_HIT_PX) {
        const stop = {
          name: n.station.name,
          atPlatform: atPlatformRef.current,
        };
        return { hit: null, stop, x, y };
      }
    }
    let hit: Hit | null = null;
    let best = 14;
    for (const h of hitsRef.current) {
      const d = Math.hypot(h.px - x, h.py - y);
      if (d < best) {
        best = d;
        hit = h;
      }
    }
    let stop: { name: string; atPlatform: number | null } | null = null;
    if (!hit) {
      let bestStop = STOP_HIT_PX;
      for (const s of stopsRef.current) {
        const q = project(s.x, s.y);
        const d = Math.hypot(q.px - x, q.py - y);
        if (d <= bestStop) {
          bestStop = d;
          stop = { name: s.name, atPlatform: null };
        }
      }
    }
    return { hit, stop, x, y };
  };

  const onMove = (e: React.PointerEvent) => {
    const { hit, stop, x, y } = findHit(e.clientX, e.clientY);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? "pointer" : "default";
    }
    if (hit && hit.train.trainNumber) onTrainHover(hit.train.trainNumber);
    else onTrainHoverEnd();
    const w = sizeRef.current.w || 300;
    const at = { left: Math.max(0, Math.min(x + 14, w - 230)), top: y + 14 };
    if (hit) setTip({ ...at, kind: "train", train: hit.train });
    else if (stop) setTip({ ...at, kind: "stop", ...stop });
    else setTip(null);
  };

  if (error) return <div className="error-message">{error}</div>;

  const tipState = tip?.kind === "train" ? trainState(tip.train, now) : null;

  return (
    <div className="radar-map" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="radar-canvas"
        onPointerMove={onMove}
        onPointerLeave={() => {
          onTrainHoverEnd();
          setTip(null);
        }}
        onClick={(e) => {
          const { hit } = findHit(e.clientX, e.clientY);
          selectedRef.current = hit ? hit.train.key : null;
        }}
      />
      <div className="radar-overlay radar-clock">
        <span className="radar-live-dot" /> Live {formatClock(now, true)}
      </div>
      <div className="radar-overlay radar-legend">
        <span>
          <i /> approaching
        </span>
        <span>
          <i className="is-faded" /> departed
        </span>
        <span>
          <i className="is-delayed" /> delayed
        </span>
        <span>
          <i className="is-station">2</i> at the platform
        </span>
      </div>
      {!radar && <div className="loading radar-loading">Loading...</div>}
      {tip?.kind === "stop" && (
        <div
          className="radar-overlay radar-tip radar-stop-tip"
          style={{ left: tip.left, top: tip.top }}
        >
          <div>{tip.name}</div>
          {tip.atPlatform !== null && (
            <div>
              {tip.atPlatform === 1
                ? "1 train at the platform"
                : `${tip.atPlatform} trains at the platform`}
            </div>
          )}
        </div>
      )}
      {tip?.kind === "train" && tipState && (
        <div
          className="radar-overlay radar-tip"
          style={{ left: tip.left, top: tip.top }}
        >
          <div>
            <span
              className="radar-line"
              style={{
                backgroundColor: tip.train.color.bg,
                color: tip.train.color.fg,
              }}
            >
              {tip.train.line}
            </span>{" "}
            {tip.train.origin} → {tip.train.destination}
          </div>
          {tipState.phase === "approaching" && tip.train.arrival && (
            <div>
              Arrives {formatClock(tip.train.arrival)}
              {tip.train.track ? `, track ${tip.train.track}` : ""} (in{" "}
              {etaText(tip.train.arrival - now)})
            </div>
          )}
          {tipState.phase === "departed" && tip.train.departure && (
            <div>
              Left {formatClock(tip.train.departure)}, next{" "}
              {tip.train.stops[tipState.segment + 1]?.name ??
                tip.train.destination}
            </div>
          )}
          {tip.train.delayMin > 0 && <div>+{tip.train.delayMin} min</div>}
        </div>
      )}
    </div>
  );
};
