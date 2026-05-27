'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import { useSensorData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'

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

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'all'
type Trend = 'rising' | 'falling' | 'stable'

const ranges: Array<{ id: TimeRange; label: string }> = [
  { id: '1h', label: '1 Hour' },
  { id: '6h', label: '6 Hours' },
  { id: '24h', label: '24 Hours' },
  { id: '7d', label: '7 Days' },
  { id: 'all', label: 'All Time' },
]

const trendColor = (trend: Trend) => {
  if (trend === 'rising') return 'text-red-300'
  if (trend === 'falling') return 'text-emerald-300'
  return 'text-slate-300'
}

function StatTile({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="aq-subpanel p-3 text-center">
      <div className={`font-mono text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-400">{label}</div>
    </div>
  )
}

const getTrend = (values: number[], tolerance: number): Trend => {
  const recentValues = values.slice(-10)
  const olderValues = values.slice(-20, -10)
  if (recentValues.length === 0) return 'stable'

  const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
  const olderAvg = olderValues.length > 0
    ? olderValues.reduce((a, b) => a + b, 0) / olderValues.length
    : recentAvg

  if (recentAvg > olderAvg * (1 + tolerance)) return 'rising'
  if (recentAvg < olderAvg * (1 - tolerance)) return 'falling'
  return 'stable'
}

export default function ChartContainer({ data }: ChartContainerProps) {
  const { isSimulated } = useSensorData({
    currentReading: null,
    historicalData: data,
    deviceOnline: false,
    deviceCommands: null,
  })
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [isLive, setIsLive] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  const filteredData = useMemo(() => {
    const now = Date.now()

    switch (timeRange) {
      case '1h':
        return data.filter((reading) => new Date(reading.timestamp).getTime() >= now - 60 * 60 * 1000)
      case '6h':
        return data.filter((reading) => new Date(reading.timestamp).getTime() >= now - 6 * 60 * 60 * 1000)
      case '24h':
        return data.filter((reading) => new Date(reading.timestamp).getTime() >= now - 24 * 60 * 60 * 1000)
      case '7d':
        return data.filter((reading) => new Date(reading.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000)
      case 'all':
      default:
        return data
    }
  }, [data, timeRange])

  useEffect(() => {
    if (isLive && (timeRange === '1h' || timeRange === '6h')) {
      intervalRef.current = setInterval(() => {
        setIsLive((current) => current)
      }, 5000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLive, timeRange])

  const chartData = {
    labels: filteredData.map((reading) => new Date(reading.timestamp)),
    datasets: [
      {
        label: 'Gas/Smoke PPM Level',
        data: filteredData.map((reading) => reading.ppm),
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(52, 211, 153)',
        pointBorderColor: '#ecfdf5',
        pointBorderWidth: 1,
        borderWidth: 3,
        yAxisID: 'y',
      },
      {
        label: 'Temperature (deg C)',
        data: filteredData.map((reading) => reading.temperature ?? null),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.12)',
        tension: 0.35,
        fill: false,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff7ed',
        pointBorderWidth: 1,
        borderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: 'Humidity (%)',
        data: filteredData.map((reading) => reading.humidity ?? null),
        borderColor: 'rgb(56, 189, 248)',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        tension: 0.35,
        fill: false,
        pointRadius: filteredData.length <= 50 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(56, 189, 248)',
        pointBorderColor: '#f0f9ff',
        pointBorderWidth: 1,
        borderWidth: 2,
        yAxisID: 'y1',
      },
      {
        label: 'Quality Thresholds',
        data: filteredData.map((reading) => {
          const qualityMap: Record<string, number> = {
            Excellent: 50,
            Good: 100,
            Moderate: 200,
            Poor: 350,
            'Very Poor': 500,
            Hazardous: 1000,
          }
          return qualityMap[reading.quality] || 0
        }),
        borderColor: 'rgb(248, 113, 113)',
        backgroundColor: 'rgba(248, 113, 113, 0.08)',
        borderDash: [5, 5],
        tension: 0.35,
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
      duration: isLive ? 650 : 950,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 14,
          color: '#cbd5e1',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Real-time air quality monitoring',
        color: '#f8fafc',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.14)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ''
            if (label) label += ': '

            if (context.datasetIndex === 0) {
              const reading = filteredData[context.dataIndex]
              return `${label}${context.parsed.y.toFixed(1)} PPM${reading ? ` (${reading.quality})` : ''}`
            }
            if (context.datasetIndex === 1) return `${label}${context.parsed.y.toFixed(1)} deg C`
            if (context.datasetIndex === 2) return `${label}${context.parsed.y.toFixed(1)}%`
            return `${label}${context.parsed.y.toFixed(0)} PPM threshold`
          },
          afterLabel: (context: any) => {
            const reading = filteredData[context.dataIndex]
            if (!reading) return []

            const additionalInfo = [
              `Device: ${reading.device_id}`,
              `Relay: ${reading.relay_state}`,
              `Time: ${new Date(reading.timestamp).toLocaleString()}`,
            ]
            if (reading.temperature !== undefined) additionalInfo.push(`Temp: ${reading.temperature.toFixed(1)} deg C`)
            if (reading.humidity !== undefined) additionalInfo.push(`Humidity: ${reading.humidity.toFixed(1)}%`)
            return additionalInfo
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
        ticks: {
          color: '#94a3b8',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'PPM level',
          color: '#cbd5e1',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.12)',
        },
        ticks: {
          color: '#94a3b8',
        },
        suggestedMin: 0,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Temp (deg C) / Humidity (%)',
          color: '#cbd5e1',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#94a3b8',
        },
        min: 0,
        max: 100,
      },
    },
  }

  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        ppm: { avg: 0, min: 0, max: 0, trend: 'stable' as Trend },
        temp: { avg: null as number | null, min: null as number | null, max: null as number | null, trend: 'stable' as Trend },
        humidity: { avg: null as number | null, min: null as number | null, max: null as number | null, trend: 'stable' as Trend },
      }
    }

    const ppmValues = filteredData.map((reading) => reading.ppm)
    const tempValues = filteredData.filter((reading) => reading.temperature !== undefined).map((reading) => reading.temperature!)
    const humidityValues = filteredData.filter((reading) => reading.humidity !== undefined).map((reading) => reading.humidity!)

    const buildStats = (values: number[], tolerance: number) => {
      if (values.length === 0) return { avg: null, min: null, max: null, trend: 'stable' as Trend }
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        trend: getTrend(values, tolerance),
      }
    }

    return {
      ppm: {
        avg: ppmValues.reduce((a, b) => a + b, 0) / ppmValues.length,
        min: Math.min(...ppmValues),
        max: Math.max(...ppmValues),
        trend: getTrend(ppmValues, 0.1),
      },
      temp: buildStats(tempValues, 0.01),
      humidity: buildStats(humidityValues, 0.01),
    }
  }, [filteredData])

  const latestReading = filteredData[filteredData.length - 1]

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <ChartBarIcon className="mt-1 h-6 w-6 text-emerald-300" aria-hidden="true" />
          <div>
            <p className="aq-label">Analytics</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Air quality trends</h2>
          </div>
          {isSimulated && (
            <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Simulated
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                timeRange === range.id
                  ? 'bg-emerald-400 text-slate-950 shadow-md'
                  : 'border border-white/10 bg-white/[0.045] text-slate-200 hover:bg-white/[0.08]'
              }`}
            >
              {range.label}
            </button>
          ))}
          {(timeRange === '1h' || timeRange === '6h') && (
            <button
              onClick={() => setIsLive(!isLive)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                isLive ? 'bg-red-500 text-white shadow-md' : 'border border-white/10 bg-white/[0.045] text-slate-200 hover:bg-white/[0.08]'
              }`}
            >
              {isLive ? 'Pause' : 'Live'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Average PPM" value={stats.ppm.avg.toFixed(1)} />
        <StatTile label="Min PPM" value={stats.ppm.min.toFixed(1)} />
        <StatTile label="Max PPM" value={stats.ppm.max.toFixed(1)} />
        <StatTile label="PPM trend" value={stats.ppm.trend} tone={trendColor(stats.ppm.trend)} />
        {latestReading && <StatTile label="Current PPM" value={latestReading.ppm.toFixed(1)} />}
      </div>

      {(stats.temp.avg !== null || stats.humidity.avg !== null) && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stats.temp.avg !== null && <StatTile label="Avg temp" value={`${stats.temp.avg.toFixed(1)} deg C`} />}
          {stats.temp.min !== null && <StatTile label="Min temp" value={`${stats.temp.min.toFixed(1)} deg C`} />}
          {stats.temp.max !== null && <StatTile label="Max temp" value={`${stats.temp.max.toFixed(1)} deg C`} />}
          <StatTile label="Temp trend" value={stats.temp.trend} tone={trendColor(stats.temp.trend)} />
          {latestReading?.temperature !== undefined && <StatTile label="Current temp" value={`${latestReading.temperature.toFixed(1)} deg C`} />}
        </div>
      )}

      {stats.humidity.avg !== null && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Avg humidity" value={`${stats.humidity.avg.toFixed(1)}%`} />
          {stats.humidity.min !== null && <StatTile label="Min humidity" value={`${stats.humidity.min.toFixed(1)}%`} />}
          {stats.humidity.max !== null && <StatTile label="Max humidity" value={`${stats.humidity.max.toFixed(1)}%`} />}
          <StatTile label="Humidity trend" value={stats.humidity.trend} tone={trendColor(stats.humidity.trend)} />
          {latestReading?.humidity !== undefined && <StatTile label="Current humidity" value={`${latestReading.humidity.toFixed(1)}%`} />}
        </div>
      )}

      <div className="chart-container mt-5 rounded-md border border-white/10 bg-[#071915]/80 p-3" style={{ height: '430px' }}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <ChartBarIcon className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
              <p className="mt-3 text-lg font-semibold text-white">No data available</p>
              <p className="mt-1 text-sm text-slate-400">Try selecting a different time range.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col justify-between gap-2 text-sm text-slate-400 sm:flex-row sm:items-center">
        <span>Showing {filteredData.length} data points</span>
        {latestReading && (
          <span>Last updated {new Date(latestReading.timestamp).toLocaleTimeString()}</span>
        )}
      </div>
    </GlassCard>
  )
}
