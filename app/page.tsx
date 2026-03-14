'use client'
import XYChart from "@/components/ui/XYChart"; // Adjust this import path if you saved it elsewhere
import { useState } from "react";

export default function Home() {
  const [xOrigin, setXOrigin] = useState(0);
  const [yOrigin, setYOrigin] = useState(0);
  const [isConfigured, setIsConfigured] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigured(true);
  };

  return (
    <main className="flex min-h-screen flex-col justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="z-10 w-full max-w-5xl flex flex-col gap-8 font-mono text-sm">
        
        {/* <div className="text-center"> */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2 te">
            Live Drone Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
          </p>
        {/* </div> */}

        {!isConfigured ? (
          <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Set Origin Coordinates</h2>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <label htmlFor="xOrigin" className="text-sm font-medium">X Origin</label>
                  <input
                    id="xOrigin"
                    type="number"
                    step="0.01"
                    value={xOrigin}
                    onChange={(e) => setXOrigin(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="yOrigin" className="text-sm font-medium">Y Origin</label>
                  <input
                    id="yOrigin"
                    type="number"
                    step="0.01"
                    value={yOrigin}
                    onChange={(e) => setYOrigin(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Set Origin
              </button>
            </form>
          </div>
        ) : (
          // <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
            <XYChart xOrigin={xOrigin} yOrigin={yOrigin} />
          // </div>
        )}

      </div>
    </main>
  );
}