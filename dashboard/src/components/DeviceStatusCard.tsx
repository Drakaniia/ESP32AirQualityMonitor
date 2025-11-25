'use client'

import { useSensorData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'

interface DeviceStatusCardProps {
  online: boolean
  lastUpdate?: string
}

export default function DeviceStatusCard({ online, lastUpdate }: DeviceStatusCardProps) {
  const { isSimulated, deviceOnline: simulatedOnline } = useSensorData({ 
    currentReading: null, 
    historicalData: [], 
    deviceOnline: online, 
    deviceCommands: null 
  })

  const actualOnline = isSimulated ? simulatedOnline : online

  const getTimeSinceLastUpdate = () => {
    if (!lastUpdate) return 'Never'
    
    const now = new Date()
    const last = new Date(lastUpdate)
    const diffMs = now.getTime() - last.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const getConnectionQuality = () => {
    if (!lastUpdate) return { quality: 'Unknown', color: 'text-gray-500', strength: 0 }
    
    const now = new Date()
    const last = new Date(lastUpdate)
    const diffMs = now.getTime() - last.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 2) return { quality: 'Excellent', color: 'text-green-600', strength: 100 }
    if (diffMins < 5) return { quality: 'Good', color: 'text-blue-600', strength: 75 }
    if (diffMins < 15) return { quality: 'Fair', color: 'text-yellow-600', strength: 50 }
    if (diffMins < 30) return { quality: 'Poor', color: 'text-orange-600', strength: 25 }
    return { quality: 'Very Poor', color: 'text-red-600', strength: 0 }
  }

  const connectionQuality = getConnectionQuality()

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Device Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${actualOnline ? 'bg-green-500' : 'bg-red-500'} ${actualOnline ? 'animate-pulse' : ''} shadow-lg`}></div>
          {isSimulated && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Main Status Display */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold text-white transition-all duration-300 bg-white/20 backdrop-blur-sm border border-white/30`}>
          {actualOnline ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Online
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Offline
            </>
          )}
          {isSimulated && (
            <span className="ml-2 text-xs bg-white/20 text-white px-2 py-1 rounded backdrop-blur-sm border border-white/30">SIM</span>
          )}
        </div>
      </div>

      {/* Device Information */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">Device ID</span>
            <span className="text-sm font-bold text-white">{isSimulated ? 'ESP32_SIM_01' : 'ESP32_01'}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">Last Update</span>
            <span className="text-sm font-medium text-white">{getTimeSinceLastUpdate()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">Connection</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${actualOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-semibold ${actualOnline ? 'text-white' : 'text-white'}`}>
                {actualOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Quality Indicator */}
        {actualOnline && (
          <div className="p-4 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">Signal Quality</span>
              <span className={`text-sm font-semibold text-white`}>
                {connectionQuality.quality}
              </span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  connectionQuality.strength >= 75 ? 'bg-green-500' :
                  connectionQuality.strength >= 50 ? 'bg-blue-500' :
                  connectionQuality.strength >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${connectionQuality.strength}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="pt-4 border-t border-gray-200/30">
          <div className="flex items-center justify-center">
            <div className={`p-3 rounded-full ${actualOnline ? 'bg-green-100/50' : 'bg-gray-100/50'}`}>
              <svg className={`w-6 h-6 ${actualOnline ? 'text-green-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="ml-3">
              <div className={`text-sm font-semibold text-white`}>
                {actualOnline ? 'System Active' : 'System Inactive'}
              </div>
              <div className="text-xs text-white">
                {actualOnline ? 'Monitoring正常运行' : 'Awaiting connection'}
                {isSimulated && ' (Simulated)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}