import {
  ArrivalConnection,
  DepartureConnection,
  DisplayConnection,
  getEffectiveArrivalTime,
  getEffectiveDepartureTime,
  PassingConnection,
  TerminalConnection,
} from "../display/displayConnection.ts";
import { formatTime } from "../utils/formatTime.ts";
import { useTriggerAutoRefresh } from "../utils/useTriggerAutoRefresh.tsx";

interface StationTableProps {
  connections: DisplayConnection[];
}

export const StationTable = ({ connections }: StationTableProps) => {
  useTriggerAutoRefresh();
  const now = new Date().getTime();
  const oneHourFromNow = now + 60 * 60 * 1000;

  return (
    <div className="station-table">
      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>Line</th>
            <th>Time</th>
            <th>Terminal</th>
            <th>Track</th>
          </tr>
        </thead>
        <tbody>
          {connections
            .filter((conn) => {
              const connTime = new Date(
                conn.mode === "Arrival"
                  ? getEffectiveArrivalTime(conn)
                  : getEffectiveDepartureTime(conn),
              ).getTime();
              return connTime >= now && connTime <= oneHourFromNow;
            })
            .sort((a, b) => {
              const timeA =
                a.mode === "Arrival"
                  ? (a as ArrivalConnection).arrival_time
                  : (
                      a as
                        | DepartureConnection
                        | PassingConnection
                        | TerminalConnection
                    ).departure_time;

              const timeB =
                b.mode === "Arrival"
                  ? (b as ArrivalConnection).arrival_time
                  : (
                      b as
                        | DepartureConnection
                        | PassingConnection
                        | TerminalConnection
                    ).departure_time;

              return timeA.getTime() - timeB.getTime();
            })
            .map((connection, index) => {
              const [bgColor, textColor] = connection.color.split("~");

              const getTime = () => {
                const arrivalTime =
                  connection.mode === "Arrival" ||
                  connection.mode === "Passing" ||
                  connection.mode === "Terminal"
                    ? `${formatTime(
                        (connection as ArrivalConnection | PassingConnection)
                          .arrival_time,
                      )}${
                        connection.arr_delay
                          ? ` (+${connection.arr_delay})`
                          : ""
                      }`
                    : "";

                const departureTime =
                  connection.mode === "Departure" ||
                  connection.mode === "Passing" ||
                  connection.mode === "Terminal"
                    ? `${formatTime(
                        (connection as DepartureConnection | PassingConnection)
                          .departure_time,
                      )}${
                        connection.dep_delay
                          ? ` (+${connection.dep_delay})`
                          : ""
                      }`
                    : "";

                if (arrivalTime && departureTime) {
                  return `${arrivalTime} - ${departureTime}`;
                }
                return arrivalTime || departureTime || "";
              };

              return (
                <tr key={`${connection.mode}-${index}`}>
                  <td>{connection.mode.charAt(0)}</td>
                  <td
                    style={{
                      backgroundColor: `#${bgColor}`,
                      color: `#${textColor}`,
                    }}
                  >
                    {connection.line}{" "}
                    {connection["*Z"]?.replace(/^0+/, "") || ""}
                  </td>
                  <td>{getTime()}</td>
                  <td>{connection.terminal.name}</td>
                  <td
                    style={{
                      color: connection.changed_track ? "red" : "inherit",
                    }}
                  >
                    {connection.track}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};
