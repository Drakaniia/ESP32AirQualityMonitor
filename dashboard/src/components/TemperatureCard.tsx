'use client'

import { useSensorData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  temperature?: number // Optional temperature field
  humidity?: number   // Optional humidity field
  timestamp: string
}

interface TemperatureCardProps {
  reading: SensorReading | null
}

export default function TemperatureCard({ reading }: TemperatureCardProps) {
  const { isSimulated } = useSensorData({
    currentReading: reading,
    historicalData: [],
    deviceOnline: false,
    deviceCommands: null
  })

  const getTemperatureColor = (temp: number | undefined) => {
    if (temp === undefined) return 'bg-gray-500'
    if (temp < 18) return 'bg-blue-500' // Cold
    if (temp <= 28) return 'bg-green-500' // Comfortable
    if (temp <= 32) return 'bg-orange-500' // Warm
    return 'bg-red-500' // Hot
  }

  const getTemperatureStatus = (temp: number | undefined) => {
    if (temp === undefined) return { status: 'NO DATA', color: 'text-white bg-gray-500/50' }
    if (temp < 0) return { status: 'FREEZING', color: 'text-white bg-blue-500/50' }
    if (temp < 18) return { status: 'COLD', color: 'text-white bg-blue-500/50' }
    if (temp <= 28) return { status: 'COMFORT', color: 'text-white bg-green-500/50' }
    if (temp <= 32) return { status: 'WARM', color: 'text-white bg-orange-500/50' }
    return { status: 'HOT', color: 'text-white bg-red-500/50' }
  }

  // Calculate heat index if both temperature and humidity are available
  const calculateHeatIndex = (temp: number | undefined, humidity: number | undefined) => {
    if (temp === undefined || humidity === undefined) return undefined
    
    // Simplified heat index calculation
    if (humidity < 40) return temp // Not significant effect
    if (temp < 27) return temp // Heat index not significant below 80°F
    
    // Simplified approximation (in Celsius)
    const t = temp
    const r = humidity
    const t2 = t * t
    const r2 = r * r
    const heatIndex = -8.784695 + 
                      1.61139411 * t + 
                      2.338549 * r - 
                      0.14611605 * t * r - 
                      0.01230809 * t * t - 
                      0.01642482 * r2 + 
                      0.00221173 * t2 * r + 
                      0.00072546 * t * r2 - 
                      0.00000358 * t2 * r2
    
    return heatIndex
  }

  const heatIndex = reading?.temperature !== undefined && reading?.humidity !== undefined 
    ? calculateHeatIndex(reading.temperature, reading.humidity) 
    : undefined

  if (!reading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-3 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-white">Loading sensor data...</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  const tempStatus = getTemperatureStatus(reading.temperature)
  const isLive = Date.now() - new Date(reading.timestamp).getTime() < 30000 // Data is fresh if less than 30 seconds old

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-white">Temperature</h3>
          <div className="flex items-center space-x-2">
            {isLive && (
              <div className="flex items-center space-x-1.5 bg-white/20 px-2 py-1 rounded-full">
                <div className={`w-2 h-2 rounded-full ${getTemperatureColor(reading.temperature)} animate-pulse`}></div>
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            )}
            {isSimulated && (
              <div className="flex items-center space-x-1.5 bg-white/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">SIM</span>
              </div>
            )}
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full ${getTemperatureColor(reading.temperature)} animate-pulse shadow-lg`}></div>
      </div>

      {/* Overall Temperature Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold text-white ${tempStatus.color} transition-all duration-300 backdrop-blur-sm border border-white/30`}>
          {tempStatus.status}
        </div>
      </div>

      {/* Main Temperature Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          {reading.temperature !== undefined ? (
            <>
              <div className="text-4xl font-bold text-white transition-all duration-300 hover:scale-105">
                {reading.temperature.toFixed(1)}°C
              </div>
              <div className="text-sm text-white font-medium mt-1">Temperature</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold text-white transition-all duration-300 hover:scale-105">
                --
              </div>
              <div className="text-sm text-white font-medium mt-1">No Sensor</div>
            </>
          )}
        </div>
      </div>

      {/* Humidity and Heat Index if available */}
      {reading.humidity !== undefined && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{reading.humidity.toFixed(1)}%</div>
              <div className="text-xs text-white">Humidity</div>
            </div>
            {heatIndex !== undefined && (
              <div className="text-center">
                <div className="text-lg font-bold text-white">{heatIndex.toFixed(1)}°C</div>
                <div className="text-xs text-white">Heat Index</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Temperature Status Indicators */}
      <div className="space-y-3">
        {reading.temperature !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
            <span className="text-sm text-white font-medium">Temperature</span>
            <span className="text-sm font-medium text-white">{reading.temperature.toFixed(1)}°C</span>
          </div>
        )}
        
        {reading.humidity !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
            <span className="text-sm text-white font-medium">Humidity</span>
            <span className="text-sm font-medium text-white">{reading.humidity.toFixed(1)}%</span>
          </div>
        )}

        {heatIndex !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
            <span className="text-sm text-white font-medium">Heat Index</span>
            <span className="text-sm font-medium text-white">{heatIndex.toFixed(1)}°C</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
          <span className="text-sm text-white font-medium">Device ID</span>
          <span className="text-sm font-medium text-white">{reading.device_id}</span>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 text-xs text-white text-center">
        Last updated: {new Date(reading.timestamp).toLocaleString()}
      </div>
    </GlassCard>
  )
}