'use client'

import { useState, useMemo } from 'react'

interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface AlertHistoryProps {
  data: SensorReading[]
}

interface AlertEntry {
  id: string
  timestamp: string
  ppm: number
  quality: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  device_id: string
  relay_state: string
}

export default function AlertHistory({ data }: AlertHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Convert sensor readings to alert entries
  const alertEntries: AlertEntry[] = useMemo(() => {
    return data.map((reading, index) => {
      let severity: AlertEntry['severity'] = 'low'
      
      if (reading.quality === 'Hazardous' || reading.quality === 'Very Poor') {
        severity = 'critical'
      } else if (reading.quality === 'Poor') {
        severity = 'high'
      } else if (reading.quality === 'Moderate') {
        severity = 'medium'
      }

      return {
        id: `${reading.timestamp}-${index}`,
        timestamp: reading.timestamp,
        ppm: reading.ppm,
        quality: reading.quality,
        severity,
        device_id: reading.device_id,
        relay_state: reading.relay_state
      }
    }).reverse() // Most recent first
  }, [data])

  // Filter alerts based on search and severity
  const filteredAlerts = useMemo(() => {
    return alertEntries.filter(alert => {
      const matchesSearch = searchTerm === '' || 
        alert.quality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.ppm.toString().includes(searchTerm)
      
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
      
      return matchesSearch && matchesSeverity
    })
  }, [alertEntries, searchTerm, severityFilter])

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getSeverityColor = (severity: AlertEntry['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent': return 'text-green-600 bg-green-100'
      case 'Good': return 'text-blue-600 bg-blue-100'
      case 'Moderate': return 'text-yellow-600 bg-yellow-100'
      case 'Poor': return 'text-orange-600 bg-orange-100'
      case 'Very Poor': return 'text-red-600 bg-red-100'
      case 'Hazardous': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityIcon = (severity: AlertEntry['severity']) => {
    switch (severity) {
      case 'low': return '🟢'
      case 'medium': return '🟡'
      case 'high': return '🟠'
      case 'critical': return '🔴'
      default: return '⚪'
    }
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Device ID', 'PPM', 'Quality', 'Severity', 'Relay State']
    const csvContent = [
      headers.join(','),
      ...filteredAlerts.map(alert => [
        new Date(alert.timestamp).toLocaleString(),
        alert.device_id,
        alert.ppm.toFixed(1),
        alert.quality,
        alert.severity,
        alert.relay_state
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `air-quality-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h3 className="text-xl font-semibold text-gray-900">Alert History & Logs</h3>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by quality, device ID, or PPM..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'medium', 'high', 'critical'] as const).map((severity) => (
            <button
              key={severity}
              onClick={() => {
                setSeverityFilter(severity)
                setCurrentPage(1)
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                severityFilter === severity
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">{filteredAlerts.length}</div>
          <div className="text-xs text-blue-700 font-medium">Total Alerts</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {filteredAlerts.filter(a => a.severity === 'low').length}
          </div>
          <div className="text-xs text-green-700 font-medium">Low Severity</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-900">
            {filteredAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}
          </div>
          <div className="text-xs text-orange-700 font-medium">High/Critical</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">
            {filteredAlerts.length > 0 ? 
              (filteredAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length / filteredAlerts.length * 100).toFixed(1) 
              : 0}%
          </div>
          <div className="text-xs text-purple-700 font-medium">Critical Rate</div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3 mb-6">
        {paginatedAlerts.length > 0 ? (
          paginatedAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getQualityColor(alert.quality)}`}>
                        {alert.quality}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{alert.ppm.toFixed(1)} PPM</span>
                      <span className="mx-2">•</span>
                      <span>Device: {alert.device_id}</span>
                      <span className="mx-2">•</span>
                      <span>Relay: {alert.relay_state}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(alert.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">No alerts found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || severityFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No sensor data available yet'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length} alerts
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}