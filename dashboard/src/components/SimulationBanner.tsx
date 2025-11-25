'use client'

import { useSimulationContext } from '@/simulation/SimulationProvider'

export default function SimulationBanner() {
  const { isSimulationMode, simulationState, stopSimulation } = useSimulationContext()

  if (!isSimulationMode) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black border-b-2 border-yellow-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
              <span className="font-bold text-sm">⚠️ SIMULATION MODE ACTIVE</span>
            </div>
            <span className="text-sm font-medium">All sensor data is fake</span>
            <span className="text-xs bg-black text-yellow-400 px-2 py-1 rounded">
              {simulationState.generatorState.ppm.toFixed(0)} PPM
            </span>
            <span className="text-xs bg-black text-yellow-400 px-2 py-1 rounded">
              {simulationState.generatorState.quality}
            </span>
            <span className="text-xs bg-black text-yellow-400 px-2 py-1 rounded">
              {simulationState.generatorState.trend.toUpperCase()}
            </span>
          </div>
          <button
            onClick={stopSimulation}
            className="text-sm font-medium bg-black text-yellow-400 px-3 py-1 rounded hover:bg-gray-900 transition-colors"
          >
            Exit Simulation
          </button>
        </div>
      </div>
    </div>
  )
}