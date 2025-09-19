import { useState, useEffect } from 'react'
import { bookingService } from '../services/bookingService.js'
import { useAuth } from '../context/AuthContext.jsx'

export const useBookings = (status = null) => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBookings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await bookingService.getUserBookings(user.id, status)
      if (error) {
        setError(error.message)
      } else {
        setBookings(data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [user, status])

  const createBooking = async (bookingData) => {
    try {
      const { data, error } = await bookingService.createBooking({
        ...bookingData,
        user_id: user.id
      })
      if (error) {
        return { success: false, error: error.message }
      }
      // Refresh bookings after creating
      await fetchBookings()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const cancelBooking = async (bookingId) => {
    try {
      const { data, error } = await bookingService.cancelBooking(bookingId, user.id)
      if (error) {
        return { success: false, error: error.message }
      }
      // Refresh bookings after cancelling
      await fetchBookings()
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    cancelBooking
  }
}

export const useBooking = (bookingId) => {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBooking = async () => {
    if (!bookingId) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await bookingService.getBookingById(bookingId)
      if (error) {
        setError(error.message)
      } else {
        setBooking(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const updateBookingStatus = async (status, updates = {}) => {
    try {
      const { data, error } = await bookingService.updateBookingStatus(
        bookingId,
        status,
        updates
      )
      if (error) {
        return { success: false, error: error.message }
      }
      setBooking(data)
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
    updateBookingStatus
  }
}

export const useQRCodeValidation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateQRCode = async (qrCode, action = 'entry') => {
    try {
      setLoading(true)
      setError(null)
      const result = await bookingService.validateQRCode(qrCode, action)
      if (!result.valid) {
        setError(result.error)
        return { success: false, error: result.error }
      }
      return { success: true, data: result }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    validateQRCode,
    loading,
    error
  }
}
