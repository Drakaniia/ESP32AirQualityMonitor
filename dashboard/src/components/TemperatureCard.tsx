'use client';

import { BeakerIcon } from '@heroicons/react/24/outline';
import { useSensorData } from '@/simulation/SimulationProvider';
import GlassCard from './GlassCard';

interface SensorReading {
  device_id: string;
  ppm: number;
  quality: string;
  relay_state: string;
  temperature?: number;
  humidity?: number;
  timestamp: string;
}

interface TemperatureCardProps {
  reading: SensorReading | null;
}

const getTemperatureTone = (temp: number | undefined) => {
  if (temp === undefined)
    return {
      status: 'NO DATA',
      dot: 'bg-slate-500',
      badge: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
    };
  if (temp < 18)
    return {
      status: 'COLD',
      dot: 'bg-sky-400',
      badge: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
    };
  if (temp <= 28)
    return {
      status: 'COMFORT',
      dot: 'bg-emerald-400',
      badge: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    };
  if (temp <= 32)
    return {
      status: 'WARM',
      dot: 'bg-orange-400',
      badge: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
    };
  return {
    status: 'HOT',
    dot: 'bg-red-400',
    badge: 'border-red-300/30 bg-red-300/10 text-red-100',
  };
};

const calculateHeatIndex = (
  temp: number | undefined,
  humidity: number | undefined
) => {
  if (temp === undefined || humidity === undefined) return undefined;
  if (humidity < 40 || temp < 27) return temp;

  const t = temp;
  const r = humidity;
  const t2 = t * t;
  const r2 = r * r;

  return (
    -8.784695 +
    1.61139411 * t +
    2.338549 * r -
    0.14611605 * t * r -
    0.01230809 * t2 -
    0.01642482 * r2 +
    0.00221173 * t2 * r +
    0.00072546 * t * r2 -
    0.00000358 * t2 * r2
  );
};

export default function TemperatureCard({ reading }: TemperatureCardProps) {
  const { isSimulated } = useSensorData({
    currentReading: reading,
    historicalData: [],
    deviceOnline: false,
    deviceCommands: null,
  });

  if (!reading) {
    return (
      <GlassCard className="p-5">
        <div className="flex h-52 items-center justify-center text-center">
          <div>
            <div className="loading-spinner mx-auto mb-3 h-8 w-8 border-4 border-emerald-400 border-t-transparent" />
            <p className="text-sm text-slate-300">Loading climate data</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const tone = getTemperatureTone(reading.temperature);
  const heatIndex = calculateHeatIndex(reading.temperature, reading.humidity);
  const value =
    reading.temperature !== undefined ? reading.temperature.toFixed(1) : '--';

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="aq-label">Climate channel</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Temperature</h2>
        </div>
        <BeakerIcon className="h-6 w-6 text-emerald-300" aria-hidden="true" />
      </div>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <span className="font-mono text-5xl font-semibold tracking-tight text-white">
            {value}
          </span>
          <span className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            deg C
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            {tone.status}
          </span>
          {isSimulated && (
            <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Simulated
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {reading.humidity !== undefined && (
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Humidity</span>
            <span className="font-mono text-sm font-semibold text-white">
              {reading.humidity.toFixed(1)}%
            </span>
          </div>
        )}
        {heatIndex !== undefined && (
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Heat index</span>
            <span className="font-mono text-sm font-semibold text-white">
              {heatIndex.toFixed(1)} deg C
            </span>
          </div>
        )}
        <div className="aq-stat-row">
          <span className="text-sm text-slate-300">Device ID</span>
          <span className="font-mono text-sm font-semibold text-white">
            {reading.device_id}
          </span>
        </div>
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 font-mono text-xs text-slate-500">
        Last update {new Date(reading.timestamp).toLocaleString()}
      </p>
    </GlassCard>
  );
}
