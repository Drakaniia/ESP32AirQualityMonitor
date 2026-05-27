'use client';

import { CpuChipIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useSensorData } from '@/simulation/SimulationProvider';
import GlassCard from './GlassCard';

interface DeviceStatusCardProps {
  online: boolean;
  lastUpdate?: string;
}

export default function DeviceStatusCard({
  online,
  lastUpdate,
}: DeviceStatusCardProps) {
  const { isSimulated, deviceOnline: simulatedOnline } = useSensorData({
    currentReading: null,
    historicalData: [],
    deviceOnline: online,
    deviceCommands: null,
  });

  const actualOnline = isSimulated ? simulatedOnline : online;

  const getTimeSinceLastUpdate = () => {
    if (!lastUpdate) return 'Never';

    const diffMins = Math.floor(
      (Date.now() - new Date(lastUpdate).getTime()) / 60000
    );
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getConnectionQuality = () => {
    if (!lastUpdate) return { quality: 'Unknown', strength: 0 };

    const diffMins = Math.floor(
      (Date.now() - new Date(lastUpdate).getTime()) / 60000
    );
    if (diffMins < 2) return { quality: 'Excellent', strength: 100 };
    if (diffMins < 5) return { quality: 'Good', strength: 75 };
    if (diffMins < 15) return { quality: 'Fair', strength: 50 };
    if (diffMins < 30) return { quality: 'Poor', strength: 25 };
    return { quality: 'Very Poor', strength: 0 };
  };

  const connectionQuality = getConnectionQuality();
  const statusTone = actualOnline
    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
    : 'border-red-300/30 bg-red-300/10 text-red-100';

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="aq-label">Node health</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Device status
          </h2>
        </div>
        <CpuChipIcon className="h-6 w-6 text-emerald-300" aria-hidden="true" />
      </div>

      <div className="mt-6 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] p-4">
        <div>
          <p className="text-sm text-slate-400">Connection state</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {actualOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusTone}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${actualOnline ? 'bg-emerald-300' : 'bg-red-300'}`}
          />
          {actualOnline ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="aq-stat-row">
          <span className="text-sm text-slate-300">Device ID</span>
          <span className="font-mono text-sm font-semibold text-white">
            {isSimulated ? 'ESP32_SIM_01' : 'ESP32_01'}
          </span>
        </div>
        <div className="aq-stat-row">
          <span className="text-sm text-slate-300">Last update</span>
          <span className="font-mono text-sm font-semibold text-white">
            {getTimeSinceLastUpdate()}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.045] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <WifiIcon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            Signal quality
          </span>
          <span className="text-sm font-semibold text-white">
            {actualOnline ? connectionQuality.quality : 'Unavailable'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              connectionQuality.strength >= 75
                ? 'bg-emerald-400'
                : connectionQuality.strength >= 50
                  ? 'bg-sky-400'
                  : connectionQuality.strength >= 25
                    ? 'bg-amber-300'
                    : 'bg-red-400'
            }`}
            style={{
              width: actualOnline ? `${connectionQuality.strength}%` : '0%',
            }}
          />
        </div>
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 text-sm text-slate-400">
        {actualOnline
          ? 'System active and accepting monitoring updates.'
          : 'Awaiting bridge or device connection.'}
        {isSimulated ? ' Simulation mode is active.' : ''}
      </p>
    </GlassCard>
  );
}
