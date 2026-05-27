'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useSensorData } from '@/simulation/SimulationProvider';
import GlassCard from './GlassCard';

interface SensorReading {
  device_id: string;
  ppm: number;
  quality: string;
  relay_state: string;
  timestamp: string;
}

interface SafetyStatusProps {
  reading: SensorReading | null;
  deviceOnline: boolean;
}

const getStatusConfig = (
  reading: SensorReading | null,
  deviceOnline: boolean
) => {
  if (!deviceOnline) {
    return {
      status: 'UNKNOWN',
      level: 'No device link',
      message: 'Device offline. Safety state cannot be verified.',
      recommendation: 'Check ESP32 power, Wi-Fi, and MQTT bridge connectivity.',
      description: 'No readings are available from the sensor node.',
      score: 0,
      tone: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
      bar: 'bg-slate-500',
      Icon: ShieldExclamationIcon,
    };
  }

  if (!reading) {
    return {
      status: 'UNKNOWN',
      level: 'Waiting for data',
      message: 'No recent data has been received.',
      recommendation:
        'Keep the bridge running while the dashboard waits for the next sensor packet.',
      description:
        'The dashboard is online, but the sensor stream has not produced a current reading.',
      score: 0,
      tone: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
      bar: 'bg-slate-500',
      Icon: ShieldExclamationIcon,
    };
  }

  switch (reading.quality) {
    case 'Excellent':
    case 'Good':
      return {
        status: 'SAFE',
        level: 'Normal conditions',
        message: 'Air quality is within the normal operating band.',
        recommendation: 'Maintain normal ventilation and continue monitoring.',
        description: 'Current PPM is low enough for routine activity.',
        score: 100,
        tone: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
        bar: 'bg-emerald-400',
        Icon: CheckCircleIcon,
      };
    case 'Moderate':
      return {
        status: 'CAUTION',
        level: 'Watch condition',
        message: 'Air quality is moderate.',
        recommendation: 'Increase ventilation and watch for rising PPM.',
        description:
          'Sensitive users may need additional caution if readings continue upward.',
        score: 66,
        tone: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        bar: 'bg-amber-300',
        Icon: ExclamationTriangleIcon,
      };
    case 'Poor':
      return {
        status: 'WARNING',
        level: 'Elevated gas level',
        message: 'Air quality is poor.',
        recommendation:
          'Ventilate the area, inspect the source, and prepare device alerts.',
        description:
          'The reading is high enough to require operator attention.',
        score: 42,
        tone: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
        bar: 'bg-orange-400',
        Icon: ExclamationTriangleIcon,
      };
    case 'Very Poor':
    case 'Hazardous':
      return {
        status: 'UNSAFE',
        level: 'Immediate action',
        message: 'Air quality has reached an unsafe band.',
        recommendation:
          'Reduce exposure, ventilate, and follow local safety procedures.',
        description:
          'The current sensor state may represent a hazardous environment.',
        score: 15,
        tone: 'border-red-300/30 bg-red-300/10 text-red-100',
        bar: 'bg-red-400',
        Icon: ShieldExclamationIcon,
      };
    default:
      return {
        status: 'UNKNOWN',
        level: 'Unclassified reading',
        message: 'Unable to classify the current quality state.',
        recommendation: 'Check sensor calibration and quality mapping.',
        description:
          'The reading does not match a known dashboard quality label.',
        score: 0,
        tone: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
        bar: 'bg-slate-500',
        Icon: ShieldExclamationIcon,
      };
  }
};

export default function SafetyStatus({
  reading,
  deviceOnline,
}: SafetyStatusProps) {
  const { isSimulated } = useSensorData({
    currentReading: reading,
    historicalData: [],
    deviceOnline,
    deviceCommands: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const config = getStatusConfig(reading, deviceOnline);
  const isDataFresh =
    reading && Date.now() - new Date(reading.timestamp).getTime() < 60000;
  const Icon = config.Icon;

  return (
    <GlassCard className="p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="aq-label">Safety status</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Air quality and response
              </h2>
              <p className="mt-2 text-sm text-slate-400">{config.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDataFresh && deviceOnline && (
                <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                  Live data
                </span>
              )}
              {isSimulated && (
                <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
                  Simulated
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-md border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border ${config.tone}`}
              >
                <Icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-semibold text-white">
                    {config.status}
                  </p>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${config.tone}`}
                  >
                    {config.level}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {config.description}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Hazard</span>
                <span>Safe</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${config.bar} transition-all duration-700`}
                  style={{ width: `${config.score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-md border border-white/10 bg-[#071915] p-4">
          <p className="aq-label">Recommended action</p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {config.recommendation}
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-5 flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            aria-expanded={showDetails}
            aria-controls="safety-details"
          >
            Sensor details
            <ChevronDownIcon
              className={`h-4 w-4 transition ${showDetails ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </aside>
      </div>

      {showDetails && (
        <div
          id="safety-details"
          className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Current PPM</span>
            <span className="font-mono text-sm font-semibold text-white">
              {reading ? reading.ppm.toFixed(1) : '--'}
            </span>
          </div>
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Quality</span>
            <span className="font-mono text-sm font-semibold text-white">
              {reading?.quality ?? 'Unknown'}
            </span>
          </div>
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Relay</span>
            <span className="font-mono text-sm font-semibold text-white">
              {reading?.relay_state ?? '--'}
            </span>
          </div>
          <div className="aq-stat-row">
            <span className="text-sm text-slate-300">Device</span>
            <span className="font-mono text-sm font-semibold text-white">
              {deviceOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
