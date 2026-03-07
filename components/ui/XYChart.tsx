'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceLine } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"


const emptyData = {
  timestamp: 0,
  mode: "Connecting...",
  drones: [],
  mines: [],
  navigation_path: []
};

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
      d="M0 10 L5 0 L10 10z" 
      fill={fill}
      transform={`translate(${cx - 5},${cy - 5})`} 
    />
  );
};

export default function XYChart({ xOrigin, yOrigin }: { xOrigin: number; yOrigin: number }) {
  // 2. Start with the empty skeleton
  const [rawData, setRawData] = useState(emptyData);
  
  const socketRef = useRef<WebSocket | null>(null);
  const latestDataRef = useRef(emptyData);
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    // 3. Match the port from your Python server.py
    socketRef.current = new WebSocket('ws://localhost:8080'); 
    
    socketRef.current.onopen = () => {
      console.log('Connected to Python WebSocket Server!');
    };

    socketRef.current.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        latestDataRef.current = newData;

        const now = Date.now();
        // Throttle updates to 10Hz (100ms) to keep React smooth 
        // while the Python server pumps data at 20Hz
        if (now - lastUpdateTimeRef.current > 100) {
          setRawData(latestDataRef.current);
          lastUpdateTimeRef.current = now;
        }
      } catch (error) {
        console.error("Error parsing websocket data:", error);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const { dronesData, minesData, navigationPath } = useMemo(() => {
    const drones = rawData.drones.map((drone: any) => ({
      x: drone.pose.x + xOrigin,
      y: drone.pose.y + yOrigin,
      label: 'drone',
      id: drone.id
    }));

    const mines = rawData.mines.map((mine: any, idx: number) => ({
      x: mine.x + xOrigin,
      y: mine.y + yOrigin,
      label: 'mine',
      id: idx
    }));

    const allPoints = [...drones, ...mines];
    
    // 4. Handle the empty state before the server sends the first packet
    if (allPoints.length === 0) {
        // Return a default zoomed-out view while waiting for data
        return { 
            dronesData: [], 
            minesData: [], 
            navigationPath: [], 
            // xDomain: [-25, 25], // Matched roughly to your Python script's random uniform bounds
            // yDomain: [-25, 25] 
        };
    }

    const xValues = allPoints.map(p => p.x);
    const yValues = allPoints.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    console.log(xMax, xMin, yMax, yMin)
    const xPadding = (xMax - xMin) * 0.1 || 1; 
    const yPadding = (yMax - yMin) * 0.1 || 1;
    
    return {
      dronesData: drones,
      minesData: mines,
      navigationPath: rawData.navigation_path.map((point: any) => ({
        x: point.x + xOrigin,
        y: point.y + yOrigin
      })),
      // xDomain: [Math.floor((xMin - xPadding) * 10) / 10, Math.ceil((xMax + xPadding) * 10) / 10],
      // yDomain: [Math.floor((yMin - yPadding) * 10) / 10, Math.ceil((yMax + yPadding) * 10) / 10]
    };
  }, [rawData, xOrigin, yOrigin]);

  return (
     <div style={{ aspectRatio: "2/9", width: "180px", height: "auto" }}>
       <ChartContainer config={chartConfig} style={{ width: "100%", height: "100%" }}>
         <ResponsiveContainer width="100%" height="100%">
           <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} data={navigationPath}>
           <CartesianGrid strokeDasharray="3 3" />
           {/* Set type="number" for XAxis to handle coordinates properly */}
           <XAxis type="number" dataKey="x" name="X-Axis" unit="m" domain={[0, 20]} />
           <YAxis type="number" dataKey="y" name="Y-Axis" unit="m" domain={[0, 90]} />
           {/* Rectangle outline based on data bounds */}
           {/* <ReferenceLine x={0} stroke="black" strokeWidth={2} />
           <ReferenceLine x={20} stroke="black" strokeWidth={2} />
           <ReferenceLine y={0} stroke="black" strokeWidth={2} />
           <ReferenceLine y={90} stroke="black" strokeWidth={2} /> */}
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