'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GlassCard from '@/components/GlassCard'
import GlassButton from '@/components/GlassButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string}>({})
  
  const { login, signup } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const errors: {email?: string, password?: string} = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (isSignUp && password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message)

      // Auto-switch to sign up if user not found
      if (error.message.includes('No account found')) {
        setTimeout(() => setIsSignUp(true), 2000)
      }

      // Auto-switch to sign in if email already exists
      if (error.message.includes('already exists')) {
        setTimeout(() => setIsSignUp(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <GlassCard className="max-w-md w-full space-y-8 rounded-2xl">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100/20">
            <svg className="h-8 w-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-center text-sm text-white/80">
            Air Quality Monitor Dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-300 text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.email ? 'border-red-300' : 'border-white/30 bg-white/10'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) {
                    setFieldErrors({...fieldErrors, email: undefined})
                  }
                }}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-300">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-300 text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.password ? 'border-red-300' : 'border-white/30 bg-white/10'
                }`}
                placeholder={isSignUp ? "Create a password (min. 6 characters)" : "Password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors({...fieldErrors, password: undefined})
                  }
                }}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-300">{fieldErrors.password}</p>
              )}
              {isSignUp && password && password.length >= 6 && (
                <p className="mt-1 text-sm text-green-300">✓ Password meets requirements</p>
              )}
            </div>
          </div>

          <div className="pt-1">
            <GlassButton
              onClick={async (e) => {
                e.preventDefault();

                // Use the shared validation function
                if (!validateForm()) {
                  return;
                }

                // Set loading state
                setLoading(true);
                setError('');

                try {
                  if (isSignUp) {
                    await signup(email, password);
                  } else {
                    await login(email, password);
                  }
                  router.push('/dashboard');
                } catch (error: any) {
                  setError(error.message);

                  // Auto-switch to sign up if user not found
                  if (error.message.includes('No account found')) {
                    setTimeout(() => setIsSignUp(true), 2000);
                  }

                  // Auto-switch to sign in if email already exists
                  if (error.message.includes('already exists')) {
                    setTimeout(() => setIsSignUp(false), 2000);
                  }
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full text-center py-2"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </GlassButton>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              className="text-white/80 hover:text-white text-sm"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setFieldErrors({})
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            {!isSignUp && (
              <div>
                <button
                  type="button"
                  className="text-white/60 hover:text-white text-sm"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {showPasswordReset && (
              <div className="bg-blue-50/20 border border-blue-200/30 text-blue-200 px-3 py-2 rounded text-sm backdrop-blur-sm">
                Password reset functionality coming soon. Please contact support for assistance.
              </div>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  )
}