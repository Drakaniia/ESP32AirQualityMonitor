'use client'

import { useMemo, useState } from 'react'
import { ArrowDownTrayIcon, DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAlertData } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'

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
  isSimulated?: boolean
}

const severities = ['all', 'low', 'medium', 'high', 'critical'] as const

const getSeverityTone = (severity: AlertEntry['severity']) => {
  switch (severity) {
    case 'low':
      return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    case 'medium':
      return 'border-amber-300/30 bg-amber-300/10 text-amber-100'
    case 'high':
      return 'border-orange-300/30 bg-orange-300/10 text-orange-100'
    case 'critical':
      return 'border-red-300/30 bg-red-300/10 text-red-100'
    default:
      return 'border-slate-400/30 bg-slate-400/10 text-slate-200'
  }
}

const getQualityTone = (quality: string) => {
  switch (quality) {
    case 'Excellent':
    case 'Good':
      return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    case 'Moderate':
      return 'border-amber-300/30 bg-amber-300/10 text-amber-100'
    case 'Poor':
      return 'border-orange-300/30 bg-orange-300/10 text-orange-100'
    case 'Very Poor':
    case 'Hazardous':
      return 'border-red-300/30 bg-red-300/10 text-red-100'
    default:
      return 'border-slate-400/30 bg-slate-400/10 text-slate-200'
  }
}

export default function AlertHistory({ data }: AlertHistoryProps) {
  const { alerts, isSimulated } = useAlertData(data.map((reading, index) => {
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
      relay_state: reading.relay_state,
      isSimulated: false,
    }
  }))

  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<typeof severities[number]>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch = searchTerm === ''
        || alert.quality.toLowerCase().includes(searchTerm.toLowerCase())
        || alert.device_id.toLowerCase().includes(searchTerm.toLowerCase())
        || alert.ppm.toString().includes(searchTerm)

      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter

      return matchesSearch && matchesSeverity
    })
  }, [alerts, searchTerm, severityFilter])

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Device ID', 'PPM', 'Quality', 'Severity', 'Relay State']
    const csvContent = [
      headers.join(','),
      ...filteredAlerts.map((alert) => [
        new Date(alert.timestamp).toLocaleString(),
        alert.device_id,
        alert.ppm.toFixed(1),
        alert.quality,
        alert.severity,
        alert.relay_state,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `air-quality-alerts-${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <DocumentTextIcon className="mt-1 h-6 w-6 text-emerald-300" aria-hidden="true" />
          <div>
            <p className="aq-label">History</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Alert history and logs</h2>
          </div>
          {isSimulated && (
            <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Simulated
            </span>
          )}
        </div>

        <button onClick={exportToCSV} className="aq-button-secondary">
          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by quality, device ID, or PPM"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setCurrentPage(1)
            }}
            className="aq-input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {severities.map((severity) => (
            <button
              key={severity}
              onClick={() => {
                setSeverityFilter(severity)
                setCurrentPage(1)
              }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                severityFilter === severity
                  ? 'bg-emerald-400 text-slate-950'
                  : 'border border-white/10 bg-white/[0.045] text-slate-200 hover:bg-white/[0.08]'
              }`}
            >
              {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="aq-subpanel p-3 text-center">
          <div className="font-mono text-2xl font-semibold text-white">{filteredAlerts.length}</div>
          <div className="text-xs font-medium text-slate-400">Total alerts</div>
        </div>
        <div className="aq-subpanel p-3 text-center">
          <div className="font-mono text-2xl font-semibold text-emerald-200">
            {filteredAlerts.filter((alert) => alert.severity === 'low').length}
          </div>
          <div className="text-xs font-medium text-slate-400">Low severity</div>
        </div>
        <div className="aq-subpanel p-3 text-center">
          <div className="font-mono text-2xl font-semibold text-red-200">
            {filteredAlerts.filter((alert) => alert.severity === 'high' || alert.severity === 'critical').length}
          </div>
          <div className="text-xs font-medium text-slate-400">High and critical</div>
        </div>
        <div className="aq-subpanel p-3 text-center">
          <div className="font-mono text-2xl font-semibold text-white">
            {filteredAlerts.length > 0
              ? `${(filteredAlerts.filter((alert) => alert.severity === 'high' || alert.severity === 'critical').length / filteredAlerts.length * 100).toFixed(1)}%`
              : '0%'}
          </div>
          <div className="text-xs font-medium text-slate-400">Critical rate</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {paginatedAlerts.length > 0 ? (
          paginatedAlerts.map((alert) => (
            <div key={alert.id} className="rounded-md border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.08]">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${getSeverityTone(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${getQualityTone(alert.quality)}`}>
                      {alert.quality}
                    </span>
                    {alert.isSimulated && (
                      <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">
                        SIMULATED
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm font-semibold text-white">{alert.ppm.toFixed(1)} PPM</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Device {alert.device_id} / Relay {alert.relay_state}
                  </p>
                </div>
                <div className="font-mono text-sm text-slate-400 lg:text-right">
                  <p>{new Date(alert.timestamp).toLocaleDateString()}</p>
                  <p>{new Date(alert.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-white/[0.15] p-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-white">No alerts found</p>
            <p className="mt-1 text-sm text-slate-400">
              {searchTerm || severityFilter !== 'all' ? 'Try adjusting your filters.' : 'No sensor data is available yet.'}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="aq-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="aq-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
