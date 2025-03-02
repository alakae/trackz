import React from "react";
import { Layer, Line, Rect, Stage, Text } from "react-konva";
import { useMeasure } from "react-use";
import {
  DisplayConnection,
  getEffectiveArrivalTime,
  getEffectiveDepartureTime,
} from "../display/displayConnection.ts";
import { useTriggerAutoRefresh } from "../utils/useTriggerAutoRefresh.tsx";

interface StationDiagramProps {
  connections: DisplayConnection[];
}

export const StationDiagram: React.FC<StationDiagramProps> = ({
  connections,
}) => {
  useTriggerAutoRefresh();

  const MARGIN = {
    left: 40,
    right: 0,
    top: 30,
    bottom: 30,
  };
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  // Get unique tracks and sort them
  const tracks = [
    ...new Set(
      connections
        .map((conn) => conn.track)
        .filter((track) => track !== undefined),
    ),
  ].sort((a, b) => a - b);
  const trackHeight =
    (bounds.height - MARGIN.top - MARGIN.bottom) / tracks.length;

  // Calculate time range (1 hour window)
  const now = new Date();
  const endTime = new Date(now.getTime() + 60 * 60 * 1000);

  // Helper function to convert time to x position
  const timeToX = (time: Date) => {
    const t = time.getTime();
    return (
      MARGIN.left +
      ((t - now.getTime()) / (endTime.getTime() - now.getTime())) * bounds.width
    );
  };

  // Helper function to convert track to y position
  const trackToY = (track: number) => {
    const index = tracks.indexOf(track);
    return MARGIN.top + index * trackHeight + trackHeight / 2;
  };

  return (
    <div
      ref={ref}
      style={{
        width: "100vw",
        maxWidth: "1200px",
        height: "50vh",
        minHeight: "500px",
      }}
    >
      <Stage width={bounds.width} height={bounds.height}>
        <Layer>
          {/* Draw lines aligned with clock hours */}
          {(() => {
            const lines = [];
            const startMinutes = now.getMinutes();
            let currentTime = new Date(now);

            // Round to the nearest previous 5 minutes
            currentTime.setMinutes(Math.ceil(startMinutes / 5) * 5, 0, 0);

            // Generate lines until we reach past the end time
            while (currentTime < endTime) {
              const x = timeToX(currentTime);
              if (x < MARGIN.left) {
                currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
                continue;
              }
              const minutes = currentTime.getMinutes();
              const isFullHour = minutes === 0;
              const isQuarterHour = minutes % 15 === 0 && !isFullHour;

              lines.push(
                <React.Fragment key={currentTime.getTime()}>
                  <Line
                    points={[
                      x,
                      MARGIN.top,
                      x,
                      bounds.height - MARGIN.bottom + 10,
                    ]}
                    stroke={"#aaa"}
                    strokeWidth={isFullHour ? 2 : isQuarterHour ? 1 : 1}
                    dash={isFullHour || isQuarterHour ? [] : [4, 4]} // Dashed line for every 5 minutes
                  />

                  <Text
                    text={
                      currentTime.getHours().toString().padStart(2, "0") +
                      ":" +
                      currentTime.getMinutes().toString().padStart(2, "0")
                    }
                    x={x - 15}
                    y={bounds.height - MARGIN.bottom + 12}
                    fontSize={12}
                    fill="white"
                  />
                </React.Fragment>,
              );

              // Add 5 minutes for next tick
              currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
            }
            return lines;
          })()}

          {/* Draw track lines and labels */}
          {tracks.map((track) => (
            <React.Fragment key={track}>
              <Line
                points={[
                  MARGIN.left,
                  trackToY(track),
                  bounds.width - MARGIN.right,
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
            let scheduledX1: number, scheduledX2: number;
            let effectiveX1: number, effectiveX2: number;

            const minimum = 20;
            if (conn.mode === "Passing" || conn.mode === "Terminal") {
              // Scheduled times
              scheduledX1 = timeToX(conn.arrival_time);
              scheduledX2 = Math.max(
                scheduledX1 + minimum,
                timeToX(conn.departure_time),
              );

              // Effective times
              const effectiveArrival = getEffectiveArrivalTime(conn);
              const effectiveDeparture = getEffectiveDepartureTime(conn);
              if (effectiveDeparture < now) {
                return null;
              }

              effectiveX1 = timeToX(effectiveArrival);
              effectiveX2 = Math.max(
                effectiveX1 + minimum,
                timeToX(effectiveDeparture),
              );
            } else if (conn.mode === "Arrival") {
              // Scheduled times
              scheduledX1 = timeToX(conn.arrival_time);
              scheduledX2 = scheduledX1 + minimum;

              // Effective times
              const effectiveArrival = getEffectiveArrivalTime(conn);
              if (effectiveArrival < now) {
                return null;
              }
              effectiveX1 = timeToX(effectiveArrival);
              effectiveX2 = effectiveX1 + minimum;
            } else {
              // Departure
              // Scheduled times
              scheduledX2 = timeToX(conn.departure_time);
              scheduledX1 = Math.max(scheduledX2 - minimum, MARGIN.left);
              if (scheduledX2 - scheduledX1 < minimum) {
                scheduledX2 = scheduledX1 + minimum;
              }

              // Effective times
              const effectiveDeparture = getEffectiveDepartureTime(conn);
              if (effectiveDeparture < now) {
                return null;
              }

              effectiveX2 = timeToX(effectiveDeparture);
              effectiveX1 = Math.max(effectiveX2 - minimum, MARGIN.left);
              if (effectiveX2 - effectiveX1 < minimum) {
                effectiveX2 = effectiveX1 + minimum;
              }
            }

            if (!conn.track) return null;

            return (
              <React.Fragment key={index}>
                <Rect
                  x={Math.max(scheduledX1, MARGIN.left)}
                  y={trackToY(conn.track) - 20 / 2}
                  width={scheduledX2 - scheduledX1}
                  height={20}
                  fill={conn.color ? `#${conn.color.split("~")[0]}` : "#666"}
                  cornerRadius={5}
                />
                {(effectiveX1 !== scheduledX1 ||
                  effectiveX2 !== scheduledX2) && (
                  <Rect
                    x={Math.max(effectiveX1 ?? scheduledX1, MARGIN.left)}
                    y={trackToY(conn.track) - 20 / 2}
                    width={
                      (effectiveX2 ?? scheduledX2) -
                      (effectiveX1 ?? scheduledX1)
                    }
                    height={20}
                    fill="transparent"
                    stroke={
                      conn.color ? `#${conn.color.split("~")[1]}` : "#fff"
                    }
                    strokeWidth={2}
                    cornerRadius={5}
                  />
                )}
                <Text
                  text={conn.line}
                  x={Math.max(scheduledX1, MARGIN.left) + 5}
                  y={trackToY(conn.track) - 8}
                  fill={conn.color ? `#${conn.color.split("~")[1]}` : "#666"}
                  fontSize={14}
                />
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
