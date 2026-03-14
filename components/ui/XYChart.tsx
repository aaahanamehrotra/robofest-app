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
  const [showDroneModal, setShowDroneModal] = useState(false);
  const [showMineModal, setShowMineModal] = useState(false);
  const [viewGraph, setViewGraph] = useState(false);
  
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

  const { dronesData, minesData, navigationPath, xDomain, yDomain } = useMemo(() => {
    
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
            xDomain: [-25, 25],
            yDomain: [-25, 25]
        };
    }

    const xValues = allPoints.map(p => p.x);
    const yValues = allPoints.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const xPadding = (xMax - xMin) * 0.12 || 1; 
    const yPadding = (yMax - yMin) * 0.12 || 1;
    
    return {
      dronesData: drones,
      minesData: mines,
      navigationPath: rawData.navigation_path.map((point: any) => ({
        x: point.x + xOrigin,
        y: point.y + yOrigin
      })),
      xDomain: [Math.floor((xMin - xPadding) * 10) / 10, Math.ceil((xMax + xPadding) * 10) / 10],
      yDomain: [Math.floor((yMin - yPadding) * 10) / 10, Math.ceil((yMax + yPadding) * 10) / 10]
    };
  }, [rawData, xOrigin, yOrigin]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start", width: "100%" }}>

      <div style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "12px",
        backgroundColor: "#f9f9f9",
        width: "100%"
      }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold", textAlign: "center" }}>
        </h3>

        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 12 }}>Mode: {rawData.mode}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #666", background: showDroneModal ? "#2f86eb" : "white", color: showDroneModal ? "white" : "black" }} onClick={() => { setShowDroneModal(true); }}>Show Drone Data</button>
            <button style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #666", background: showMineModal ? "#2f86eb" : "white", color: showMineModal ? "white" : "black" }} onClick={() => { setShowMineModal(true); }}>Show Mines Data</button>
            <button style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #666", background: viewGraph ? "#2f86eb" : "white", color: viewGraph ? "white" : "black" }} onClick={() => setViewGraph(!viewGraph)}>View Graph</button>
          </div>
        </div>
      </div>

      
        <div style={{ aspectRatio: "2/9", width: viewGraph ? "200%":"180px", height: "auto" }}>
          <ChartContainer config={chartConfig} style={{ width: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} data={navigationPath}>
                <Customized component={BackgroundRect} />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="X-Axis" unit="m" domain={xDomain} />
                <YAxis type="number" dataKey="y" name="Y-Axis" unit="m" domain={yDomain} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="y" stroke="#8884d8" dot={false} name="Navigation Path" isAnimationActive={false} />
                <Scatter name="Drones" data={dronesData} fill="var(--color-xy)" shape={renderCustomShape} />
                <Scatter name="Mines" data={minesData} fill="red" shape={renderMineShape} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      

      {showDroneModal && (
        <div style={{ position: "fixed", left: 0, top: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: 10, width: "min(92vw, 500px)", maxHeight: "80vh", overflow: "auto", padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Drone Data</h3>
              <button onClick={() => setShowDroneModal(false)} style={{ border: "1px solid #ccc", borderRadius: 6, padding: "4px 8px", background: "#f3f3f3" }}>Close</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>ID</th>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>Battery</th>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>X</th>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>Y</th>
                </tr>
              </thead>
              <tbody>
                {dronesData.map((drone: any) => (
                  <tr key={drone.id}>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{drone.id}</td>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{drone.battery ?? "N/A"}</td>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{drone.x.toFixed ? drone.x.toFixed(2) : drone.x}</td>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{drone.y.toFixed ? drone.y.toFixed(2) : drone.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMineModal && (
        <div style={{ position: "fixed", left: 0, top: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "white", borderRadius: 10, width: "min(92vw, 500px)", maxHeight: "80vh", overflow: "auto", padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Mines Data</h3>
              <button onClick={() => setShowMineModal(false)} style={{ border: "1px solid #ccc", borderRadius: 6, padding: "4px 8px", background: "#f3f3f3" }}>Close</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>Mine ID</th>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>X</th>
                  <th style={{ padding: 6, border: "1px solid #ccc", textAlign: "left" }}>Y</th>
                </tr>
              </thead>
              <tbody>
                {minesData.map((mine: any) => (
                  <tr key={mine.id}>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{mine.id}</td>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{mine.x.toFixed ? mine.x.toFixed(2) : mine.x}</td>
                    <td style={{ padding: 6, border: "1px solid #ccc" }}>{mine.y.toFixed ? mine.y.toFixed(2) : mine.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}