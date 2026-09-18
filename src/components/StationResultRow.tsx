import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { Station } from "../api/station.ts";
import { DelaySeverity } from "../display/stationDelay.ts";
import { SeverityBadge } from "./SeverityBadge.tsx";

interface StationResultRowProps {
  station: Station;
  severity?: DelaySeverity;
}

export const StationResultRow = ({
  station,
  severity,
}: StationResultRowProps) => (
  <Link to={`/station/${station.id}`} className="station-item">
    <i className={station.iconclass}></i>
    <span
      className="station-item-label"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(station.html),
      }}
    ></span>
    {severity && <SeverityBadge severity={severity} />}
  </Link>
);
