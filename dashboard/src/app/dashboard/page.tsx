'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';
import {
  SimulationProvider,
  useSensorData,
  useSimulationContext,
} from '@/simulation/SimulationProvider';
import AirQualityCard from '@/components/AirQualityCard';
import TemperatureCard from '@/components/TemperatureCard';
import DeviceStatusCard from '@/components/DeviceStatusCard';
import ControlPanel from '@/components/ControlPanel';
import ChartContainer from '@/components/ChartContainer';
import SafetyStatus from '@/components/SafetyStatus';
import AlertHistory from '@/components/AlertHistory';
import SimulationBanner from '@/components/SimulationBanner';
import GlassCard from '@/components/GlassCard';

interface SensorReading {
  device_id: string;
  ppm: number;
  quality: string;
  relay_state: string;
  timestamp: string;
}

interface DeviceCommand {
  relay_state: string;
  buzzer_state?: boolean;
  led_state?: boolean;
  sampling_interval?: number;
  oled_message: string;
  last_update: number;
}

type DashboardTab = 'overview' | 'charts' | 'history';

const dashboardTabs: Array<{
  id: DashboardTab;
  label: string;
  icon: typeof Squares2X2Icon;
}> = [
  { id: 'overview', label: 'Overview', icon: Squares2X2Icon },
  { id: 'charts', label: 'Analytics', icon: ChartBarIcon },
  { id: 'history', label: 'History', icon: ClockIcon },
];

const getQualityDot = (quality: string) => {
  switch (quality) {
    case 'Excellent':
    case 'Good':
      return 'bg-emerald-400';
    case 'Moderate':
      return 'bg-amber-300';
    case 'Poor':
      return 'bg-orange-400';
    case 'Very Poor':
    case 'Hazardous':
      return 'bg-red-400';
    default:
      return 'bg-slate-500';
  }
};

