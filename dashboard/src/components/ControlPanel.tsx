'use client'

import { useState } from 'react'
import { useSimulationContext } from '@/simulation/SimulationProvider'
import GlassCard from './GlassCard'

interface DeviceCommand {
  relay_state: string
  buzzer_state?: boolean
  led_state?: boolean
  sampling_interval?: number
  oled_message: string
  last_update: number
}

interface ControlPanelProps {
  currentCommands: DeviceCommand | null
  onCommandUpdate: (commands: Partial<DeviceCommand>) => void
  currentPPM?: number
}

export default function ControlPanel({ currentCommands, onCommandUpdate, currentPPM }: ControlPanelProps) {
  const { isSimulationMode, startSimulation, stopSimulation, setSimulationScenario, updateSimulationCommand } = useSimulationContext()
  const [buzzerState, setBuzzerState] = useState(currentCommands?.relay_state || 'ON')
  const [buzzerEnabled, setBuzzerEnabled] = useState(currentCommands?.buzzer_state ?? false) // New state for buzzer - default to false
  const [ledEnabled, setLedEnabled] = useState(currentCommands?.led_state ?? false) // New state for LED - default to false
  const [emergencySilence, setEmergencySilence] = useState(false)
  const [samplingInterval, setSamplingInterval] = useState(currentCommands?.sampling_interval || 5) // Keep for backward compatibility
  const [oledMessage, setOledMessage] = useState(currentCommands?.oled_message || '')

  const handleBuzzerToggle = async () => {
    const newState = buzzerState === 'ON' ? 'OFF' : 'ON'
    setBuzzerState(newState)
    setEmergencySilence(false) // Reset emergency silence when using toggle

    if (isSimulationMode) {
      updateSimulationCommand({ relay_state: newState, last_update: Date.now() })
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            relay_state: newState, // Send the actual relay state (ON/OFF)
            oled_message: oledMessage,
            last_update: Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        onCommandUpdate({ relay_state: newState, last_update: Date.now() });
      } catch (error) {
        console.error('Error sending buzzer command:', error);
      }
    }
  }

  // New function to handle separate buzzer control
  const handleBuzzerControl = async (enabled: boolean) => {
    setBuzzerEnabled(enabled);

    if (isSimulationMode) {
      updateSimulationCommand({ buzzer_state: enabled, last_update: Date.now() })
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buzzer_state: enabled,
            buzzer_override: true,
            relay_state: buzzerState,
            oled_message: oledMessage,
            last_update: Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        onCommandUpdate({ buzzer_state: enabled, last_update: Date.now() });
      } catch (error) {
        console.error('Error sending buzzer control command:', error);
      }
    }
  }

  // New function to handle separate LED control
  const handleLedControl = async (enabled: boolean) => {
    setLedEnabled(enabled);

    if (isSimulationMode) {
      updateSimulationCommand({ led_state: enabled, last_update: Date.now() })
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            led_state: enabled,
            led_override: true,
            relay_state: buzzerState,
            oled_message: oledMessage,
            last_update: Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        onCommandUpdate({ led_state: enabled, last_update: Date.now() });
      } catch (error) {
        console.error('Error sending LED control command:', error);
      }
    }
  }

  // const handleSamplingIntervalChange = async (newInterval: number) => {
  //   setSamplingInterval(newInterval)

  //   if (isSimulationMode) {
  //     updateSimulationCommand({ sampling_interval: newInterval, last_update: Date.now() })
  //   } else {
  //     try {
  //       const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           relay_state: buzzerState,
  //           sampling_interval: newInterval,
  //           oled_message: oledMessage,
  //           last_update: Date.now()
  //         })
  //       });

  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }

  //       onCommandUpdate({ sampling_interval: newInterval, last_update: Date.now() });
  //     } catch (error) {
  //       console.error('Error sending sampling interval command:', error);
  //     }
  //   }
  // }

  const handleOledMessageSend = async () => {
    if (isSimulationMode) {
      updateSimulationCommand({ oled_message: oledMessage, last_update: Date.now() })
    } else {
      try {
        const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            relay_state: buzzerState,
            oled_message: oledMessage,
            last_update: Date.now()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        onCommandUpdate({ oled_message: oledMessage, last_update: Date.now() });
      } catch (error) {
        console.error('Error sending OLED message command:', error);
      }
    }

    if (oledMessage === 'CLEAR') {
      setOledMessage('')
    }
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-medium text-white mb-6">Device Controls</h3>

      {/* Simulation Mode Toggle */}
      <div className="mb-6 p-4 bg-gray-50/50 backdrop-blur-sm rounded-lg border border-white/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Simulation Mode</label>
            <p className="text-xs text-gray-500">Generate fake sensor data for testing</p>
          </div>
          <button
            onClick={() => {
              if (isSimulationMode) {
                stopSimulation()
              } else {
                startSimulation()
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSimulationMode ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSimulationMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className={`text-xs ${isSimulationMode ? 'text-green-600' : 'text-gray-500'}`}>
          {isSimulationMode ? '✅ Simulation Active - Using fake data' : '📡 Real Mode - Using device data'}
        </div>
      </div>

      {/* Simulation Controls */}
      {isSimulationMode && (
        <div className="mb-6 p-4 bg-blue-50/50 backdrop-blur-sm border border-blue-200/30 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-3">Simulation Scenarios</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSimulationScenario('normal')}
              className="px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded hover:bg-green-200 transition-colors"
            >
              Normal (10-50 PPM)
            </button>
            <button
              onClick={() => setSimulationScenario('warning')}
              className="px-3 py-2 bg-yellow-100 text-yellow-800 text-xs font-medium rounded hover:bg-yellow-200 transition-colors"
            >
              Warning (200-500 PPM)
            </button>
            <button
              onClick={() => setSimulationScenario('critical')}
              className="px-3 py-2 bg-red-100 text-red-800 text-xs font-medium rounded hover:bg-red-200 transition-colors"
            >
              Critical (1000+ PPM)
            </button>
            <button
              onClick={() => setSimulationScenario('recovery')}
              className="px-3 py-2 bg-blue-100 text-blue-800 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
            >
              Recovery Mode
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Buzzer Control */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Buzzer & LED Control
          </label>

          {/* Relay Power Control */}
          <div className="flex items-center justify-between mb-3 p-3 bg-gray-50/30 rounded-lg">
            <span className="text-sm text-white">Device Power (Relay)</span>
            <button
              onClick={handleBuzzerToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                buzzerState === 'ON' ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  buzzerState === 'ON' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Individual Buzzer Control */}
          <div className="flex items-center justify-between mb-3 p-3 bg-gray-50/30 rounded-lg">
            <span className="text-sm text-white">Buzzer</span>
            <button
              onClick={() => handleBuzzerControl(!buzzerEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                buzzerEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  buzzerEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Individual LED Control */}
          <div className="flex items-center justify-between p-3 bg-gray-50/30 rounded-lg">
            <span className="text-sm text-white">LED</span>
            <button
              onClick={() => handleLedControl(!ledEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ledEnabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ledEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Emergency Buzzer & LED Off Button - Only show when PPM > 1000 */}
          {currentPPM && currentPPM > 1000 && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-xs text-red-200 mb-2 font-medium">
                🚨 High PPM Detected ({currentPPM.toFixed(1)}) - Buzzer & LED Activated
              </p>
               <button
                 onClick={async () => {
                   setEmergencySilence(true)
                   if (isSimulationMode) {
                     updateSimulationCommand({ relay_state: 'OFF', last_update: Date.now() })
                   } else {
                     try {
                       const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
                         method: 'POST',
                         headers: {
                           'Content-Type': 'application/json',
                         },
                         body: JSON.stringify({
                           buzzer_override: true,
                           buzzer_state: false,
                           relay_state: 'ON', // Keep relay ON for power
                           oled_message: 'Buzzer & LED silenced',
                           last_update: Date.now()
                         })
                       });

                       if (!response.ok) {
                         throw new Error(`HTTP error! status: ${response.status}`);
                       }

                       onCommandUpdate({ relay_state: 'OFF', last_update: Date.now() });
                     } catch (error) {
                       console.error('Error sending emergency buzzer & LED off command:', error);
                     }
                   }
                 }}
                 className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
               >
                 🔇 Turn Off Buzzer & LED
               </button>
              <p className="text-xs text-red-100 mt-2">
                Manually deactivate the buzzer and LED when PPM exceeds 1000
              </p>
            </div>
          )}
        </div>


        {/* OLED Message */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            OLED Message
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={oledMessage}
              onChange={(e) => setOledMessage(e.target.value)}
              placeholder="Enter custom message"
              maxLength={50}
              className="w-full px-3 py-2 border border-white/30 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white/20 backdrop-blur-sm text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleOledMessageSend}
                className="flex-1 px-3 py-2 bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-md hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border border-white/30"
              >
                Send Message
              </button>
              <button
                onClick={async () => {
                  setOledMessage('CLEAR')
                  try {
                    const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        relay_state: buzzerState,
                        oled_message: 'CLEAR',
                        last_update: Date.now()
                      })
                    });

                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    onCommandUpdate({ oled_message: 'CLEAR', last_update: Date.now() });
                  } catch (error) {
                    console.error('Error sending clear command:', error);
                  }
                }}
                className="px-3 py-2 bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-md hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 border border-white/30"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-xs text-white mt-1">
            Type "CLEAR" to clear the display
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200/30">
          <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                setOledMessage('Air Quality OK')
                try {
                  const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      relay_state: buzzerState,
                      oled_message: 'Air Quality OK',
                      last_update: Date.now()
                    })
                  });

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  onCommandUpdate({ oled_message: 'Air Quality OK', last_update: Date.now() });
                } catch (error) {
                  console.error('Error sending status OK command:', error);
                }
              }}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded hover:bg-white/30 border border-white/30"
            >
              Status OK
            </button>
            <button
              onClick={async () => {
                setOledMessage('Warning!')
                try {
                  const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      relay_state: buzzerState,
                      oled_message: 'Warning!',
                      last_update: Date.now()
                    })
                  });

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  onCommandUpdate({ oled_message: 'Warning!', last_update: Date.now() });
                } catch (error) {
                  console.error('Error sending warning command:', error);
                }
              }}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded hover:bg-white/30 border border-white/30"
            >
              Warning
            </button>
            <button
              onClick={() => {
                handleBuzzerToggle()
              }}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded hover:bg-white/30 border border-white/30"
            >
              Toggle Buzzer
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:3001/api/send-command/esp32_01', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      relay_state: buzzerState,
                      oled_message: oledMessage,
                      last_update: Date.now()
                    })
                  });

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  onCommandUpdate({ last_update: Date.now() });
                } catch (error) {
                  console.error('Error sending reset command:', error);
                }
              }}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded hover:bg-white/30 border border-white/30"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Last Update */}
        {currentCommands && (
          <div className="pt-4 border-t border-gray-200/30">
            <p className="text-xs text-white">
              Last command sent: {new Date(currentCommands.last_update).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}