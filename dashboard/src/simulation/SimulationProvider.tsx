'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSimulation } from './simulationController'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface AlertEntry {
  id: string
  timestamp: string
  ppm: number
  quality: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  device_id: string
  relay_state: string
  isSimulated: boolean
}

interface DeviceCommand {
  relay_state: string
  sampling_interval: number
  oled_message: string
  last_update: number
}

interface SimulationContextType {
  isSimulationMode: boolean
  simulatedData: SensorReading[]
  simulatedAlerts: AlertEntry[]
  currentReading: SensorReading | null
  deviceOnline: boolean
  deviceCommands: DeviceCommand | null
  startSimulation: (interval?: number) => void
  stopSimulation: () => void
  setSimulationScenario: (scenario: 'normal' | 'warning' | 'critical' | 'recovery') => void
  updateSimulationCommand: (commands: Partial<DeviceCommand>) => void
  simulationState: {
    isRunning: boolean
    updateInterval: number
    deviceOnline: boolean
    generatorState: {
      ppm: number
      quality: string
      trend: string
      deviceId: string
    }
  }
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

interface SimulationProviderProps {
  children: ReactNode
}

export function SimulationProvider({ children }: SimulationProviderProps) {
  const simulation = useSimulation()

  const contextValue: SimulationContextType = {
    isSimulationMode: simulation.isSimulationMode,
    simulatedData: simulation.simulatedData,
    simulatedAlerts: simulation.simulatedAlerts,
    currentReading: simulation.currentReading,
    deviceOnline: simulation.deviceOnline,
    deviceCommands: simulation.deviceCommands,
    startSimulation: simulation.startSimulation,
    stopSimulation: simulation.stopSimulation,
    setSimulationScenario: simulation.setSimulationScenario,
    updateSimulationCommand: simulation.updateSimulationCommand,
    simulationState: simulation.simulationState,
  }

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulationContext(): SimulationContextType {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider')
  }
  return context
}

// Hook to get data that switches between real and simulated
export function useSensorData(realData: {
  currentReading: SensorReading | null
  historicalData: SensorReading[]
  deviceOnline: boolean
  deviceCommands: DeviceCommand | null
}) {
  const simulation = useSimulationContext()

  // Return simulated data when simulation mode is active, otherwise return real data
  return {
    currentReading: simulation.isSimulationMode ? simulation.currentReading : realData.currentReading,
    historicalData: simulation.isSimulationMode ? simulation.simulatedData : realData.historicalData,
    deviceOnline: simulation.isSimulationMode ? simulation.deviceOnline : realData.deviceOnline,
    deviceCommands: simulation.isSimulationMode ? simulation.deviceCommands : realData.deviceCommands,
    isSimulated: simulation.isSimulationMode,
  }
}

// Hook to get alert data that switches between real and simulated
export function useAlertData(realAlerts: AlertEntry[]) {
  const simulation = useSimulationContext()

  // Return simulated alerts when simulation mode is active, otherwise return real alerts
  return {
    alerts: simulation.isSimulationMode ? simulation.simulatedAlerts : realAlerts,
    isSimulated: simulation.isSimulationMode,
  }
}

export default SimulationProvider