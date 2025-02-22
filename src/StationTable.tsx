import {
  DisplayConnection,
  ArrivalConnection,
  PassingConnection,
  DepartureConnection,
} from "./display/displayConnection";

interface StationTableProps {
  connections: DisplayConnection[];
}

export const StationTable = ({ connections }: StationTableProps) => {
  return (
    <div className="station-table">
      <table>
        <thead>
          <tr>
            <th>Arrival Time</th>
            <th>Departure Time</th>
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

            const formatTime = (timestamp: string | undefined) => {
              if (!timestamp) return "";
              return new Date(timestamp).toLocaleTimeString("de-CH", {
                hour: "2-digit",
                minute: "2-digit",
              });
            };

            const getArrivalTime = () => {
              if (
                connection.mode === "Arrival" ||
                connection.mode === "Passing"
              ) {
                const arrDelay =
                  connection.arr_delay && connection.arr_delay !== "+0"
                    ? ` (${connection.arr_delay})`
                    : "";
                return `${formatTime(
                  (connection as ArrivalConnection | PassingConnection)
                    .arrival_time,
                )}${arrDelay}`;
              }
              return "";
            };

            const getDepartureTime = () => {
              if (
                connection.mode === "Departure" ||
                connection.mode === "Passing"
              ) {
                const depDelay =
                  connection.dep_delay && connection.dep_delay !== "+0"
                    ? ` (${connection.dep_delay})`
                    : "";
                return `${formatTime(
                  (connection as DepartureConnection | PassingConnection)
                    .departure_time,
                )}${depDelay}`;
              }
              return "";
            };

            return (
              <tr key={`${connection.mode}-${index}`}>
                <td>{getArrivalTime()}</td>
                <td>{getDepartureTime()}</td>
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
  );
};
