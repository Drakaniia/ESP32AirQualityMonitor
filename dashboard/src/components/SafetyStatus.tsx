'use client'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface SafetyStatusProps {
  reading: SensorReading | null
  deviceOnline: boolean
}

export default function SafetyStatus({ reading, deviceOnline }: SafetyStatusProps) {
  const getSafetyStatus = () => {
    if (!deviceOnline) {
      return {
        status: 'UNKNOWN',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '⚠️',
        message: 'Device offline - Cannot determine safety status',
        recommendation: 'Check device connection and power supply'
      }
    }

    if (!reading) {
      return {
        status: 'UNKNOWN',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '⚠️',
        message: 'No recent data available',
        recommendation: 'Waiting for sensor readings'
      }
    }

    switch (reading.quality) {
      case 'Excellent':
        return {
          status: 'SAFE',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✅',
          message: 'Air quality is excellent - Safe for all activities',
          recommendation: 'Normal ventilation is sufficient'
        }
      case 'Good':
        return {
          status: 'SAFE',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: '✅',
          message: 'Air quality is good - Safe for normal activities',
          recommendation: 'Maintain normal ventilation'
        }
      case 'Moderate':
        return {
          status: 'CAUTION',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '⚠️',
          message: 'Air quality is moderate - Sensitive individuals should take precautions',
          recommendation: 'Consider increasing ventilation, limit prolonged outdoor activities'
        }
      case 'Poor':
        return {
          status: 'WARNING',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: '⚠️',
          message: 'Air quality is poor - Health effects may be felt by sensitive groups',
          recommendation: 'Increase ventilation, avoid prolonged exposure, consider air purification'
        }
      case 'Very Poor':
        return {
          status: 'UNSAFE',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '🚨',
          message: 'Air quality is very poor - Everyone may experience health effects',
          recommendation: 'Minimize exposure, use air purifiers, avoid outdoor activities'
        }
      case 'Hazardous':
        return {
          status: 'HAZARDOUS',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: '🚨',
          message: 'Air quality is hazardous - Emergency conditions',
          recommendation: 'Stay indoors, seal windows/doors, use air purifiers, seek medical attention if symptoms occur'
        }
      default:
        return {
          status: 'UNKNOWN',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '⚠️',
          message: 'Unable to determine air quality status',
          recommendation: 'Check sensor functionality and calibration'
        }
    }
  }

  const safetyStatus = getSafetyStatus()
  const isDataFresh = reading && (Date.now() - new Date(reading.timestamp).getTime() < 60000) // Fresh if less than 1 minute old

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${safetyStatus.color} transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Overall Safety Status</h3>
        {isDataFresh && deviceOnline && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Main Status Display */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{safetyStatus.icon}</div>
        <div className={`inline-block px-8 py-4 rounded-full text-2xl font-bold border-2 ${safetyStatus.color} transition-all duration-300 hover:scale-105`}>
          {safetyStatus.status}
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-gray-800 mb-2">{safetyStatus.message}</p>
        <p className="text-sm text-gray-600">{safetyStatus.recommendation}</p>
      </div>

      {/* Additional Information */}
      <div className="space-y-3">
        {reading && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Current PPM:</span>
                <span className="ml-2 font-bold text-gray-900">{reading.ppm.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Quality Level:</span>
                <span className="ml-2 font-bold text-gray-900">{reading.quality}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Relay Status:</span>
                <span className={`ml-2 font-bold ${reading.relay_state === 'ON' ? 'text-green-600' : 'text-gray-600'}`}>
                  {reading.relay_state}
                </span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Device Status:</span>
                <span className={`ml-2 font-bold ${deviceOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {deviceOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-center text-xs text-gray-500">
          {reading ? `Last updated: ${new Date(reading.timestamp).toLocaleString()}` : 'No recent data'}
        </div>
      </div>

      {/* Action Buttons */}
      {safetyStatus.status === 'UNSAFE' || safetyStatus.status === 'HAZARDOUS' ? (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">Immediate action recommended</span>
          </div>
        </div>
      ) : safetyStatus.status === 'CAUTION' || safetyStatus.status === 'WARNING' ? (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Monitor closely and take precautions</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">Conditions are normal</span>
          </div>
        </div>
      )}
    </div>
  )
}