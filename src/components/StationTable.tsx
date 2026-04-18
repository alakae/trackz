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
  hoveredTrainNumber: string | null;
  onTrainHover: (trainNumber: string) => void;
  onTrainHoverEnd: () => void;
}

export const StationTable = ({ connections, hoveredTrainNumber, onTrainHover, onTrainHoverEnd }: StationTableProps) => {
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
              const trainNumber = connection["*Z"].replace(/^0+/, "");

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
                <tr
                  key={`${connection.mode}-${index}`}
                  className={hoveredTrainNumber === connection["*Z"] ? "highlighted" : undefined}
                  onMouseEnter={() => onTrainHover(connection["*Z"])}
                  onMouseLeave={onTrainHoverEnd}
                >
                  <td>{connection.mode.charAt(0)}</td>
                  <td
                    style={{
                      backgroundColor: `#${bgColor}`,
                      color: `#${textColor}`,
                    }}
                  >
                    <form
                      method="POST"
                      action="https://www.reisezuege.ch/index.php"
                      target="_blank"
                      style={{ display: "inline" }}
                    >
                      <input type="hidden" name="znummer" value={trainNumber} />
                      <input type="hidden" name="action" value="1" />
                      <button
                        type="submit"
                        title={`Zugdetails für ${trainNumber} öffnen`}
                        style={{
                          background: "none",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                          font: "inherit",
                          padding: 0,
                        }}
                      >
                        {connection.line} {trainNumber}
                      </button>
                    </form>
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
