'use client'

import { useSimulationContext } from '@/simulation/SimulationProvider'

export default function SimulationBanner() {
  const { isSimulationMode, simulationState, stopSimulation } = useSimulationContext()

  if (!isSimulationMode) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-50 border-b border-amber-300/30 bg-amber-300 text-slate-950 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-black" />
              <span className="text-sm font-bold">SIMULATION MODE ACTIVE</span>
            </div>
            <span className="hidden text-sm font-medium sm:inline">Sensor data is generated locally</span>
            <span className="rounded bg-black px-2 py-1 font-mono text-xs text-amber-300">
              {simulationState.generatorState.ppm.toFixed(0)} PPM
            </span>
            <span className="hidden rounded bg-black px-2 py-1 font-mono text-xs text-amber-300 sm:inline">
              {simulationState.generatorState.quality}
            </span>
            <span className="hidden rounded bg-black px-2 py-1 font-mono text-xs text-amber-300 md:inline">
              {simulationState.generatorState.trend.toUpperCase()}
            </span>
          </div>
          <button
            onClick={stopSimulation}
            className="shrink-0 rounded bg-black px-3 py-1 text-sm font-semibold text-amber-300 transition hover:bg-gray-900"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
