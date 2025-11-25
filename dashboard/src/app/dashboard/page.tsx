'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import AirQualityCard from '@/components/AirQualityCard'
import DeviceStatusCard from '@/components/DeviceStatusCard'
import ControlPanel from '@/components/ControlPanel'
import ChartContainer from '@/components/ChartContainer'
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

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null)
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([])
  const [deviceCommands, setDeviceCommands] = useState<DeviceCommand | null>(null)
  const [deviceOnline, setDeviceOnline] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return

    // Check if user session is still valid
    const checkAuthStatus = () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        console.log('Email not verified - showing reminder')
      }
    }
    
    checkAuthStatus()
  }, [user])

  

  useEffect(() => {
    if (!user) return

    // Listen for latest sensor readings
    const readingsQuery = query(
      collection(db, 'readings'),
      orderBy('timestamp', 'desc'),
      limit(50)
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
  }, [user])

  

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-2">Sign in to continue</h3>
            <p className="text-sm">Please sign in to access your air quality dashboard</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Air Quality Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.email}</span>
              <button
                onClick={async () => {
                  await logout()
                  router.push('/')
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <AirQualityCard reading={currentReading} />
          <DeviceStatusCard online={deviceOnline} lastUpdate={currentReading?.timestamp} />
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Readings</span>
                <span className="text-sm font-medium">{historicalData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg PPM (24h)</span>
                <span className="text-sm font-medium">
                  {historicalData.length > 0 
                    ? (historicalData.slice(-24).reduce((sum, r) => sum + r.ppm, 0) / Math.min(24, historicalData.length)).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <ChartContainer data={historicalData} />
          </div>

          {/* Control Panel */}
          <div>
            <ControlPanel 
              currentCommands={deviceCommands}
              onCommandUpdate={(commands) => {
                // Update commands in Firebase
                console.log('Updating commands:', commands)
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}