function DashboardContent() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(
    null
  );
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  const [deviceCommands, setDeviceCommands] = useState<DeviceCommand | null>(
    null
  );
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [error, setError] = useState<string | null>(null);

  const {
    currentReading: displayReading,
    historicalData: displayData,
    deviceOnline: displayOnline,
    deviceCommands: displayCommands,
    isSimulated,
  } = useSensorData({
    currentReading,
    historicalData,
    deviceOnline,
    deviceCommands,
  });

  const { startSimulation, isSimulationMode } = useSimulationContext();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, router, loading]);

  const fetchSensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();

      setHistoricalData(data.historicalData || []);
      setCurrentReading(data.currentReading);
      setDeviceOnline(data.deviceOnline);
      setError(null);
    } catch (fetchError) {
      console.error('Error fetching sensor data:', fetchError);
      setError(
        `Failed to fetch sensor data: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      );
    }
  };

  const fetchDeviceCommands = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/device-commands/esp32_01'
      );
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setDeviceCommands(data);
    } catch (fetchError) {
      console.error('Error fetching device commands:', fetchError);
      setError(
        `Failed to fetch device commands: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      );
    }
  };

  useEffect(() => {
    if (!user || isSimulationMode) return;

    const timeoutId = setTimeout(() => {
      if (!currentReading) {
        startSimulation();
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [user, currentReading, isSimulationMode, startSimulation]);

  useEffect(() => {
    if (!user) return;

    fetchSensorData();
    fetchDeviceCommands();

    const sensorDataInterval = setInterval(fetchSensorData, 5000);
    const commandInterval = setInterval(fetchDeviceCommands, 10000);

    return () => {
      clearInterval(sensorDataInterval);
      clearInterval(commandInterval);
    };
  }, [user]);

  if (loading) {
    return (
      <main className="aq-page flex items-center justify-center px-4">
        <GlassCard className="p-8 text-center">
          <div className="loading-spinner mx-auto mb-4 h-10 w-10 border-4 border-emerald-400 border-t-transparent" />
          <p className="font-medium text-white">Loading monitoring console</p>
        </GlassCard>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="aq-page flex items-center justify-center px-4">
        <GlassCard className="max-w-md p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            Sign in required
          </h1>
          <p className="mt-2 text-slate-300">
            Authenticate before opening the air quality dashboard.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="aq-button mt-5 w-full"
          >
            Sign in
          </button>
        </GlassCard>
      </main>
    );
  }

  const stats = (() => {
    if (displayData.length === 0) return { total: 0, avg24h: 0, alerts: 0 };

    const recent24h = displayData.filter(
      (reading) =>
        new Date(reading.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const avg24h =
      recent24h.length > 0
        ? recent24h.reduce((sum, reading) => sum + reading.ppm, 0) /
          recent24h.length
        : 0;
    const alerts = displayData.filter((reading) =>
      ['Poor', 'Very Poor', 'Hazardous'].includes(reading.quality)
    ).length;

    return { total: displayData.length, avg24h, alerts };
  })();

  const updateCommands = (commands: Partial<DeviceCommand>) => {
    setDeviceCommands((previous) => ({
      relay_state: previous?.relay_state ?? commands.relay_state ?? 'ON',
      oled_message: previous?.oled_message ?? commands.oled_message ?? '',
      last_update: Date.now(),
      ...previous,
      ...commands,
    }));
  };

  return (
    <div className="aq-page">
      <SimulationBanner />

      <header
        className="border-b border-white/10 bg-slate-950/[0.65] backdrop-blur-xl"
        style={{ marginTop: isSimulated ? '48px' : '0' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
                <CpuChipIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="aq-label text-emerald-300">Air Quality Monitor</p>
                <h1 className="text-xl font-semibold text-white">
                  Operations Dashboard
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm">
                <SignalIcon
                  className={`h-4 w-4 ${displayOnline ? 'text-emerald-300' : 'text-red-300'}`}
                  aria-hidden="true"
                />
                <span className="text-slate-300">
                  {displayOnline ? 'Device online' : 'Device offline'}
                </span>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-slate-300">
                {user.email}
              </div>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="aq-button-secondary"
              >
                <ArrowLeftOnRectangleIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Logout
              </button>
            </div>
          </div>

          <nav className="mt-4 grid rounded-md border border-white/10 bg-black/20 p-1 sm:inline-grid sm:grid-cols-3">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-5 flex gap-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            <ExclamationTriangleIcon
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <p>{error}</p>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-5">
            <SafetyStatus
              reading={displayReading}
              deviceOnline={displayOnline}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <AirQualityCard reading={displayReading} />
              <TemperatureCard reading={displayReading} />
              <DeviceStatusCard
                online={displayOnline}
                lastUpdate={displayReading?.timestamp}
              />
              <GlassCard className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="aq-label">Quick stats</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Last 24 hours
                    </h2>
                  </div>
                  <ChartBarIcon
                    className="h-6 w-6 text-emerald-300"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-5 space-y-3">
                  <div className="aq-stat-row">
                    <span className="text-sm text-slate-300">
                      Total readings
                    </span>
                    <span className="font-mono text-lg font-semibold text-white">
                      {stats.total}
                    </span>
                  </div>
                  <div className="aq-stat-row">
                    <span className="text-sm text-slate-300">Average PPM</span>
                    <span className="font-mono text-lg font-semibold text-white">
                      {stats.avg24h.toFixed(1)}
                    </span>
                  </div>
                  <div className="aq-stat-row">
                    <span className="text-sm text-slate-300">Alert count</span>
                    <span className="font-mono text-lg font-semibold text-white">
                      {stats.alerts}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
              <ControlPanel
                currentCommands={displayCommands}
                currentPPM={displayReading?.ppm}
                onCommandUpdate={updateCommands}
              />

              <GlassCard className="p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="aq-label">Recent activity</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Sensor event rail
                    </h2>
                  </div>
                  <ClockIcon
                    className="h-6 w-6 text-emerald-300"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {displayData
                    .slice(-6)
                    .reverse()
                    .map((reading, index) => (
                      <div
                        key={`${reading.timestamp}-${index}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] p-3"
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getQualityDot(reading.quality)}`}
                        />
                        <div>
                          <p className="font-mono text-sm font-semibold text-white">
                            {reading.ppm.toFixed(1)} PPM
                          </p>
                          <p className="text-xs text-slate-400">
                            {reading.quality} on {reading.device_id}
                          </p>
                        </div>
                        <p className="font-mono text-xs text-slate-500">
                          {new Date(reading.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}

                  {displayData.length === 0 && (
                    <div className="rounded-md border border-dashed border-white/[0.15] p-8 text-center">
                      <p className="font-medium text-white">
                        No recent activity
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Waiting for sensor readings or simulation data.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-5">
            {displayData.length > 0 ? (
              <ChartContainer data={displayData} />
            ) : (
              <GlassCard className="p-8 text-center">
                <ChartBarIcon
                  className="mx-auto h-12 w-12 text-slate-500"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-xl font-semibold text-white">
                  No sensor data available
                </h2>
                <p className="mt-2 text-slate-400">
                  {displayOnline
                    ? 'Waiting for data from the ESP32 device.'
                    : 'The ESP32 device is offline. Check power and bridge connectivity.'}
                  {isSimulated
                    ? ' Simulation will generate chart data shortly.'
                    : ''}
                </p>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-5">
            <AlertHistory data={displayData} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  );
}
