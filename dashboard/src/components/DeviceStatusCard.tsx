'use client'

interface DeviceStatusCardProps {
  online: boolean
  lastUpdate?: string
}

export default function DeviceStatusCard({ online, lastUpdate }: DeviceStatusCardProps) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Device Status</h3>
        <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'} ${online ? 'animate-pulse' : ''}`}></div>
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {online ? 'Online' : 'Offline'}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Device ID</span>
            <span className="font-medium text-gray-900">ESP32_01</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Update</span>
            <span className="font-medium text-gray-900">{getTimeSinceLastUpdate()}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Connection</span>
            <span className={`font-medium ${online ? 'text-green-600' : 'text-red-600'}`}>
              {online ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <svg className={`w-6 h-6 ${online ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className={`ml-2 text-sm ${online ? 'text-green-600' : 'text-gray-500'}`}>
              {online ? 'System Active' : 'System Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}