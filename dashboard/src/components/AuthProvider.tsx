'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'

// Mock auth for static generation
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: async () => { throw new Error('Firebase not initialized') },
  createUserWithEmailAndPassword: async () => { throw new Error('Firebase not initialized') },
  signOut: async () => { throw new Error('Firebase not initialized') },
  onAuthStateChanged: () => () => {}
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Authentication is not available in this environment')
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign in'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Would you like to create an account?'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or reset your password.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.'
      }
      
      throw new Error(errorMessage)
    }
  }

  const signup = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Authentication is not available in this environment')
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign up'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.'
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    if (!auth) {
      return
    }
    
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}