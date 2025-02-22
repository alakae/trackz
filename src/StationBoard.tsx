import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import "./StationBoard.css";
import { processConnections } from "./processConnections.ts";
import { DisplayConnection } from "./display/displayConnection.ts";
import { StationTable } from "./StationTable.tsx";

export const StationBoard = () => {
  const { label } = useParams<{ label: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DisplayConnection[]>([]);
  const [stationName, setStationName] = useState<string>("");

  useEffect(() => {
    const fetchStationBoard = async () => {
      setLoading(true);
      try {
        const [departureResponse, arrivalResponse] = await Promise.all([
          fetch(
            `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
              label ?? "",
            )}&show_tracks=1&show_delays=1&mode=departure&transportation_types=train`,
          ),
          fetch(
            `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
              label ?? "",
            )}&show_tracks=1&show_delays=1&mode=arrival&transportation_types=train`,
          ),
        ]);

        if (!departureResponse.ok || !arrivalResponse.ok) {
          throw new Error("Failed to fetch station board data");
        }

        const departureData: StationBoardResponse =
          await departureResponse.json();
        const arrivalData: StationBoardResponse = await arrivalResponse.json();

        const sortedConnections = processConnections(
          departureData,
          arrivalData,
        );

        setConnections(sortedConnections);
        setStationName(departureData.stop.name);
        setLoading(false);
      } catch (err) {
        setError("Failed to load station board");
        setLoading(false);
      }
    };

    fetchStationBoard();
  }, [label]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page-container">
      <h1>Station Board - {stationName}</h1>
      <StationTable connections={connections} />
    </div>
  );
};
