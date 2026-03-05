'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Line, LineChart, ComposedChart, ReferenceLine } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { lazy } from "react"
import { X } from "lucide-react"

// 1. Parse the JSON data
const rawData = {
  "timestamp": 1710000000.52,
  "mode": "Autonomous",
  "drones": [
    { "id": 1, "pose": { "x": 12.53, "y": -3.22 } },
    { "id": 2, "pose": { "x": 10.14, "y": -1.04 } },
    { "id": 3, "pose": { "x": 5.01, "y": 2.88 } },
    { "id": 4, "pose": { "x": 7.66, "y": 4.31 } }
  ],
  "mines": [
    { "x": 3.12, "y": 8.45 },
    { "x": 6.72, "y": -2.11 },
    { "x": -1.44, "y": 5.03 }
  ],
  "navigation_path": [
    { "x": 0.0, "y": 0.0 },
    { "x": 1.0, "y": 0.5 },
    { "x": 2.0, "y": 1.1 },
    { "x": 3.2, "y": 1.8 },
    { "x": 4.4, "y": 2.6 }
  ]
};

// Transform drones data
const dronesData = rawData.drones.map(drone => ({
  x: drone.pose.x,
  y: drone.pose.y,
  label: 'drone',
  id: drone.id
}));

// Transform mines data
const minesData = rawData.mines.map((mine, idx) => ({
  x: mine.x,
  y: mine.y,
  label: 'mine',
  id: idx
}));

// Navigation path data
const navigationPath = rawData.navigation_path;

// Calculate dynamic domains based on data
const allPoints = [...dronesData, ...minesData];
const xValues = allPoints.map(p => p.x);
const yValues = allPoints.map(p => p.y);
const xMin = Math.min(...xValues);
const xMax = Math.max(...xValues);
const yMin = Math.min(...yValues);
const yMax = Math.max(...yValues);

// Add padding (10% of the range)
const xPadding = (xMax - xMin) * 0.1;
const yPadding = (yMax - yMin) * 0.1;
const xDomain = [Math.floor((xMin - xPadding) * 10) / 10, Math.ceil((xMax + xPadding) * 10) / 10];
const yDomain = [Math.floor((yMin - yPadding) * 10) / 10, Math.ceil((yMax + yPadding) * 10) / 10];

// 2. Define the configuration for colors and labels
const chartConfig = {
  xy: {
    label: "hehe",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const renderCustomShape = (props: any) => {
  const { cx, cy, fill } = props;
  return (
    <path
      d="M0 10 L5 0 L10 10z" // Triangle shape path
      fill={fill}
      transform={`translate(${cx - 5},${cy - 5})`} // Center the triangle on the point
    />
  );
};

export default function XYChart() {
  return (
    // 3. Wrap in ChartContainer for shadcn styling
    <div style={{ aspectRatio: "2/9", width: "180px", height: "auto" }}>
      <ChartContainer config={chartConfig} style={{ width: "100%", height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} data={navigationPath}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* Set type="number" for XAxis to handle coordinates properly */}
          <XAxis type="number" dataKey="x" name="X-Axis" unit="m" domain={xDomain} />
          <YAxis type="number" dataKey="y" name="Y-Axis" unit="m" domain={yDomain} />
          {/* Rectangle outline based on data bounds */}
          <ReferenceLine x={xDomain[0]} stroke="black" strokeWidth={2} />
          <ReferenceLine x={xDomain[1]} stroke="black" strokeWidth={2} />
          <ReferenceLine y={yDomain[0]} stroke="black" strokeWidth={2} />
          <ReferenceLine y={yDomain[1]} stroke="black" strokeWidth={2} />
        <Tooltip content={<ChartTooltipContent />} />
        {/* Render the navigation path */}
        <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} name="Navigation Path" isAnimationActive={false} />
        {/* Render the scatter points */}
        <Scatter name="Drones" data={dronesData} fill="var(--color-xy)" shape={renderCustomShape} />
        <Scatter name="Mines" data={minesData} fill="red" />
      </ComposedChart>
        </ResponsiveContainer>
    </ChartContainer>
    </div>
  )
}
