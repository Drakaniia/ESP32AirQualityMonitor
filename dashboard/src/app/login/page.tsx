'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CpuChipIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/AuthProvider';

const telemetryBars = [34, 46, 42, 63, 55, 71, 58, 49, 66, 77, 61, 52];

const accessNotes = [
  {
    label: 'MQ-2 node',
    value: 'ESP32_01',
    detail: 'Telemetry standby',
    icon: CpuChipIcon,
  },
  {
    label: 'Sampling',
    value: '5 sec',
    detail: 'PPM stream cadence',
    icon: SignalIcon,
  },
  {
    label: 'Access',
    value: 'Guarded',
    detail: 'Operator console',
    icon: ShieldCheckIcon,
  },
];

const eventRows = [
  { time: '09:42', label: 'MQTT bridge online', status: 'Normal' },
  { time: '09:38', label: 'Relay command queue idle', status: 'Clear' },
  { time: '09:31', label: 'Calibration profile loaded', status: 'Ready' },
];

const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 4) return { score, label: 'Strong', color: 'bg-emerald-400' };
  if (score >= 2) return { score, label: 'Usable', color: 'bg-amber-300' };
  return { score, label: 'Minimum 6 characters', color: 'bg-slate-500' };
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { login, signup } = useAuth();
  const router = useRouter();
  const passwordStrength = getPasswordStrength(password);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (isSignUp && password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const switchMode = (nextSignUp: boolean) => {
    setIsSignUp(nextSignUp);
    setError('');
    setFieldErrors({});
    setShowPasswordReset(false);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      router.push('/dashboard');
    } catch (authError: unknown) {
      const message =
        authError instanceof Error
          ? authError.message
          : 'Unable to complete authentication';
      setError(message);

      if (message.includes('No account found')) {
        setTimeout(() => switchMode(true), 2000);
      }

      if (message.includes('already exists')) {
        setTimeout(() => switchMode(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = loading
    ? isSignUp
      ? 'Creating account'
      : 'Checking access'
    : isSignUp
      ? 'Create operator account'
      : 'Enter dashboard';

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#06130f]/85 px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.22),transparent_34%),linear-gradient(135deg,rgba(3,7,18,0.76),rgba(6,19,15,0.9)_52%,rgba(2,6,23,0.94))]" />
      <div className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl items-center gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.78fr)]">
        <section
          className="order-2 grid gap-4 lg:order-1"
          aria-label="System access status"
        >
          <div className="rounded-lg border border-white/[0.12] bg-slate-950/[0.55] p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-5">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Combustible gas monitor
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                  Controlled access for live air quality telemetry.
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" />
                Monitoring ready
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {accessNotes.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-white/10 bg-white/[0.045] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {item.label}
                      </p>
                      <Icon
                        className="h-5 w-5 text-emerald-300"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-white">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-lg border border-white/10 bg-[#071915]/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      PPM trace preview
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Last twelve samples before authentication handoff
                    </p>
                  </div>
                  <p className="font-mono text-sm text-emerald-200">77 peak</p>
                </div>

                <div
                  className="mt-6 flex h-36 items-end gap-2"
                  aria-label="Recent PPM sample chart"
                >
                  {telemetryBars.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="flex flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/55 to-lime-200/90 transition-transform duration-200 hover:scale-y-105"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span>Low</span>
                  <span>Sensor channel</span>
                  <span>Alert</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Event rail
                </p>
                <div className="mt-4 space-y-3">
                  {eventRows.map((row) => (
                    <div
                      key={`${row.time}-${row.label}`}
                      className="grid grid-cols-[3.25rem_1fr] gap-3 border-l border-emerald-300/25 pl-3"
                    >
                      <p className="font-mono text-xs text-slate-500">
                        {row.time}
                      </p>
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-200">
                          {row.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="order-1 lg:order-2"
          aria-label={isSignUp ? 'Create account' : 'Sign in'}
        >
          <div className="rounded-lg border border-white/[0.14] bg-slate-50 p-1 shadow-2xl shadow-black/35">
            <div className="rounded-md bg-[#f6f8f4] p-5 text-slate-950 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Operator console
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {isSignUp ? 'Create access' : 'Sign in'}
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-emerald-200">
                  <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-200/70 p-1 text-sm font-semibold">
                <button
                  type="button"
                  aria-pressed={!isSignUp}
                  className={`rounded px-3 py-2 transition ${
                    !isSignUp
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                  onClick={() => switchMode(false)}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  aria-pressed={isSignUp}
                  className={`rounded px-3 py-2 transition ${
                    isSignUp
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                  onClick={() => switchMode(true)}
                >
                  Sign up
                </button>
              </div>

              <form
                className="mt-6 space-y-5"
                onSubmit={handleFormSubmit}
                noValidate
              >
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <EnvelopeIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? 'email-error' : undefined
                      }
                      className={`block w-full rounded-md border bg-white px-10 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 ${
                        fieldErrors.email
                          ? 'border-red-400'
                          : 'border-slate-300'
                      }`}
                      placeholder="operator@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors({ ...fieldErrors, email: undefined });
                        }
                      }}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p
                      id="email-error"
                      className="mt-2 text-sm font-medium text-red-700"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Password
                  </label>
                  <div className="relative mt-2">
                    <KeyIcon
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        isSignUp ? 'new-password' : 'current-password'
                      }
                      required
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={
                        fieldErrors.password
                          ? 'password-error'
                          : isSignUp
                            ? 'password-help'
                            : undefined
                      }
                      className={`block w-full rounded-md border bg-white px-10 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 ${
                        fieldErrors.password
                          ? 'border-red-400'
                          : 'border-slate-300'
                      }`}
                      placeholder={
                        isSignUp
                          ? 'Create a secure password'
                          : 'Enter your password'
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors({
                            ...fieldErrors,
                            password: undefined,
                          });
                        }
                      }}
                    />
                  </div>
                  {fieldErrors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-sm font-medium text-red-700"
                    >
                      {fieldErrors.password}
                    </p>
                  )}

                  {isSignUp && (
                    <div id="password-help" className="mt-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Password requirement</span>
                        <span>{passwordStrength.label}</span>
                      </div>
                      <div
                        className="mt-2 grid grid-cols-5 gap-1"
                        aria-hidden="true"
                      >
                        {[1, 2, 3, 4, 5].map((step) => (
                          <span
                            key={step}
                            className={`h-1.5 rounded-sm ${step <= passwordStrength.score ? passwordStrength.color : 'bg-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div
                    className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                    role="alert"
                  >
                    <ExclamationTriangleIcon
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/25 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {loading ? (
                    <ArrowPathIcon
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRightIcon
                      className="h-5 w-5 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <span>{submitLabel}</span>
                </button>
              </form>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
                <button
                  type="button"
                  className="text-left font-semibold text-emerald-800 transition hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  onClick={() => switchMode(!isSignUp)}
                >
                  {isSignUp
                    ? 'Already cleared for access? Sign in.'
                    : 'Need a new operator account? Sign up.'}
                </button>

                {!isSignUp && (
                  <button
                    type="button"
                    className="text-left font-medium text-slate-500 transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                  >
                    Forgot your password?
                  </button>
                )}

                {showPasswordReset && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    Password reset is not enabled yet. Contact the system owner
                    to restore dashboard access.
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200">
                <CheckCircleIcon
                  className="h-4 w-4 text-emerald-300"
                  aria-hidden="true"
                />
                <span>
                  Session opens directly to the live monitoring dashboard.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
