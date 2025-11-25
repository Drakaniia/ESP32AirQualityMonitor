'use client'

import { useState, useEffect } from 'react'
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
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | 'all'>('24h')
  const [filteredData, setFilteredData] = useState(data)

  useEffect(() => {
    const now = new Date()
    let filtered = [...data]

    switch (timeRange) {
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

  const chartData = {
    labels: filteredData.map(reading => new Date(reading.timestamp)),
    datasets: [
      {
        label: 'PPM Level',
        data: filteredData.map(reading => reading.ppm),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Air Quality Index',
        data: filteredData.map(reading => {
          const qualityMap: { [key: string]: number } = {
            'Excellent': 1,
            'Good': 2,
            'Moderate': 3,
            'Poor': 4,
            'Very Poor': 5,
            'Hazardous': 6,
          }
          return (qualityMap[reading.quality] || 0) * 100 // Scale for visibility
        }),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
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
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Air Quality Monitoring',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.datasetIndex === 0) {
              label += context.parsed.y.toFixed(1) + ' PPM'
            } else {
              const qualityValues = ['Excellent', 'Good', 'Moderate', 'Poor', 'Very Poor', 'Hazardous']
              const qualityIndex = Math.round(context.parsed.y / 100) - 1
              label += qualityValues[qualityIndex] || 'Unknown'
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'PPM',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Air Quality',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: number) {
            const qualityValues = ['Excellent', 'Good', 'Moderate', 'Poor', 'Very Poor', 'Hazardous']
            const index = Math.round(value / 100) - 1
            return qualityValues[index] || ''
          },
        },
      },
    },
  }

  const getStats = () => {
    if (filteredData.length === 0) return { avg: 0, min: 0, max: 0 }
    
    const ppmValues = filteredData.map(r => r.ppm)
    const avg = ppmValues.reduce((a, b) => a + b, 0) / ppmValues.length
    const min = Math.min(...ppmValues)
    const max = Math.max(...ppmValues)
    
    return { avg, min, max }
  }

  const stats = getStats()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-lg font-medium text-gray-900">Air Quality Trends</h3>
        
        <div className="flex space-x-2">
          {(['24h', '7d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.avg.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Average PPM</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.min.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Min PPM</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.max.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Max PPM</div>
        </div>
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
              <p className="mt-2">No data available for selected time range</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Points Count */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Showing {filteredData.length} data points
      </div>
    </div>
  )
}