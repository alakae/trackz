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
              const effectiveArrival = getEffectiveArrivalTime(conn);
              const effectiveDeparture = getEffectiveDepartureTime(conn);
              if (effectiveDeparture < now) {
                return null;
              }

              scheduledX1 = timeToX(conn.arrival_time);
              scheduledX2 = Math.max(
                scheduledX1 + minimum,
                timeToX(conn.departure_time),
              );

              effectiveX1 = timeToX(effectiveArrival);
              effectiveX2 = Math.max(
                effectiveX1 + minimum,
                timeToX(effectiveDeparture),
              );
            } else if (conn.mode === "Arrival") {
              const effectiveArrival = getEffectiveArrivalTime(conn);
              if (effectiveArrival < now) {
                return null;
              }

              scheduledX1 = timeToX(conn.arrival_time);
              scheduledX2 = scheduledX1 + minimum;

              effectiveX1 = timeToX(effectiveArrival);
              effectiveX2 = effectiveX1 + minimum;
            } else {
              // Departure
              const effectiveDeparture = getEffectiveDepartureTime(conn);
              if (effectiveDeparture < now) {
                return null;
              }

              scheduledX2 = timeToX(conn.departure_time);
              scheduledX1 = scheduledX2 - minimum;

              effectiveX2 = timeToX(effectiveDeparture);
              effectiveX1 = effectiveX2 - minimum;
            }

            if (!conn.track) return null;

            // Clamp scheduled box to visible area
            const clampedScheduledX1 = Math.max(scheduledX1, MARGIN.left);
            const clampedScheduledX2 = scheduledX2;
            const scheduledWidth = clampedScheduledX2 - clampedScheduledX1;

            // Clamp effective box to visible area
            const clampedEffectiveX1 = Math.max(effectiveX1, MARGIN.left);
            const clampedEffectiveX2 = effectiveX2;
            const effectiveWidth = clampedEffectiveX2 - clampedEffectiveX1;

            // Skip if both boxes are entirely off-screen to the left
            if (
              clampedScheduledX2 <= MARGIN.left &&
              clampedEffectiveX2 <= MARGIN.left
            ) {
              return null;
            }

            const hasDelay =
              effectiveX1 !== scheduledX1 || effectiveX2 !== scheduledX2;

            return (
              <React.Fragment key={index}>
                {/* Scheduled position (solid fill) */}
                {scheduledWidth > 0 && (
                  <Rect
                    x={clampedScheduledX1}
                    y={trackToY(conn.track) - 20 / 2}
                    width={scheduledWidth}
                    height={20}
                    fill={conn.color ? `#${conn.color.split("~")[0]}` : "#666"}
                    cornerRadius={5}
                  />
                )}
                {/* Effective position (outline) when delayed */}
                {hasDelay && effectiveWidth > 0 && (
                  <Rect
                    x={clampedEffectiveX1}
                    y={trackToY(conn.track) - 20 / 2}
                    width={effectiveWidth}
                    height={20}
                    fill="transparent"
                    stroke={
                      conn.color ? `#${conn.color.split("~")[1]}` : "#fff"
                    }
                    strokeWidth={2}
                    cornerRadius={5}
                  />
                )}
                {/* Label - position at whichever box is visible */}
                {(scheduledWidth > 0 || effectiveWidth > 0) && (
                  <Text
                    text={conn.line}
                    x={
                      Math.max(
                        clampedScheduledX1,
                        clampedEffectiveX1,
                        MARGIN.left,
                      ) + 5
                    }
                    y={trackToY(conn.track) - 8}
                    fill={conn.color ? `#${conn.color.split("~")[1]}` : "#fff"}
                    fontSize={14}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
