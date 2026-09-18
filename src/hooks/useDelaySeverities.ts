import { useEffect, useState } from "react";
import { Station } from "../api/station.ts";
import { fetchMedianDepartureDelay } from "../display/fetchStationDelay.ts";
import { classifyDelay, DelaySeverity } from "../display/stationDelay.ts";

// Live delay badges are only fetched for the first few stations —
// stationboard.json is queried once per station, so an unbounded list could
// otherwise trigger dozens of calls per keystroke.
const DEFAULT_METERED_RESULTS = 8;

export function useDelaySeverities(
  stations: Station[],
  limit = DEFAULT_METERED_RESULTS,
): Record<number, DelaySeverity> {
  const [severityByStationId, setSeverityByStationId] = useState<
    Record<number, DelaySeverity>
  >({});

  useEffect(() => {
    if (stations.length === 0) return;

    let cancelled = false;

    stations.slice(0, limit).forEach((station) => {
      fetchMedianDepartureDelay(station.id)
        .then(({ medianDelayMinutes }) => {
          if (cancelled) return;
          setSeverityByStationId((prev) => ({
            ...prev,
            [station.id]: classifyDelay(medianDelayMinutes),
          }));
        })
        .catch((err) => {
          console.error(
            `Failed to fetch delay for station "${station.label}":`,
            err,
          );
        });
    });

    return () => {
      cancelled = true;
    };
  }, [stations, limit]);

  return severityByStationId;
}
