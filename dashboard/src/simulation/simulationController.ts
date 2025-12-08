import { useEffect, useRef, useState } from 'react'
import FakeDataGenerator from './fakeDataGenerator'

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
  buzzer_state?: boolean
  led_state?: boolean
  sampling_interval?: number
  oled_message: string
  last_update: number
}

export class SimulationController {
  private generator: FakeDataGenerator
  private intervalRef: NodeJS.Timeout | null = null
  private listeners: {
    onNewReading?: (reading: SensorReading) => void
    onNewAlert?: (alert: AlertEntry) => void
    onDeviceStatusChange?: (online: boolean) => void
    onCommandUpdate?: (commands: DeviceCommand) => void
  } = {}

  private isRunning: boolean = false
  private updateInterval: number = 1000 // 1 second default
  private simulatedDeviceOnline: boolean = true
  private simulatedCommands: DeviceCommand

  constructor() {
    this.generator = new FakeDataGenerator()
    this.simulatedCommands = {
      relay_state: 'ON',
      buzzer_state: false,
      led_state: false,
      sampling_interval: 5, // Still keep default for backward compatibility
      oled_message: 'Simulation Active',
      last_update: Date.now(),
    }
  }

  setListeners(listeners: {
    onNewReading?: (reading: SensorReading) => void
    onNewAlert?: (alert: AlertEntry) => void
    onDeviceStatusChange?: (online: boolean) => void
    onCommandUpdate?: (commands: DeviceCommand) => void
  }): void {
    this.listeners = { ...this.listeners, ...listeners }
  }

  start(interval: number = 1000): void {
    if (this.isRunning) return

    this.updateInterval = interval
    this.isRunning = true

    this.intervalRef = setInterval(() => {
      if (!this.isRunning) return

      // Generate new reading
      const reading = this.generator.generateReading()
      this.listeners.onNewReading?.(reading)

      // Occasionally generate alerts
      if (Math.random() < 0.3) { // 30% chance per update
        const alert = this.generator.generateAlertEntry()
        if (alert) {
          this.listeners.onNewAlert?.(alert)
        }
      }

      // Simulate device status changes
      if (Math.random() < 0.02) { // 2% chance per update
        this.simulatedDeviceOnline = !this.simulatedDeviceOnline
        this.listeners.onDeviceStatusChange?.(this.simulatedDeviceOnline)
      }

      // Update simulated commands based on current reading
      this.simulatedCommands.relay_state = reading.relay_state
      this.simulatedCommands.last_update = Date.now()
      this.listeners.onCommandUpdate?.(this.simulatedCommands)
    }, this.updateInterval)
  }

  stop(): void {
    this.isRunning = false
    if (this.intervalRef) {
      clearInterval(this.intervalRef)
      this.intervalRef = null
    }
  }

  isSimulationRunning(): boolean {
    return this.isRunning
  }

  setUpdateInterval(interval: number): void {
    this.updateInterval = interval
    if (this.isRunning) {
      this.stop()
      this.start(interval)
    }
  }

  getHistoricalData(count: number = 50): SensorReading[] {
    return this.generator.generateHistoricalData(count)
  }

  getAlertHistory(): AlertEntry[] {
    return this.generator.getAlertHistory()
  }

  clearAlertHistory(): void {
    this.generator.clearAlertHistory()
  }

  setScenario(scenario: 'normal' | 'warning' | 'critical' | 'recovery'): void {
    this.generator.setScenario(scenario)
  }

  getCurrentReading(): SensorReading {
    return this.generator.generateReading()
  }

  getDeviceStatus(): boolean {
    return this.simulatedDeviceOnline
  }

  getCurrentCommands(): DeviceCommand {
    return { ...this.simulatedCommands }
  }

  updateCommand(commands: Partial<DeviceCommand>): void {
    this.simulatedCommands = {
      ...this.simulatedCommands,
      ...commands,
      last_update: Date.now(),
    }
    this.listeners.onCommandUpdate?.(this.simulatedCommands)
  }

  getSimulationState(): {
    isRunning: boolean
    updateInterval: number
    deviceOnline: boolean
    generatorState: {
      ppm: number
      quality: string
      trend: string
      deviceId: string
    }
  } {
    return {
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
      deviceOnline: this.simulatedDeviceOnline,
      generatorState: this.generator.getCurrentState(),
    }
  }

  destroy(): void {
    this.stop()
    this.listeners = {}
  }
}

// React Hook for simulation
export function useSimulation() {
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [simulationController] = useState(() => new SimulationController())
  const [simulatedData, setSimulatedData] = useState<SensorReading[]>([])
  const [simulatedAlerts, setSimulatedAlerts] = useState<AlertEntry[]>([])
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null)
  const [deviceOnline, setDeviceOnline] = useState(true)
  const [deviceCommands, setDeviceCommands] = useState<DeviceCommand | null>(null)

  useEffect(() => {
    // Set up simulation listeners
    simulationController.setListeners({
      onNewReading: (reading) => {
        setCurrentReading(reading)
        setSimulatedData(prev => [...prev.slice(-99), reading]) // Keep last 100 readings
      },
      onNewAlert: (alert) => {
        setSimulatedAlerts(prev => [alert, ...prev.slice(0, 99)]) // Keep last 100 alerts
      },
      onDeviceStatusChange: (online) => {
        setDeviceOnline(online)
      },
      onCommandUpdate: (commands) => {
        setDeviceCommands(commands)
      },
    })

    return () => {
      simulationController.destroy()
    }
  }, [simulationController])

  const startSimulation = (interval: number = 1000) => {
    // Initialize with some historical data
    const historicalData = simulationController.getHistoricalData(30)
    setSimulatedData(historicalData)
    setCurrentReading(historicalData[historicalData.length - 1])
    
    simulationController.start(interval)
    setIsSimulationMode(true)
  }

  const stopSimulation = () => {
    simulationController.stop()
    setIsSimulationMode(false)
    // Clear simulated data
    setSimulatedData([])
    setSimulatedAlerts([])
    setCurrentReading(null)
    setDeviceCommands(null)
  }

  const setSimulationScenario = (scenario: 'normal' | 'warning' | 'critical' | 'recovery') => {
    simulationController.setScenario(scenario)
  }

  const updateSimulationCommand = (commands: Partial<DeviceCommand>) => {
    simulationController.updateCommand(commands)
  }

  return {
    isSimulationMode,
    simulatedData,
    simulatedAlerts,
    currentReading,
    deviceOnline,
    deviceCommands,
    startSimulation,
    stopSimulation,
    setSimulationScenario,
    updateSimulationCommand,
    simulationState: simulationController.getSimulationState(),
  }
}

export default SimulationController