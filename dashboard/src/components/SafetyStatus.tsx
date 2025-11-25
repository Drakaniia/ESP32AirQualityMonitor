'use client'

import { useSensorData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'
import { useState, useEffect } from 'react'

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
  const { isSimulated } = useSensorData({
    currentReading: reading,
    historicalData: [],
    deviceOnline,
    deviceCommands: null
  })

  // Status types with detailed configurations
  const getStatusConfig = () => {
    if (!deviceOnline) {
      return {
        status: 'UNKNOWN',
        level: 'unknown',
        color: 'bg-gray-100 text-white border-gray-300',
        bgColor: 'bg-gray-100/20',
        textColor: 'text-white',
        icon: '❓',
        message: 'Device offline - Cannot determine safety status',
        recommendation: 'Check device connection and power supply',
        description: 'No data available from the sensor. Please verify the device is online and transmitting data.',
        statusOrder: 0
      }
    }

    if (!reading) {
      return {
        status: 'UNKNOWN',
        level: 'unknown',
        color: 'bg-gray-100 text-white border-gray-300',
        bgColor: 'bg-gray-100/20',
        textColor: 'text-white',
        icon: '❓',
        message: 'No recent data available',
        recommendation: 'Waiting for sensor readings',
        description: 'The system is waiting for new sensor data to evaluate air quality conditions.',
        statusOrder: 0
      }
    }

    switch (reading.quality) {
      case 'Excellent':
        return {
          status: 'SAFE',
          level: 'safe',
          color: 'bg-green-100 text-white border-green-300',
          bgColor: 'bg-green-100/20',
          textColor: 'text-white',
          icon: '🌿',
          message: 'Air quality is excellent - Safe for all activities',
          recommendation: 'Normal ventilation is sufficient',
          description: 'The air quality is ideal. No health concerns for any population group.',
          statusOrder: 6
        }
      case 'Good':
        return {
          status: 'SAFE',
          level: 'safe',
          color: 'bg-green-100 text-white border-green-300',
          bgColor: 'bg-green-100/20',
          textColor: 'text-white',
          icon: '😊',
          message: 'Air quality is good - Safe for normal activities',
          recommendation: 'Maintain normal ventilation',
          description: 'The air quality is satisfactory. No special attention needed.',
          statusOrder: 5
        }
      case 'Moderate':
        return {
          status: 'CAUTION',
          level: 'caution',
          color: 'bg-yellow-100 text-white border-yellow-300',
          bgColor: 'bg-yellow-100/20',
          textColor: 'text-white',
          icon: '⚠️',
          message: 'Air quality is moderate - Sensitive individuals should take precautions',
          recommendation: 'Consider increasing ventilation, limit prolonged outdoor activities',
          description: 'The air quality is acceptable for general population but may be of concern for sensitive individuals.',
          statusOrder: 4
        }
      case 'Poor':
        return {
          status: 'WARNING',
          level: 'warning',
          color: 'bg-orange-100 text-white border-orange-300',
          bgColor: 'bg-orange-100/20',
          textColor: 'text-white',
          icon: '😷',
          message: 'Air quality is poor - Health effects may be felt by sensitive groups',
          recommendation: 'Increase ventilation, avoid prolonged exposure, consider air purification',
          description: 'The air quality is unsatisfactory and poses health risks for sensitive groups.',
          statusOrder: 3
        }
      case 'Very Poor':
        return {
          status: 'UNSAFE',
          level: 'unsafe',
          color: 'bg-red-500/50 text-white border-red-300',
          bgColor: 'bg-red-500/50',
          textColor: 'text-white',
          icon: '🚨',
          message: 'Air quality is very poor - Everyone may experience health effects',
          recommendation: 'Minimize exposure, use air purifiers, avoid outdoor activities',
          description: 'The air quality is poor and everyone may experience health effects.',
          statusOrder: 2
        }
      case 'Hazardous':
        return {
          status: 'HAZARDOUS',
          level: 'hazardous',
          color: 'bg-purple-500/30 text-white border-purple-300',
          bgColor: 'bg-purple-500/30',
          textColor: 'text-white',
          icon: '☣️',
          message: 'Air quality is hazardous - Emergency conditions',
          recommendation: 'Stay indoors, seal windows/doors, use air purifiers, seek medical attention if symptoms occur',
          description: 'The air quality is hazardous and poses serious health risks to everyone. Avoid any outdoor exposure.',
          statusOrder: 1
        }
      default:
        return {
          status: 'UNKNOWN',
          level: 'unknown',
          color: 'bg-gray-500/30 text-white border-gray-300',
          bgColor: 'bg-gray-500/30',
          textColor: 'text-white',
          icon: '❓',
          message: 'Unable to determine air quality status',
          recommendation: 'Check sensor functionality and calibration',
          description: 'The system could not determine air quality level. Please verify sensor functionality.',
          statusOrder: 0
        }
    }
  }

  const safetyStatus = getStatusConfig()
  const isDataFresh = reading && (Date.now() - new Date(reading.timestamp).getTime() < 60000) // Fresh if less than 1 minute old
  const [showDetails, setShowDetails] = useState(false)

  // Calculate a safety percentage for visualization (0-100%)
  const calculateSafetyPercentage = () => {
    // Map status to a percentage (0% = hazardous, 100% = excellent)
    return (safetyStatus.statusOrder / 6) * 100
  }

  // Get safety status color for the progress bar
  const getProgressBarColor = () => {
    if (safetyStatus.level === 'safe') return 'bg-green-500'
    if (safetyStatus.level === 'caution') return 'bg-yellow-500'
    if (safetyStatus.level === 'warning') return 'bg-orange-500'
    if (safetyStatus.level === 'unsafe' || safetyStatus.level === 'hazardous') return 'bg-red-500'
    return 'bg-gray-500'
  }

  return (
    <GlassCard className="p-6 transition-all duration-500">
      <div role="region" aria-label="Air Quality and Safety Status">
      {/* Header with title and status indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Air Quality & Safety Status</h3>
          <p className="text-sm text-gray-200 mt-1">Real-time monitoring of air quality conditions</p>
        </div>
        <div className="flex items-center space-x-3">
          {isDataFresh && deviceOnline && (
            <div
              className="flex items-center space-x-1.5 bg-green-500/10 px-3 py-1.5 rounded-full"
              role="status"
              aria-label="Live data indicator"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-xs font-medium text-green-200">LIVE</span>
            </div>
          )}
          {isSimulated && (
            <div
              className="flex items-center space-x-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full"
              role="status"
              aria-label="Simulated data indicator"
            >
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-xs font-medium text-white">SIMULATED</span>
            </div>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm border border-white/30"
            aria-expanded={showDetails}
            aria-controls="safety-details"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        </div>
      </div>

      {/* Main Status Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div
              className="text-4xl sm:text-5xl"
              role="img"
              aria-label={`Status icon: ${safetyStatus.status}`}
            >
              {safetyStatus.icon}
            </div>
            <div>
              <div
                className={`text-2xl sm:text-3xl font-bold text-white capitalize`}
                aria-label={`Safety status: ${safetyStatus.status}`}
              >
                {safetyStatus.status}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-200 uppercase">
                {safetyStatus.level} level
              </div>
            </div>
          </div>

          {/* Safety progress bar */}
          <div
            className="hidden md:block w-32 h-3 bg-gray-200/50 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={calculateSafetyPercentage()}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Air quality safety percentage"
          >
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-1000 ease-out`}
              style={{ width: `${calculateSafetyPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Mobile safety progress bar */}
        <div
          className="md:hidden w-full h-2 bg-gray-200/50 rounded-full overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={calculateSafetyPercentage()}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Air quality safety percentage"
        >
          <div
            className={`h-full ${getProgressBarColor()} transition-all duration-1000 ease-out`}
            style={{ width: `${calculateSafetyPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Status Description */}
      <div
        className="mb-6 p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20"
        aria-label="Air quality status description"
      >
        <p className="text-base font-medium text-white mb-2">{safetyStatus.message}</p>
        <p className="text-sm text-gray-200">{safetyStatus.description}</p>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white mb-2">Recommended Actions</h4>
        <div
          className={`${safetyStatus.bgColor} p-4 rounded-xl border border-white/20`}
          aria-label="Recommended actions for current air quality"
        >
          <p className="text-sm text-white">{safetyStatus.recommendation}</p>
        </div>
      </div>

      {/* Additional Information - Visible when showDetails is true */}
      {showDetails && (
        <div
          id="safety-details"
          className="space-y-4 pt-4 border-t border-gray-200/30"
          aria-live="polite"
        >
          <h4 className="text-sm font-semibold text-white">Sensor Data</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reading && (
              <div
                className="p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30"
                role="region"
                aria-label="Sensor readings"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white font-medium">Current PPM:</span>
                    <span className="ml-2 font-bold text-white">{reading.ppm.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Quality Level:</span>
                    <span className="ml-2 font-bold text-white">{reading.quality}</span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Relay Status:</span>
                    <span className={`ml-2 font-bold ${reading.relay_state === 'ON' ? 'text-green-400' : 'text-gray-400'}`}>
                      {reading.relay_state}
                    </span>
                  </div>
                  <div>
                    <span className="text-white font-medium">Device Status:</span>
                    <span className={`ml-2 font-bold ${deviceOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {deviceOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Last Update */}
          <div
            className="text-center text-xs text-white py-2"
            aria-label={`Last data update: ${reading ? new Date(reading.timestamp).toLocaleString() : 'No recent data'}`}
          >
            {reading ? `Last updated: ${new Date(reading.timestamp).toLocaleString()}` : 'No recent data'}
          </div>
        </div>
      )}

      {/* Contextual Action Banner */}
      <div
        className={`mt-4 p-4 rounded-xl border ${safetyStatus.color.replace('border', 'border-')}`}
        role="alert"
        aria-label={`Air quality alert: ${safetyStatus.status}`}
      >
        {safetyStatus.status === 'HAZARDOUS' ? (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-white">Emergency Alert</h4>
              <p className="text-sm text-gray-200 mt-1">Air quality has reached hazardous levels. Take immediate protective actions as recommended above.</p>
            </div>
          </div>
        ) : safetyStatus.status === 'UNSAFE' ? (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-white">Health Alert</h4>
              <p className="text-sm text-gray-200 mt-1">Air quality is poor and may affect health. Follow all safety recommendations.</p>
            </div>
          </div>
        ) : safetyStatus.status === 'WARNING' ? (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-gray-300">Caution Advised</h4>
              <p className="text-sm text-gray-400 mt-1">Air quality is poor. Sensitive individuals should take extra precautions.</p>
            </div>
          </div>
        ) : safetyStatus.status === 'CAUTION' ? (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-white">Monitor Conditions</h4>
              <p className="text-sm text-gray-200 mt-1">Air quality is moderate. Sensitive individuals should monitor conditions.</p>
            </div>
          </div>
        ) : safetyStatus.status === 'SAFE' ? (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-gray-300">Conditions are Normal</h4>
              <p className="text-sm text-gray-400 mt-1">Air quality is good. No special precautions needed.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-bold text-gray-300">Data Unavailable</h4>
              <p className="text-sm text-gray-400 mt-1">System is unable to determine current air quality status.</p>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}