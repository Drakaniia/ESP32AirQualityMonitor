'use client';

import { useEffect, useState } from 'react';
import {
  BellAlertIcon,
  BoltIcon,
  CommandLineIcon,
  LightBulbIcon,
  PlayCircleIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';
import { useSimulationContext } from '@/simulation/SimulationProvider';
import GlassCard from './GlassCard';

interface DeviceCommand {
  relay_state: string;
  buzzer_state?: boolean;
  led_state?: boolean;
  sampling_interval?: number;
  oled_message: string;
  last_update: number;
}

interface ControlPanelProps {
  currentCommands: DeviceCommand | null;
  onCommandUpdate: (commands: Partial<DeviceCommand>) => void;
  currentPPM?: number;
}

type Scenario = 'normal' | 'warning' | 'critical' | 'recovery';

const scenarios: Array<{ id: Scenario; label: string; range: string }> = [
  { id: 'normal', label: 'Normal', range: '10-50 PPM' },
  { id: 'warning', label: 'Warning', range: '200-500 PPM' },
  { id: 'critical', label: 'Critical', range: '1000+ PPM' },
  { id: 'recovery', label: 'Recovery', range: 'falling trend' },
];

export default function ControlPanel({
  currentCommands,
  onCommandUpdate,
  currentPPM,
}: ControlPanelProps) {
  const {
    isSimulationMode,
    startSimulation,
    stopSimulation,
    setSimulationScenario,
    updateSimulationCommand,
  } = useSimulationContext();
  const [relayState, setRelayState] = useState(
    currentCommands?.relay_state || 'ON'
  );
  const [buzzerEnabled, setBuzzerEnabled] = useState(
    currentCommands?.buzzer_state ?? false
  );
  const [ledEnabled, setLedEnabled] = useState(
    currentCommands?.led_state ?? false
  );
  const [oledMessage, setOledMessage] = useState(
    currentCommands?.oled_message || ''
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!currentCommands) return;

    setRelayState(currentCommands.relay_state || 'ON');
    setBuzzerEnabled(currentCommands.buzzer_state ?? false);
    setLedEnabled(currentCommands.led_state ?? false);
    setOledMessage(currentCommands.oled_message || '');
  }, [currentCommands]);

  const sendCommand = async (
    commands: Partial<DeviceCommand> & Record<string, unknown>
  ) => {
    const payload = {
      relay_state: relayState,
      oled_message: oledMessage,
      last_update: Date.now(),
      ...commands,
    };

    if (isSimulationMode) {
      updateSimulationCommand(payload);
      onCommandUpdate(payload);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/send-command/esp32_01', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      onCommandUpdate(payload);
    } catch (error) {
      console.error('Error sending device command:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleRelayToggle = async () => {
    const nextState = relayState === 'ON' ? 'OFF' : 'ON';
    setRelayState(nextState);
    await sendCommand({ relay_state: nextState });
  };

  const handleBuzzerControl = async (enabled: boolean) => {
    setBuzzerEnabled(enabled);
    await sendCommand({ buzzer_state: enabled, buzzer_override: true });
  };

  const handleLedControl = async (enabled: boolean) => {
    setLedEnabled(enabled);
    await sendCommand({ led_state: enabled, led_override: true });
  };

  const handleOledMessageSend = async (message = oledMessage) => {
    await sendCommand({ oled_message: message });
    if (message === 'CLEAR') {
      setOledMessage('');
    }
  };

  const toggleClass = (enabled: boolean) =>
    `relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="aq-label">Command center</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Device controls
          </h2>
        </div>
        <CommandLineIcon
          className="h-6 w-6 text-emerald-300"
          aria-hidden="true"
        />
      </div>

      <div className="mt-5 rounded-md border border-white/10 bg-white/[0.045] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Simulation mode</p>
            <p className="mt-1 text-sm text-slate-400">
              Generate local sensor readings for testing.
            </p>
          </div>
          <button
            onClick={() => {
              if (isSimulationMode) {
                stopSimulation();
              } else {
                startSimulation();
              }
            }}
            className={toggleClass(isSimulationMode)}
            aria-label={
              isSimulationMode
                ? 'Disable simulation mode'
                : 'Enable simulation mode'
            }
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition ${isSimulationMode ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <p
          className={`mt-3 text-xs font-semibold uppercase tracking-[0.18em] ${isSimulationMode ? 'text-emerald-200' : 'text-slate-500'}`}
        >
          {isSimulationMode ? 'Simulation active' : 'Real device mode'}
        </p>
      </div>

      {isSimulationMode && (
        <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-sm font-semibold text-amber-100">
            Simulation scenarios
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSimulationScenario(scenario.id)}
                className="rounded-md border border-amber-200/20 bg-black/20 px-3 py-2 text-left transition hover:bg-amber-200/10"
              >
                <span className="block text-sm font-semibold text-white">
                  {scenario.label}
                </span>
                <span className="text-xs text-amber-100/80">
                  {scenario.range}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-3 text-sm font-semibold text-white">
            Output controls
          </p>
          <div className="space-y-3">
            <div className="aq-stat-row">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <BoltIcon
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                Device power relay
              </span>
              <button
                onClick={handleRelayToggle}
                className={toggleClass(relayState === 'ON')}
                aria-label="Toggle device power relay"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${relayState === 'ON' ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="aq-stat-row">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <BellAlertIcon
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                Buzzer
              </span>
              <button
                onClick={() => handleBuzzerControl(!buzzerEnabled)}
                className={toggleClass(buzzerEnabled)}
                aria-label="Toggle buzzer"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${buzzerEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="aq-stat-row">
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <LightBulbIcon
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                LED
              </span>
              <button
                onClick={() => handleLedControl(!ledEnabled)}
                className={toggleClass(ledEnabled)}
                aria-label="Toggle LED"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition ${ledEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {currentPPM && currentPPM > 1000 && (
          <div className="rounded-md border border-red-300/30 bg-red-300/10 p-4">
            <p className="text-sm font-semibold text-red-100">
              High PPM detected: {currentPPM.toFixed(1)}
            </p>
            <p className="mt-1 text-sm text-red-100/80">
              Silence audible and visual alerts while keeping the relay powered.
            </p>
            <button
              onClick={() => {
                setBuzzerEnabled(false);
                setLedEnabled(false);
                handleBuzzerControl(false);
                handleLedControl(false);
              }}
              className="mt-3 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Silence buzzer and LED
            </button>
          </div>
        )}

        <div>
          <label
            htmlFor="oled-message"
            className="mb-2 block text-sm font-semibold text-white"
          >
            OLED message
          </label>
          <input
            id="oled-message"
            type="text"
            value={oledMessage}
            onChange={(event) => setOledMessage(event.target.value)}
            placeholder="Enter custom display message"
            maxLength={50}
            className="aq-input"
          />
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={() => handleOledMessageSend()}
              disabled={isSending}
              className="aq-button"
            >
              {isSending ? 'Sending' : 'Send message'}
            </button>
            <button
              onClick={() => {
                setOledMessage('CLEAR');
                handleOledMessageSend('CLEAR');
              }}
              className="aq-button-secondary"
            >
              Clear
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Use CLEAR to blank the onboard display.
          </p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-sm font-semibold text-white">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setOledMessage('Air Quality OK');
                handleOledMessageSend('Air Quality OK');
              }}
              className="aq-button-secondary"
            >
              <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
              Status OK
            </button>
            <button
              onClick={() => {
                setOledMessage('Warning');
                handleOledMessageSend('Warning');
              }}
              className="aq-button-secondary"
            >
              <BellAlertIcon className="h-4 w-4" aria-hidden="true" />
              Warning
            </button>
            <button onClick={handleRelayToggle} className="aq-button-secondary">
              <BoltIcon className="h-4 w-4" aria-hidden="true" />
              Relay
            </button>
            <button
              onClick={() => sendCommand({ last_update: Date.now() })}
              className="aq-button-secondary"
            >
              <StopCircleIcon className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {currentCommands && (
          <p className="border-t border-white/10 pt-4 font-mono text-xs text-slate-500">
            Last command{' '}
            {new Date(currentCommands.last_update).toLocaleString()}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
