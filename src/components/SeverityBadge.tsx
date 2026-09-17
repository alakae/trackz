import "../css/SeverityBadge.css";
import { DelaySeverity } from "../display/stationDelay.ts";

const SEVERITY_LABEL: Record<DelaySeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  unknown: "Unknown",
};

interface SeverityBadgeProps {
  severity: DelaySeverity;
}

export const SeverityBadge = ({ severity }: SeverityBadgeProps) => (
  <span className={`severity-badge severity-${severity}`}>
    {SEVERITY_LABEL[severity]}
  </span>
);
