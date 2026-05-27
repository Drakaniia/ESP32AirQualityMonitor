'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  BoltIcon,
  ChartBarIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';

const monitorStats = [
  { label: 'Sensor node', value: 'ESP32_01' },
  { label: 'Gas channel', value: 'MQ-2' },
  { label: 'Poll cadence', value: '5 sec' },
];

const capabilities = [
  {
    title: 'Live PPM watch',
    description:
      'Read combustible gas concentration as the sensor stream updates.',
    icon: SignalIcon,
  },
  {
    title: 'Remote command path',
    description:
      'Adjust relay, buzzer, LED, and OLED messages from the operator surface.',
    icon: BoltIcon,
  },
  {
    title: 'Incident review',
    description:
      'Filter historical readings and export alert logs for follow-up.',
    icon: ChartBarIcon,
  },
];

const traceValues = [18, 24, 22, 31, 27, 44, 38, 36, 49, 43, 58, 52, 46, 41];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <main className="aq-page px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
              <CpuChipIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="aq-label text-emerald-300">ESP32 monitor</p>
              <p className="text-sm font-semibold text-white">
                Combustible Gas Monitor
              </p>
            </div>
          </div>
          <Link href="/login" className="aq-button-secondary">
            Operator access
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
          <div className="max-w-2xl">
            <p className="aq-label text-emerald-300">
              Live environmental control surface
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
              Gas readings, device commands, and alert history in one operator
              view.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Built for a local ESP32 and MQ-2 setup: see current PPM, review
              safety state, and send device commands without leaving the
              dashboard.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="aq-button">
                Open console
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/dashboard" className="aq-button-secondary">
                View dashboard route
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {monitorStats.map((stat) => (
                <div key={stat.label} className="aq-subpanel p-4">
                  <p className="aq-label">{stat.label}</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="aq-panel p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="aq-label">Preflight console</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  System snapshot
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Ready for login
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="rounded-md border border-white/10 bg-[#071915] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="aq-label">PPM trace</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Representative signal path from sensor to dashboard
                    </p>
                  </div>
                  <p className="font-mono text-sm text-emerald-200">58 peak</p>
                </div>
                <div className="mt-6 flex h-56 items-end gap-2">
                  {traceValues.map((value, index) => (
                    <div
                      key={`${value}-${index}`}
                      className="flex flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-emerald-700 to-lime-200 transition-transform duration-200 hover:scale-y-105"
                        style={{ height: `${value + 22}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="aq-subpanel p-4">
                  <ShieldCheckIcon
                    className="h-6 w-6 text-emerald-300"
                    aria-hidden="true"
                  />
                  <p className="mt-3 aq-label">Safety state</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Normal
                  </p>
                </div>
                <div className="aq-subpanel p-4">
                  <SignalIcon
                    className="h-6 w-6 text-emerald-300"
                    aria-hidden="true"
                  />
                  <p className="mt-3 aq-label">Bridge</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    MQTT ready
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {capabilities.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="aq-subpanel p-4">
                    <Icon
                      className="h-5 w-5 text-emerald-300"
                      aria-hidden="true"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
