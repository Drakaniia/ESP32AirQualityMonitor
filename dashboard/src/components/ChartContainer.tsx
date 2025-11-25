'use client'

import { useState, useEffect, useRef } from 'react'
import { useSensorData } from '@/simulation/SimulationProvider'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface ChartContainerProps {
  data: SensorReading[]
}

export default function ChartContainer({ data }: ChartContainerProps) {
  const { isSimulated } = useSensorData({ 
    currentReading: null, 
    historicalData: data, 
    deviceOnline: false, 
    deviceCommands: null 
  })
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | 'all'>('24h')
  const [filteredData, setFilteredData] = useState(data)
  const [isLive, setIsLive] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const now = new Date()
    let filtered = [...data]

    switch (timeRange) {
      case '1h':
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        filtered = data.filter(reading => new Date(reading.timestamp) >= oneHourAgo)
        break
      case '6h':
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        filtered = data.filter(reading => new Date(reading.timestamp) >= sixHoursAgo)
        break
      case '24h':
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        filtered = data.filter(reading => new Date(reading.timestamp) >= twentyFourHoursAgo)
        break
      case '7d':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = data.filter(reading => new Date(reading.timestamp) >= sevenDaysAgo)
        break
      case 'all':
      default:
        filtered = data
        break
    }

    setFilteredData(filtered)
  }, [data, timeRange])

  // Auto-refresh for live data
  useEffect(() => {
    if (isLive && (timeRange === '1h' || timeRange === '6h')) {
      intervalRef.current = setInterval(() => {
        // Trigger a refresh by updating the filtered data
        setFilteredData(prev => [...prev])
      }, 5000) // Refresh every 5 seconds for live data
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLive, timeRange])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'rgb(34, 197, 94)'
      case 'Good': return 'rgb(59, 130, 246)'
      case 'Moderate': return 'rgb(250, 204, 21)'
      case 'Poor': return 'rgb(251, 146, 60)'
      case 'Very Poor': return 'rgb(239, 68, 68)'
      case 'Hazardous': return 'rgb(147, 51, 234)'
      default: return 'rgb(156, 163, 175)'
    }
  }

  const chartData = {
    labels: filteredData.map(reading => new Date(reading.timestamp)),
    datasets: [
      {
        label: 'Gas/Smoke PPM Level',
        data: filteredData.map(reading => reading.ppm),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Quality Thresholds',
        data: filteredData.map(reading => {
          const qualityMap: { [key: string]: number } = {
            'Excellent': 50,
            'Good': 100,
            'Moderate': 200,
            'Poor': 350,
            'Very Poor': 500,
            'Hazardous': 1000,
          }
          return qualityMap[reading.quality] || 0
        }),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: isLive ? 750 : 1000,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Real-Time Air Quality Monitoring',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.datasetIndex === 0) {
              label += context.parsed.y.toFixed(1) + ' PPM'
              const reading = filteredData[context.dataIndex]
              if (reading) {
                label += ` (${reading.quality})`
              }
            } else {
              label += context.parsed.y.toFixed(0) + ' PPM Threshold'
            }
            return label
          },
          afterLabel: function(context: any) {
            if (context.datasetIndex === 0 && filteredData[context.dataIndex]) {
              const reading = filteredData[context.dataIndex]
              return [
                `Device: ${reading.device_id}`,
                `Relay: ${reading.relay_state}`,
                `Time: ${new Date(reading.timestamp).toLocaleString()}`
              ]
            }
            return []
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'PPM Level',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        suggestedMin: 0,
      },
    },
  }

  const getStats = () => {
    if (filteredData.length === 0) return { avg: 0, min: 0, max: 0, trend: 'stable' }
    
    const ppmValues = filteredData.map(r => r.ppm)
    const avg = ppmValues.reduce((a, b) => a + b, 0) / ppmValues.length
    const min = Math.min(...ppmValues)
    const max = Math.max(...ppmValues)
    
    // Calculate trend
    const recentValues = ppmValues.slice(-10)
    const olderValues = ppmValues.slice(-20, -10)
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
    const olderAvg = olderValues.length > 0 ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length : recentAvg
    
    let trend = 'stable'
    if (recentAvg > olderAvg * 1.1) trend = 'rising'
    else if (recentAvg < olderAvg * 0.9) trend = 'falling'
    
    return { avg, min, max, trend }
  }

  const stats = getStats()
  const latestReading = filteredData[filteredData.length - 1]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-gray-900">Air Quality Trends</h3>
          <div className="flex items-center space-x-2">
            {isLive && (timeRange === '1h' || timeRange === '6h') && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">LIVE</span>
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
        
        <div className="flex flex-wrap items-center gap-2">
          {(['1h', '6h', '24h', '7d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '1h' ? '1 Hour' : 
               range === '6h' ? '6 Hours' : 
               range === '24h' ? '24 Hours' : 
               range === '7d' ? '7 Days' : 'All Time'}
            </button>
          ))}
          {(timeRange === '1h' || timeRange === '6h') && (
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                isLive
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isLive ? 'Pause' : 'Live'}
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{stats.avg.toFixed(1)}</div>
          <div className="text-xs text-blue-700 font-medium">Average PPM</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">{stats.min.toFixed(1)}</div>
          <div className="text-xs text-green-700 font-medium">Min PPM</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-900">{stats.max.toFixed(1)}</div>
          <div className="text-xs text-red-700 font-medium">Max PPM</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className={`text-2xl font-bold ${
            stats.trend === 'rising' ? 'text-red-900' : 
            stats.trend === 'falling' ? 'text-green-900' : 'text-gray-900'
          }`}>
            {stats.trend === 'rising' ? '↑' : stats.trend === 'falling' ? '↓' : '→'}
          </div>
          <div className="text-xs text-purple-700 font-medium">Trend</div>
        </div>
        {latestReading && (
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-900">{latestReading.ppm.toFixed(1)}</div>
            <div className="text-xs text-orange-700 font-medium">Current PPM</div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="chart-container" style={{ height: '400px' }}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-lg font-medium">No data available</p>
              <p className="text-sm text-gray-400">Try selecting a different time range</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Points Count */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Showing {filteredData.length} data points</span>
        {latestReading && (
          <span>Last updated: {new Date(latestReading.timestamp).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}