'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
//comment

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Air Quality Monitor Dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`border px-4 py-3 rounded ${
              error.includes('No account found') ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              error.includes('already exists') ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-red-50 border-red-200 text-red-600'
            }`}>
              <div className="flex items-start">
                <svg className={`w-5 h-5 mr-2 mt-0.5 ${
                  error.includes('No account found') || error.includes('already exists') ? 'text-yellow-600' : 'text-red-500'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  {error.includes('No account found') || error.includes('already exists') ? (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <div>
                  <p className="font-medium">{error}</p>
                  {error.includes('No account found') && (
                    <p className="text-sm mt-1">Switching to sign up form...</p>
                  )}
                  {error.includes('already exists') && (
                    <p className="text-sm mt-1">Switching to sign in form...</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.email ? 'border-red-300' : 'border-gray-300'
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
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-300'
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
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              {isSignUp && password && password.length >= 6 && (
                <p className="mt-1 text-sm text-green-600">✓ Password meets requirements</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 text-sm"
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
                  className="text-gray-500 hover:text-gray-700 text-sm"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                >
                  Forgot your password?
                </button>
              </div>
            )}
            
            {showPasswordReset && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded text-sm">
                Password reset functionality coming soon. Please contact support for assistance.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}