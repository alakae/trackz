import React from "react";
import { Layer, Line, Rect, Stage, Text } from "react-konva";
import { DisplayConnection } from "./display/displayConnection";

interface StationDiagramProps {
  connections: DisplayConnection[];
  width?: number;
  height?: number;
}

export const StationDiagram: React.FC<StationDiagramProps> = ({
  connections,
  width = 800,
  height = 500,
}) => {
  const MARGIN = {
    left: 100, // Increased left margin to accommodate track labels
    right: 20,
    top: 30,
    bottom: 30,
  };
  const contentWidth = width - MARGIN.left - MARGIN.right;
  const contentHeight = height - MARGIN.top - MARGIN.bottom;

  // Get unique tracks and sort them
  const tracks = [
    ...new Set(
      connections
        .map((conn) => conn.track)
        .filter((track) => track !== undefined),
    ),
  ].sort((a, b) => parseFloat(a) - parseFloat(b));
  const trackHeight = contentHeight / tracks.length;

  // Calculate time range (1 hour window)
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000);

  // Helper function to convert time to x position
  const timeToX = (time: string) => {
    const t = new Date(time).getTime();
    return (
      MARGIN.left +
      ((t - now.getTime()) / (endTime.getTime() - now.getTime())) * contentWidth
    );
  };

  // Helper function to convert track to y position
  const trackToY = (track: string) => {
    const index = tracks.indexOf(track);
    return MARGIN.top + index * trackHeight + trackHeight / 2;
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Draw ticks aligned with clock hours */}
        {(() => {
          const ticks = [];
          const startMinutes = now.getMinutes();
          let currentTime = new Date(now);

          // Round to the nearest previous 15 minutes
          currentTime.setMinutes(Math.floor(startMinutes / 15) * 15, 0, 0);

          // Generate ticks until we reach past the end time
          while (currentTime <= endTime) {
            const x = timeToX(currentTime.toISOString());
            const minutes = currentTime.getMinutes();
            const isFullHour = minutes === 0;

            ticks.push(
              <React.Fragment key={currentTime.getTime()}>
                <Line
                  points={[x, MARGIN.top, x, height - MARGIN.bottom + 10]}
                  stroke={"#aaa"}
                  strokeWidth={isFullHour ? 2 : 1}
                />
                {isFullHour && (
                  <Text
                    text={
                      currentTime.getHours().toString().padStart(2, "0") + ":00"
                    }
                    x={x - 10}
                    y={height - MARGIN.bottom + 12}
                    fontSize={12}
                  />
                )}
              </React.Fragment>,
            );

            // Add 15 minutes for next tick
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
          }
          return ticks;
        })()}

        {/* Draw track lines and labels */}
        {tracks.map((track, index) => (
          <React.Fragment key={track}>
            <Line
              points={[
                MARGIN.left,
                trackToY(track),
                width - MARGIN.right,
                trackToY(track),
              ]}
              stroke="#ddd"
              strokeWidth={1}
            />
            <Text
              text={`${track}`}
              x={5}
              y={trackToY(track) - 10}
              align="right"
              width={MARGIN.left - 10}
              fill="white"
            />
          </React.Fragment>
        ))}

        {/* Draw trains */}
        {connections.map((conn, index) => {
          const color = conn.color?.split("~")[1] || "white";
          console.debug(color);

          let x1: number, x2: number;

          if (conn.mode === "Passing" || conn.mode === "Terminal") {
            x1 = timeToX(conn.arrival_time);
            x2 = Math.max(x1 + 50, timeToX(conn.departure_time));
          } else if (conn.mode === "Arrival") {
            x1 = timeToX(conn.arrival_time);
            x2 = x1 + 50; // Fixed width for arrival
          } else {
            // Departure
            x2 = timeToX(conn.departure_time);
            x1 = x2 - 50; // Fixed width for departure
          }

          if (!conn.track) return null;

          return (
            <React.Fragment key={index}>
              <Rect
                x={x1}
                y={trackToY(conn.track) - 20 / 2}
                width={x2 - x1}
                height={20}
                fill={conn.color ? `#${conn.color.split("~")[0]}` : "#666"}
                cornerRadius={5}
              />
              <Text
                text={conn.line}
                x={x1 + 5}
                y={trackToY(conn.track) - 8}
                fill={conn.color ? `#${conn.color.split("~")[1]}` : "#666"}
                fontSize={14}
              />
            </React.Fragment>
          );
        })}
      </Layer>
    </Stage>
  );
};
