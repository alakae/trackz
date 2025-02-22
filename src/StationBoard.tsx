import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Connection } from "./api/connection.ts";
import { StationBoardResponse } from "./api/stationBoardResponse.ts";
import "./StationBoard.css";

export const StationBoard = () => {
  const { label } = useParams<{ label: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Connection[]>([]);
  const [stationName, setStationName] = useState<string>("");

  useEffect(() => {
    const fetchStationBoard = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://search.ch/timetable/api/stationboard.json?stop=${encodeURIComponent(
            label ?? "",
          )}&show_tracks=1&show_delays=1`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch station board data");
        }

        const data: StationBoardResponse = await response.json();
        setDepartures(data.connections);
        setStationName(data.stop.name);
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
      <div className="departures-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Line</th>
              <th>Terminal</th>
              <th>*Z</th>
              <th>Track</th>
            </tr>
          </thead>
          <tbody>
            {departures.map((departure, index) => {
              const [bgColor, textColor] = departure.color.split("~");
              const arrDelay =
                departure.arr_delay !== "+0" ? departure.arr_delay : null;
              const depDelay =
                departure.dep_delay !== "+0" ? departure.dep_delay : null;

              return (
                <tr key={`${departure.time}-${index}`}>
                  <td>
                    {new Date(departure.time).toLocaleTimeString("de-CH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {arrDelay && ` (Arr: ${arrDelay})`}
                    {depDelay && ` (Dep: ${depDelay})`}
                  </td>
                  <td
                    style={{
                      backgroundColor: `#${bgColor}`,
                      color: `#${textColor}`,
                    }}
                  >
                    {departure.line}
                  </td>
                  <td>{departure.terminal.name}</td>
                  <td>{departure["*Z"]}</td>
                  <td>{departure.track}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
