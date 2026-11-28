import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/StationTable.css";
import { DisplayConnection } from "../display/displayConnection.ts";
import { StationTable } from "./StationTable.tsx";
import { StationDiagram } from "./StationDiagram.tsx";
import { fetchStationBoard } from "../display/fetchStationBoard.ts";
import { RadarView } from "./RadarView.tsx";
import "../css/RadarView.css";

export const StationBoard = () => {
  const { label } = useParams<{ label: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "radar" ? "radar" : "tracks";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DisplayConnection[]>([]);
  const [hoveredTrainNumber, setHoveredTrainNumber] = useState<string | null>(
    null,
  );
  const [stationName, setStationName] = useState<string>("");

  useEffect(() => {
    const loadStationBoard = async () => {
      if (!label) {
        return setError("No station label provided.");
      }

      setLoading(true);
      try {
        const result = await fetchStationBoard(label);
        setConnections(result.connections);
        setStationName(result.stationName);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load station board",
        );
        setLoading(false);
      }
    };

    loadStationBoard();
  }, [label]);

  const hover = {
    hoveredTrainNumber,
    onTrainHover: setHoveredTrainNumber,
    onTrainHoverEnd: () => setHoveredTrainNumber(null),
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page-container">
      <h1>Station Board - {stationName}</h1>
      <div className="view-toggle">
        <button
          aria-pressed={view === "tracks"}
          onClick={() => setSearchParams({}, { replace: true })}
        >
          Track occupancy
        </button>
        <button
          aria-pressed={view === "radar"}
          onClick={() => setSearchParams({ view: "radar" }, { replace: true })}
        >
          Radar
        </button>
      </div>
      {view === "radar" && label ? (
        <RadarView key={label} label={label} {...hover} />
      ) : (
        <StationDiagram connections={connections} {...hover} />
      )}
      <StationTable connections={connections} {...hover} />
    </div>
  );
};
