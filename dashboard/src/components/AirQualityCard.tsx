'use client'

import { useSensorData } from '@/simulation/SimulationProvider'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface AirQualityCardProps {
  reading: SensorReading | null
}

export default function AirQualityCard({ reading }: AirQualityCardProps) {
  const { isSimulated } = useSensorData({ 
    currentReading: reading, 
    historicalData: [], 
    deviceOnline: false, 
    deviceCommands: null 
  })

  const getAQIColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'bg-green-500'
      case 'Good':
        return 'bg-blue-500'
      case 'Moderate':
        return 'bg-yellow-500'
      case 'Poor':
        return 'bg-orange-500'
      case 'Very Poor':
        return 'bg-red-500'
      case 'Hazardous':
        return 'bg-purple-600'
      default:
        return 'bg-gray-500'
    }
  }

  const getAQIBgColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'bg-green-50 border-green-200'
      case 'Good':
        return 'bg-blue-50 border-blue-200'
      case 'Moderate':
        return 'bg-yellow-50 border-yellow-200'
      case 'Poor':
        return 'bg-orange-50 border-orange-200'
      case 'Very Poor':
        return 'bg-red-50 border-red-200'
      case 'Hazardous':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
      case 'Good':
        return 'text-green-600 bg-green-100'
      case 'Moderate':
        return 'text-yellow-600 bg-yellow-100'
      case 'Poor':
        return 'text-orange-600 bg-orange-100'
      case 'Very Poor':
      case 'Hazardous':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSafetyStatus = (quality: string) => {
    switch (quality) {
      case 'Excellent':
      case 'Good':
        return { status: 'SAFE', color: 'text-green-600 bg-green-100' }
      case 'Moderate':
        return { status: 'CAUTION', color: 'text-yellow-600 bg-yellow-100' }
      case 'Poor':
        return { status: 'WARNING', color: 'text-orange-600 bg-orange-100' }
      case 'Very Poor':
      case 'Hazardous':
        return { status: 'UNSAFE', color: 'text-red-600 bg-red-100' }
      default:
        return { status: 'UNKNOWN', color: 'text-gray-600 bg-gray-100' }
    }
  }

  if (!reading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-3 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading sensor data...</p>
          </div>
        </div>
      </div>
    )
  }

  const safetyStatus = getSafetyStatus(reading.quality)
  const isLive = Date.now() - new Date(reading.timestamp).getTime() < 30000 // Data is fresh if less than 30 seconds old

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getAQIBgColor(reading.quality)} transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-gray-900">Air Quality</h3>
          <div className="flex items-center space-x-2">
            {isLive && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${getAQIColor(reading.quality)} animate-pulse`}></div>
                <span className="text-xs text-gray-500 font-medium">LIVE</span>
              </div>
            )}
            {isSimulated && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-600 font-medium">SIM</span>
              </div>
            )}
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full ${getAQIColor(reading.quality)} animate-pulse shadow-lg`}></div>
      </div>
      
      {/* Overall Safety Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${safetyStatus.color} transition-all duration-300`}>
          {safetyStatus.status}
        </div>
      </div>
      
      {/* Main Reading Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className="text-4xl font-bold text-gray-900 transition-all duration-300 hover:scale-105">
            {reading.ppm.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 font-medium mt-1">PPM</div>
        </div>
      </div>
      
      {/* Quality Badge */}
      <div className="text-center mb-6">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getAQIColor(reading.quality)} text-white transition-all duration-300 hover:scale-105`}>
          {reading.quality}
        </div>
      </div>
      
      {/* Status Indicators */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 font-medium">Relay Status</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${reading.relay_state === 'ON' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-semibold ${reading.relay_state === 'ON' ? 'text-green-600' : 'text-gray-600'}`}>
              {reading.relay_state}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 font-medium">Device ID</span>
          <span className="text-sm font-medium text-gray-900">{reading.device_id}</span>
        </div>
      </div>
      
      {/* Last Update */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Last updated: {new Date(reading.timestamp).toLocaleString()}
      </div>
    </div>
  )
}