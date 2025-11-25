'use client'

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

  if (!reading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading sensor data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-2 ${getAQIBgColor(reading.quality)}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Air Quality</h3>
        <div className={`w-3 h-3 rounded-full ${getAQIColor(reading.quality)} animate-pulse`}></div>
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {reading.ppm.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">PPM</div>
        </div>
        
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getAQIColor(reading.quality)} text-white`}>
            {reading.quality}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Relay Status</span>
          <span className={`font-medium ${reading.relay_state === 'ON' ? 'text-green-600' : 'text-gray-600'}`}>
            {reading.relay_state}
          </span>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          Last updated: {new Date(reading.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}