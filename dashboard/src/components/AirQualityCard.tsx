'use client';

import { FireIcon, SignalIcon } from '@heroicons/react/24/outline';
import { useSensorData } from '@/simulation/SimulationProvider';
import GlassCard from './GlassCard';

interface SensorReading {
  device_id: string;
  ppm: number;
  quality: string;
  relay_state: string;
  timestamp: string;
}

interface AirQualityCardProps {
  reading: SensorReading | null;
}

const getQualityClasses = (quality: string) => {
  switch (quality) {
    case 'Excellent':
    case 'Good':
      return {
        dot: 'bg-emerald-400',
        badge: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        text: 'text-emerald-200',
      };
    case 'Moderate':
      return {
        dot: 'bg-amber-300',
        badge: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        text: 'text-amber-200',
      };
    case 'Poor':
      return {
        dot: 'bg-orange-400',
        badge: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
        text: 'text-orange-200',
      };
    case 'Very Poor':
    case 'Hazardous':
      return {
        dot: 'bg-red-400',
        badge: 'border-red-300/30 bg-red-300/10 text-red-100',
        text: 'text-red-200',
      };
    default:
      return {
        dot: 'bg-slate-500',
        badge: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
        text: 'text-slate-300',
      };
  }
};

const getSafetyStatus = (quality: string) => {
  switch (quality) {
    case 'Excellent':
    case 'Good':
      return 'SAFE';
    case 'Moderate':
      return 'CAUTION';
    case 'Poor':
      return 'WARNING';
    case 'Very Poor':
    case 'Hazardous':
      return 'UNSAFE';
    default:
      return 'UNKNOWN';
  }
};

export default function AirQualityCard({ reading }: AirQualityCardProps) {
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
            <p className="text-sm text-slate-300">Loading sensor data</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const qualityClasses = getQualityClasses(reading.quality);
  const isLive = Date.now() - new Date(reading.timestamp).getTime() < 30000;

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="aq-label">Gas concentration</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Air quality</h2>
        </div>
        <FireIcon className="h-6 w-6 text-emerald-300" aria-hidden="true" />
      </div>

      <div className="mt-6">
        <div className="flex items-end gap-2">
          <span className="font-mono text-5xl font-semibold tracking-tight text-white">
            {reading.ppm.toFixed(1)}
          </span>
          <span className="pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            PPM
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${qualityClasses.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${qualityClasses.dot}`} />
            {reading.quality}
          </span>
          <span className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs font-semibold text-slate-200">
            {getSafetyStatus(reading.quality)}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
              <SignalIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Live
            </span>
          )}
          {isSimulated && (
            <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Simulated
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="aq-stat-row">
          <span className="text-sm text-slate-300">Relay</span>
          <span
            className={`font-mono text-sm font-semibold ${reading.relay_state === 'ON' ? qualityClasses.text : 'text-slate-300'}`}
          >
            {reading.relay_state}
          </span>
        </div>
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
