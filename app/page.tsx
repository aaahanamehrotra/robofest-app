import XYChart from "@/components/ui/XYChart"; // Adjust this import path if you saved it elsewhere

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-slate-50 dark:bg-slate-950">
      <div className="z-10 w-full max-w-5xl flex flex-col items-center gap-8 font-mono text-sm">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Live Drone Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
          </p>
        </div>

        {/* Chart Container */}
        <div className="w-full bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
          <XYChart />
        </div>

      </div>
    </main>
  );
}