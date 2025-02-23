import React from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva";
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
    left: 50,
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
        {/* Draw time axis */}
        <Line
          points={[
            MARGIN.left,
            height - MARGIN.bottom,
            width - MARGIN.right,
            height - MARGIN.bottom,
          ]}
          stroke="black"
          strokeWidth={1}
        />

        {/* Draw ticks every 15 minutes */}
        {Array.from({ length: 5 }).map((_, i) => {
          const tickTime = new Date(now.getTime() + i * 15 * 60 * 1000);
          const x = timeToX(tickTime.toISOString());
          const isFullHour = tickTime.getMinutes() === 0;

          return (
            <React.Fragment key={i}>
              {/* Tick */}
              <Line
                points={[
                  x,
                  height - MARGIN.bottom,
                  x,
                  height - MARGIN.bottom + 10,
                ]}
                stroke={isFullHour ? "black" : "#aaa"}
                strokeWidth={1}
              />
              {/* Label for full hour */}
              {isFullHour && (
                <Text
                  text={tickTime.getHours().toString().padStart(2, "0") + ":00"}
                  x={x - 10}
                  y={height - MARGIN.bottom + 12}
                  fontSize={12}
                />
              )}
            </React.Fragment>
          );
        })}

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
            x2 = x1 + 50; // Fixed width for arrival-only trains
          } else {
            x2 = timeToX(conn.departure_time);
            x1 = x2 - 50; // Fixed width for departure-only trains
          }

          return (
            <React.Fragment key={index}>
              <Rect
                x={x1}
                y={trackToY(conn.track) - 15}
                width={x2 - x1}
                height={30}
                fill={conn.color ? `#${conn.color.split("~")[0]}` : "#666"}
                cornerRadius={5}
              />
              <Text
                text={conn.line}
                x={x1 + 5}
                y={trackToY(conn.track) - 10}
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
