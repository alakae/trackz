import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import "./StationBoard.css";
import { processConnections } from "./processConnections.ts";
import { DisplayConnection } from "./display/displayConnection.ts";

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
            )}&show_tracks=1&show_delays=1&mode=departure`,
          ),
          fetch(
            `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
              label ?? "",
            )}&show_tracks=1&show_delays=1&mode=arrival`,
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

      <div className="station-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Mode</th>
              <th>Line</th>
              <th>Terminal</th>
              <th>*Z</th>
              <th>Track</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection, index) => {
              const [bgColor, textColor] = connection.color.split("~");
              const arrDelay =
                connection.arr_delay !== "+0" ? connection.arr_delay : null;
              const depDelay =
                connection.dep_delay !== "+0" ? connection.dep_delay : null;

              return (
                <tr key={`${connection.time}-${index}`}>
                  <td>
                    {new Date(connection.time).toLocaleTimeString("de-CH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {arrDelay && ` (Arr: ${arrDelay})`}
                    {depDelay && ` (Dep: ${depDelay})`}
                  </td>
                  <td>{connection.mode}</td>
                  <td
                    style={{
                      backgroundColor: `#${bgColor}`,
                      color: `#${textColor}`,
                    }}
                  >
                    {connection.line}
                  </td>
                  <td>{connection.terminal.name}</td>
                  <td>{connection["*Z"]}</td>
                  <td>{connection.track}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
