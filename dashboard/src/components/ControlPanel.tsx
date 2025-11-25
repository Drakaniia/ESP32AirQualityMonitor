'use client'

import { useState } from 'react'

interface DeviceCommand {
  relay_state: string
  sampling_interval: number
  oled_message: string
  last_update: number
}

interface ControlPanelProps {
  currentCommands: DeviceCommand | null
  onCommandUpdate: (commands: Partial<DeviceCommand>) => void
}

export default function ControlPanel({ currentCommands, onCommandUpdate }: ControlPanelProps) {
  const [relayState, setRelayState] = useState(currentCommands?.relay_state || 'OFF')
  const [samplingInterval, setSamplingInterval] = useState(currentCommands?.sampling_interval || 5)
  const [oledMessage, setOledMessage] = useState(currentCommands?.oled_message || '')

  const handleRelayToggle = () => {
    const newState = relayState === 'ON' ? 'OFF' : 'ON'
    setRelayState(newState)
    onCommandUpdate({ relay_state: newState, last_update: Date.now() })
  }

  const handleSamplingIntervalChange = (newInterval: number) => {
    setSamplingInterval(newInterval)
    onCommandUpdate({ sampling_interval: newInterval, last_update: Date.now() })
  }

  const handleOledMessageSend = () => {
    onCommandUpdate({ oled_message: oledMessage, last_update: Date.now() })
    if (oledMessage === 'CLEAR') {
      setOledMessage('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Device Controls</h3>
      
      <div className="space-y-6">
        {/* Relay Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Relay Control
          </label>
          <button
            onClick={handleRelayToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              relayState === 'ON' ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                relayState === 'ON' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm text-gray-600">
            Relay is {relayState === 'ON' ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Sampling Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sampling Interval: {samplingInterval} seconds
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={samplingInterval}
            onChange={(e) => handleSamplingIntervalChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        {/* OLED Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            OLED Message
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={oledMessage}
              onChange={(e) => setOledMessage(e.target.value)}
              placeholder="Enter custom message"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleOledMessageSend}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  setOledMessage('CLEAR')
                  onCommandUpdate({ oled_message: 'CLEAR', last_update: Date.now() })
                }}
                className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Type "CLEAR" to clear the display
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setOledMessage('Air Quality OK')
                onCommandUpdate({ oled_message: 'Air Quality OK', last_update: Date.now() })
              }}
              className="px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200"
            >
              Status OK
            </button>
            <button
              onClick={() => {
                setOledMessage('Warning!')
                onCommandUpdate({ oled_message: 'Warning!', last_update: Date.now() })
              }}
              className="px-3 py-2 bg-yellow-100 text-yellow-800 text-xs font-medium rounded hover:bg-yellow-200"
            >
              Warning
            </button>
            <button
              onClick={() => {
                handleRelayToggle()
              }}
              className="px-3 py-2 bg-blue-100 text-blue-800 text-xs font-medium rounded hover:bg-blue-200"
            >
              Toggle Relay
            </button>
            <button
              onClick={() => {
                handleSamplingIntervalChange(10)
              }}
              className="px-3 py-2 bg-purple-100 text-purple-800 text-xs font-medium rounded hover:bg-purple-200"
            >
              Reset (10s)
            </button>
          </div>
        </div>

        {/* Last Update */}
        {currentCommands && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last command sent: {new Date(currentCommands.last_update).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}