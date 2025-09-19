import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user: currentUser, error } = await authService.getCurrentUser()
        
        if (error) {
          setError(error.message)
        } else if (currentUser) {
          setUser(currentUser)
          await fetchUserProfile(currentUser.id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await authService.getUserProfile(userId)
      if (error) {
        console.error('Error fetching profile:', error)
        // Set loading to false even if profile fetch fails
        setLoading(false)
      } else {
        setProfile(data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      // Set loading to false even if there's an exception
      setLoading(false)
    }
  }

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await authService.signUp(email, password, userData)
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await authService.signIn(email, password)
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await authService.signOut()
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      setUser(null)
      setProfile(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      const { data, error } = await authService.updateUserProfile(user.id, updates)
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      setProfile(data)
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const resetPassword = async (email) => {
    try {
      setError(null)
      const { data, error } = await authService.resetPassword(email)
      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const isAdmin = () => {
    return profile?.role === 'admin'
  }

  const isAuthenticated = () => {
    return !!user
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    isAdmin,
    isAuthenticated,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
