'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { SimulationProvider, useSensorData, useAlertData } from '@/simulation/SimulationProvider'
import AirQualityCard from '@/components/AirQualityCard'
import DeviceStatusCard from '@/components/DeviceStatusCard'
import ControlPanel from '@/components/ControlPanel'
import ChartContainer from '@/components/ChartContainer'
import SafetyStatus from '@/components/SafetyStatus'
import AlertHistory from '@/components/AlertHistory'
import SimulationBanner from '@/components/SimulationBanner'
import { db, rtdb, auth } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { ref, onValue } from 'firebase/database'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface DeviceCommand {
  relay_state: string
  sampling_interval: number
  oled_message: string
  last_update: number
}

function DashboardContent() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null)
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([])
  const [deviceCommands, setDeviceCommands] = useState<DeviceCommand | null>(null)
  const [deviceOnline, setDeviceOnline] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history'>('overview')

  // Get data that switches between real and simulated
  const {
    currentReading: displayReading,
    historicalData: displayData,
    deviceOnline: displayOnline,
    deviceCommands: displayCommands,
    isSimulated
  } = useSensorData({
    currentReading,
    historicalData,
    deviceOnline,
    deviceCommands
  })

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login')
    }
  }, [user, router, loading])

  useEffect(() => {
    if (!user || !auth || !db || !rtdb) return

    // Check if user session is still valid
    const checkAuthStatus = () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        console.log('Email not verified - showing reminder')
      }
    }
    
    checkAuthStatus()
  }, [user, auth, db, rtdb])

  useEffect(() => {
    if (!user || !db || !rtdb) return

    // Listen for latest sensor readings
    const readingsQuery = query(
      collection(db, 'readings'),
      orderBy('timestamp', 'desc'),
      limit(100) // Increased limit for better history
    )

    const unsubscribeReadings = onSnapshot(readingsQuery, (snapshot) => {
      const readings: SensorReading[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        readings.push({
          device_id: data.device_id,
          ppm: data.ppm,
          quality: data.quality,
          relay_state: data.relay_state,
          timestamp: data.timestamp,
        })
      })
      setHistoricalData(readings.reverse())
      if (readings.length > 0) {
        setCurrentReading(readings[readings.length - 1])
      }
    })

    // Listen for device commands
    const commandsRef = ref(rtdb, 'commands/esp32_01')
    const unsubscribeCommands = onValue(commandsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setDeviceCommands(data)
      }
    })

    // Listen for device status
    const statusRef = ref(rtdb, 'devices/esp32_01')
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setDeviceOnline(data.status === 'online')
      }
    })

    return () => {
      unsubscribeReadings()
      unsubscribeCommands()
      unsubscribeStatus()
    }
  }, [user, db, rtdb])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="loading-spinner w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="bg-white/90 backdrop-blur-sm border border-blue-200 text-blue-800 px-8 py-6 rounded-xl shadow-lg mb-6">
            <h3 className="text-xl font-semibold mb-2">Sign in to continue</h3>
            <p className="text-sm">Please sign in to access your air quality dashboard</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const getQuickStats = () => {
    if (displayData.length === 0) return { total: 0, avg24h: 0, alerts: 0 }
    
    const total = displayData.length
    const recent24h = displayData.filter(r => 
      new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    const avg24h = recent24h.length > 0 
      ? recent24h.reduce((sum, r) => sum + r.ppm, 0) / recent24h.length
      : 0
    const alerts = displayData.filter(r => 
      ['Poor', 'Very Poor', 'Hazardous'].includes(r.quality)
    ).length
    
    return { total, avg24h, alerts }
  }

  const stats = getQuickStats()

  return (
    <div className="min-h-screen bg-transparent">
      {/* Simulation Banner */}
      <SimulationBanner />
      
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b border-gray-200" style={{ marginTop: isSimulated ? '48px' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.293a1 1 0 00-1.414 1.414L14.586 10l-1.293 1.293a1 1 0 101.414 1.414L16 11.414l1.293 1.293a1 1 0 001.414-1.414L17.414 10l1.293-1.293a1 1 0 00-1.414-1.414L16 8.586l-1.293-1.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Air Quality Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">Welcome, {user.email}</span>
              <button
                onClick={async () => {
                  await logout()
                  router.push('/')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'charts', label: 'Analytics', icon: '📈' },
              { id: 'history', label: 'History', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Safety Status - Top Priority */}
            <SafetyStatus reading={displayReading} deviceOnline={displayOnline} />

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AirQualityCard reading={displayReading} />
              <DeviceStatusCard online={displayOnline} lastUpdate={displayReading?.timestamp} />
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700 font-medium">Total Readings</span>
                    <span className="text-lg font-bold text-blue-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Avg PPM (24h)</span>
                    <span className="text-lg font-bold text-green-900">{stats.avg24h.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-red-700 font-medium">Total Alerts</span>
                    <span className="text-lg font-bold text-red-900">{stats.alerts}</span>
                  </div>
                  {!deviceOnline && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-yellow-800 font-medium">ESP32 device is offline</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ControlPanel 
                  currentCommands={displayCommands}
                  onCommandUpdate={(commands) => {
                    console.log('Updating commands:', commands)
                  }}
                />
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {displayData.slice(-5).reverse().map((reading, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          reading.quality === 'Excellent' || reading.quality === 'Good' ? 'bg-green-500' :
                          reading.quality === 'Moderate' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{reading.ppm.toFixed(1)} PPM</div>
                          <div className="text-xs text-gray-500">{reading.quality}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {displayData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {displayData.length > 0 ? (
              <ChartContainer data={displayData} />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sensor data available</h3>
                  <p className="text-gray-500">
                    {displayOnline ? 'Waiting for data from ESP32 device...' : 'ESP32 device is offline. Please check your device connection.'}
                    {isSimulated && ' (Simulation will generate data shortly)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <AlertHistory data={displayData} />
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  )
}