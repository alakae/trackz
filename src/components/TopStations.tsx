import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/TopStations.css";
import { fetchTopStationDelays } from "../display/fetchTopStationDelays.ts";
import { DEPARTURES_SAMPLED_PER_STATION } from "../display/fetchStationDelay.ts";
import { StationDelaySummary } from "../display/stationDelay.ts";
import { SeverityBadge } from "./SeverityBadge.tsx";

const REFRESH_INTERVAL_MS = 60_000;

function formatMedianDelay(summary: StationDelaySummary): string {
  if (summary.medianDelayMinutes === null) return "No data";
  if (summary.medianDelayMinutes < 0.5) return "On time";
  return `+${summary.medianDelayMinutes.toFixed(1)} min`;
}

// "No data"/"On time" aren't delay figures, so they stay neutral white
// instead of the alert-yellow used for an actual minutes-late reading.
function hasNoDelayFigure(summary: StationDelaySummary): boolean {
  return (
    summary.medianDelayMinutes === null || summary.medianDelayMinutes < 0.5
  );
}

export const TopStations = () => {
  const [stations, setStations] = useState<StationDelaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDelays = async () => {
      try {
        const summaries = await fetchTopStationDelays();
        if (!cancelled) {
          setStations(summaries);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load station delays.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDelays();
    const interval = setInterval(loadDelays, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="top-stations">
      <h2>Top Stations</h2>
      <p className="top-stations-subtitle">
        Median delay across the next {DEPARTURES_SAMPLED_PER_STATION} departures
        at major Swiss stations
      </p>

      {isLoading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {!isLoading && !error && (
        <div className="top-stations-grid">
          {stations.map((summary) => {
            const cardContent = (
              <>
                <div className="top-station-name">{summary.name}</div>
                <div className="top-station-body">
                  <span
                    className={
                      hasNoDelayFigure(summary)
                        ? "top-station-delay top-station-delay-neutral"
                        : "top-station-delay"
                    }
                  >
                    {formatMedianDelay(summary)}
                  </span>
                  <SeverityBadge severity={summary.severity} />
                </div>
              </>
            );

            return summary.id >= 0 ? (
              <Link
                key={summary.name}
                to={`/station/${summary.id}`}
                className="top-station-card"
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={summary.name}
                className="top-station-card top-station-card-disabled"
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
