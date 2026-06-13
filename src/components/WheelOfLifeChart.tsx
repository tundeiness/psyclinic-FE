"use client";

import { WOL_AREAS } from "@/lib/wheelOfLifeItems";
import { WolTotals } from "@/lib/wheelOfLifeApi";

// Phase 18.2: 9-spoke spider/radar chart for the Wheel of Life.
// Pure SVG, no library. Renders concentric reference circles for
// each 10% gradation, 9 spokes to area labels, and a polygon
// overlay showing the client's percentages per area.
//
// Spoke geometry: index 0 is at the top (90° in math, 12 o'clock
// visually), proceeding clockwise so the order on the chart matches
// the order in WOL_AREAS (and the source CTI form's layout).
export function WheelOfLifeChart({
  totals,
  size = 360,
}: {
  totals: WolTotals;
  size?: number;
}) {
  const padding = 60; // room for labels around the wheel
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - padding;

  // Compute vertex positions in canvas coordinates (y grows
  // downward in SVG, so we subtract sin to flip vertically).
  function vertex(index: number, fraction: number): [number, number] {
    const angle = Math.PI / 2 - (2 * Math.PI * index) / WOL_AREAS.length;
    const x = cx + r * fraction * Math.cos(angle);
    // Flip y because SVG y-axis is downward.
    const y = cy - r * fraction * Math.sin(angle);
    return [x, y];
  }

  // Polygon points for the client's actual percentages.
  const dataPoints = WOL_AREAS.map((area, i) => {
    const pct = totals[area.key]?.percentage ?? 0;
    return vertex(i, pct / 100);
  });
  const dataPath = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Wheel of Life radial chart"
    >
      {/* Concentric reference circles every 10% */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((fraction) => (
        <circle
          key={fraction}
          cx={cx}
          cy={cy}
          r={r * fraction}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={fraction === 1.0 ? 1.5 : 0.75}
          strokeDasharray={fraction === 1.0 ? "" : "3 3"}
        />
      ))}

      {/* Spokes */}
      {WOL_AREAS.map((_, i) => {
        const [x, y] = vertex(i, 1.0);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#CBD5E1"
            strokeWidth={0.75}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPath}
        fill="#0F4D43"
        fillOpacity={0.18}
        stroke="#0F4D43"
        strokeWidth={1.5}
      />

      {/* Data vertex dots */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#0F4D43" />
      ))}

      {/* Area labels positioned just outside each spoke endpoint */}
      {WOL_AREAS.map((area, i) => {
        const [lx, ly] = vertex(i, 1.18);
        // Pick a text-anchor based on which side of center the label
        // sits on, so the text grows away from the wheel rather than
        // over it.
        const dx = lx - cx;
        const textAnchor =
          Math.abs(dx) < 8 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <text
            key={area.key}
            x={lx}
            y={ly}
            fontSize={10}
            fill="#475569"
            textAnchor={textAnchor}
            dominantBaseline="middle"
          >
            {area.label}
          </text>
        );
      })}
    </svg>
  );
}
