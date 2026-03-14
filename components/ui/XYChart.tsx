'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Customized, ComposedChart, ReferenceLine } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"


const emptyData = {
  timestamp: 0,
  mode: "Connecting...",
  drones: [],
  mines: [],
  navigation_path: []
}

const chartConfig = {
  xy: {
    label: "hehe",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const renderCustomShape = (props: any) => {
  const { cx, cy } = props;
  return (
    <image href="/drone_icon.png" x={cx - 10} y={cy - 10} width="20" height="20" />
  );
};

const renderMineShape = (props: any) => {
  const { cx, cy } = props;
  const size = 16;
  const radius = size / 2;
  const gradientId = `mine-gradient-${props.id ?? Math.random().toString(36).slice(2, 8)}`;

  return (
    <g>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#ff3a3a" stopOpacity="1" />
          <stop offset="50%" stopColor="#ff3a3a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ff3a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill={`url(#${gradientId})`} />
      <circle cx={cx} cy={cy} r={radius * 0.35} fill="#ff0000" opacity="0.9" />
    </g>
  );
};

// 1. Add this component
const BackgroundRect = (props: any) => {
  const { xAxisMap, yAxisMap } = props;
  const xAxis = Object.values(xAxisMap)[0] as any;
  const yAxis = Object.values(yAxisMap)[0] as any;
  return (
    <rect
      x={xAxis.x}
      y={yAxis.y}
      width={xAxis.width}
      height={yAxis.height}
      fill="#98ba65"
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
      id: drone.id,
      battery: drone.battery  // add this
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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start", }}>


      <div style={{
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "12px",
      backgroundColor: "#f9f9f9",
      minWidth: "180px",
    }}>
      <h3 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold", textAlign: "center" }}>
        Drone Coordinates
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ backgroundColor: "#e0e0e0" }}>
            <th style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>ID</th>
            <th style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>Battery</th>
            <th style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>X (m)</th>
            <th style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>Y (m)</th>
          </tr>
        </thead>
        <tbody>
          {dronesData.map(drone => (
            <tr key={drone.id}>
              <td style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>{drone.id}</td>
              <td style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>{drone.battery ?? "N/A"}</td>
              <td style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>{drone.x}</td>
              <td style={{ padding: "6px", border: "1px solid #ccc", textAlign: "center" }}>{drone.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
      Mode: {rawData.mode}
    </div>



     <div style={{ aspectRatio: "2/9", width: "360px", height: "auto"}}>
       <ChartContainer config={chartConfig} style={{ width: "100%", height: "100%" }}>
         <ResponsiveContainer width="100%" height="100%">
           <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} data={navigationPath}>
  <Customized component={<BackgroundRect />} />

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
         <Scatter name="Mines" data={minesData} fill="red" shape={renderMineShape} />
       </ComposedChart>
         </ResponsiveContainer>
     </ChartContainer>
     </div>

      
       



     </div>
  )
}