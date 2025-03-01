import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/StationTable.css";
import { DisplayConnection } from "../display/displayConnection.ts";
import { StationTable } from "./StationTable.tsx";
import { StationDiagram } from "./StationDiagram.tsx";
import { fetchStationBoard } from "../fetchStationBoard.ts";

export const StationBoard = () => {
  const { label } = useParams<{ label: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DisplayConnection[]>([]);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page-container">
      <h1>Station Board - {stationName}</h1>
      <StationDiagram connections={connections} />
      <StationTable connections={connections} />
    </div>
  );
};
