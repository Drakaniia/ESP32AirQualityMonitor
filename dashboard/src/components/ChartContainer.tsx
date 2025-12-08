'use client'

import { useState, useEffect, useRef } from 'react'
import { useSensorData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'
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
  temperature?: number
  humidity?: number
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
        borderColor: 'rgb(96, 165, 250)', // light blue-400
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(96, 165, 250)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        borderWidth: 3,
        yAxisID: 'y',
      },
      {
        label: 'Temperature (°C)',
        data: filteredData.map(reading => reading.temperature !== undefined ? reading.temperature : null),
        borderColor: 'rgb(249, 115, 22)', // orange-500
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(249, 115, 22)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        borderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: 'Humidity (%)',
        data: filteredData.map(reading => reading.humidity !== undefined ? reading.humidity : null),
        borderColor: 'rgb(14, 165, 233)', // sky-500
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(14, 165, 233)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        borderWidth: 2,
        yAxisID: 'y1',
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
        borderColor: 'rgb(248, 113, 113)', // red-400
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2,
        yAxisID: 'y',
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
          color: 'white',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Real-Time Air Quality Monitoring',
        color: 'white',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)', // slate-800 with opacity
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
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
            } else if (context.datasetIndex === 1) {
              label += context.parsed.y.toFixed(1) + '°C'
            } else if (context.datasetIndex === 2) {
              label += context.parsed.y.toFixed(1) + '%'
            } else { // Quality thresholds
              label += context.parsed.y.toFixed(0) + ' PPM Threshold'
            }
            return label
          },
          afterLabel: function(context: any) {
            const reading = filteredData[context.dataIndex]
            if (reading) {
              const additionalInfo = [
                `Device: ${reading.device_id}`,
                `Relay: ${reading.relay_state}`,
                `Time: ${new Date(reading.timestamp).toLocaleString()}`
              ];

              // Add temperature and humidity if available
              if (reading.temperature !== undefined) {
                additionalInfo.push(`Temp: ${reading.temperature.toFixed(1)}°C`);
              }
              if (reading.humidity !== undefined) {
                additionalInfo.push(`Humidity: ${reading.humidity.toFixed(1)}%`);
              }

              return additionalInfo;
            }
            return [];
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
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
        title: {
          display: false,
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'PPM Level',
          color: 'white',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
        suggestedMin: 0,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Temp (°C) / Humidity (%)',
          color: 'white',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
        min: 0,
        max: 100, // For temperature and humidity
      },
    },
  }

  const getStats = () => {
    if (filteredData.length === 0) return {
      ppm: { avg: 0, min: 0, max: 0, trend: 'stable' },
      temp: { avg: null, min: null, max: null, trend: 'stable' },
      humidity: { avg: null, min: null, max: null, trend: 'stable' }
    }

    const ppmValues = filteredData.map(r => r.ppm)
    const tempValues = filteredData.filter(r => r.temperature !== undefined).map(r => r.temperature!)
    const humidityValues = filteredData.filter(r => r.humidity !== undefined).map(r => r.humidity!)

    // PPM stats
    const ppmAvg = ppmValues.reduce((a, b) => a + b, 0) / ppmValues.length
    const ppmMin = Math.min(...ppmValues)
    const ppmMax = Math.max(...ppmValues)

    // PPM trend
    const recentPpmValues = ppmValues.slice(-10)
    const olderPpmValues = ppmValues.slice(-20, -10)
    const recentPpmAvg = recentPpmValues.reduce((a, b) => a + b, 0) / recentPpmValues.length
    const olderPpmAvg = olderPpmValues.length > 0 ? olderPpmValues.reduce((a, b) => a + b, 0) / olderPpmValues.length : recentPpmAvg

    let ppmTrend = 'stable'
    if (recentPpmAvg > olderPpmAvg * 1.1) ppmTrend = 'rising'
    else if (recentPpmAvg < olderPpmAvg * 0.9) ppmTrend = 'falling'

    // Temperature stats
    let tempAvg = null, tempMin = null, tempMax = null, tempTrend = 'stable'
    if (tempValues.length > 0) {
      tempAvg = tempValues.reduce((a, b) => a + b, 0) / tempValues.length
      tempMin = Math.min(...tempValues)
      tempMax = Math.max(...tempValues)

      // Temperature trend
      const recentTempValues = tempValues.slice(-10)
      const olderTempValues = tempValues.slice(-20, -10)
      const recentTempAvg = recentTempValues.length > 0 ? recentTempValues.reduce((a, b) => a + b, 0) / recentTempValues.length : tempAvg!
      const olderTempAvg = olderTempValues.length > 0 ? olderTempValues.reduce((a, b) => a + b, 0) / olderTempValues.length : recentTempAvg

      if (recentTempAvg > olderTempAvg * 1.01) tempTrend = 'rising'
      else if (recentTempAvg < olderTempAvg * 0.99) tempTrend = 'falling'
    }

    // Humidity stats
    let humidityAvg = null, humidityMin = null, humidityMax = null, humidityTrend = 'stable'
    if (humidityValues.length > 0) {
      humidityAvg = humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length
      humidityMin = Math.min(...humidityValues)
      humidityMax = Math.max(...humidityValues)

      // Humidity trend
      const recentHumidityValues = humidityValues.slice(-10)
      const olderHumidityValues = humidityValues.slice(-20, -10)
      const recentHumidityAvg = recentHumidityValues.length > 0 ? recentHumidityValues.reduce((a, b) => a + b, 0) / recentHumidityValues.length : humidityAvg!
      const olderHumidityAvg = olderHumidityValues.length > 0 ? olderHumidityValues.reduce((a, b) => a + b, 0) / olderHumidityValues.length : recentHumidityAvg

      if (recentHumidityAvg > olderHumidityAvg * 1.01) humidityTrend = 'rising'
      else if (recentHumidityAvg < olderHumidityAvg * 0.99) humidityTrend = 'falling'
    }

    return {
      ppm: { avg: ppmAvg, min: ppmMin, max: ppmMax, trend: ppmTrend },
      temp: { avg: tempAvg, min: tempMin, max: tempMax, trend: tempTrend },
      humidity: { avg: humidityAvg, min: humidityMin, max: humidityMax, trend: humidityTrend }
    }
  }

  const stats = getStats()
  const latestReading = filteredData[filteredData.length - 1]

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-white">Air Quality Trends</h3>
          <div className="flex items-center space-x-2">
            {isLive && (timeRange === '1h' || timeRange === '6h') && (
              <div className="flex items-center space-x-1.5 bg-red-500/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            )}
            {isSimulated && (
              <div className="flex items-center space-x-1.5 bg-yellow-500/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">SIM</span>
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
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
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
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              {isLive ? 'Pause' : 'Live'}
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
          <div className="text-2xl font-bold text-white">{stats.ppm.avg.toFixed(1)}</div>
          <div className="text-xs text-white font-medium">Average PPM</div>
        </div>
        <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
          <div className="text-2xl font-bold text-white">{stats.ppm.min.toFixed(1)}</div>
          <div className="text-xs text-white font-medium">Min PPM</div>
        </div>
        <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
          <div className="text-2xl font-bold text-white">{stats.ppm.max.toFixed(1)}</div>
          <div className="text-xs text-white font-medium">Max PPM</div>
        </div>
        <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
          <div className={`text-2xl font-bold ${
            stats.ppm.trend === 'rising' ? 'text-red-400' :
            stats.ppm.trend === 'falling' ? 'text-green-400' : 'text-gray-400'
          }`}>
            {stats.ppm.trend === 'rising' ? '↑' : stats.ppm.trend === 'falling' ? '↓' : '→'}
          </div>
          <div className="text-xs text-white font-medium">PPM Trend</div>
        </div>
        {latestReading && (
          <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
            <div className="text-2xl font-bold text-white">{latestReading.ppm.toFixed(1)}</div>
            <div className="text-xs text-white font-medium">Current PPM</div>
          </div>
        )}
      </div>

      {/* Temperature and Humidity Stats (if available) */}
      {(stats.temp.avg !== null || stats.humidity.avg !== null) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.temp.avg !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.temp.avg.toFixed(1)}°C</div>
              <div className="text-xs text-white font-medium">Avg Temperature</div>
            </div>
          )}
          {stats.temp.min !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.temp.min.toFixed(1)}°C</div>
              <div className="text-xs text-white font-medium">Min Temperature</div>
            </div>
          )}
          {stats.temp.max !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.temp.max.toFixed(1)}°C</div>
              <div className="text-xs text-white font-medium">Max Temperature</div>
            </div>
          )}
          {stats.temp.trend && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className={`text-2xl font-bold ${
                stats.temp.trend === 'rising' ? 'text-red-400' :
                stats.temp.trend === 'falling' ? 'text-green-400' : 'text-gray-400'
              }`}>
                {stats.temp.trend === 'rising' ? '↑' : stats.temp.trend === 'falling' ? '↓' : '→'}
              </div>
              <div className="text-xs text-white font-medium">Temp Trend</div>
            </div>
          )}
          {latestReading && latestReading.temperature !== undefined && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{latestReading.temperature.toFixed(1)}°C</div>
              <div className="text-xs text-white font-medium">Current Temp</div>
            </div>
          )}
        </div>
      )}

      {(stats.humidity.avg !== null) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.humidity.avg !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.humidity.avg.toFixed(1)}%</div>
              <div className="text-xs text-white font-medium">Avg Humidity</div>
            </div>
          )}
          {stats.humidity.min !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.humidity.min.toFixed(1)}%</div>
              <div className="text-xs text-white font-medium">Min Humidity</div>
            </div>
          )}
          {stats.humidity.max !== null && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{stats.humidity.max.toFixed(1)}%</div>
              <div className="text-xs text-white font-medium">Max Humidity</div>
            </div>
          )}
          {stats.humidity.trend && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className={`text-2xl font-bold ${
                stats.humidity.trend === 'rising' ? 'text-red-400' :
                stats.humidity.trend === 'falling' ? 'text-green-400' : 'text-gray-400'
              }`}>
                {stats.humidity.trend === 'rising' ? '↑' : stats.humidity.trend === 'falling' ? '↓' : '→'}
              </div>
              <div className="text-xs text-white font-medium">Humidity Trend</div>
            </div>
          )}
          {latestReading && latestReading.humidity !== undefined && (
            <div className="text-center p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-2xl font-bold text-white">{latestReading.humidity.toFixed(1)}%</div>
              <div className="text-xs text-white font-medium">Current Humidity</div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="chart-container" style={{ height: '400px' }}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-lg font-medium">No data available</p>
              <p className="text-sm text-gray-300">Try selecting a different time range</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Points Count */}
      <div className="mt-4 flex justify-between items-center text-sm text-white">
        <span>Showing {filteredData.length} data points</span>
        {latestReading && (
          <span>Last updated: {new Date(latestReading.timestamp).toLocaleTimeString()}</span>
        )}
      </div>
    </GlassCard>
  )
}