import { useState, useEffect } from 'react'
import { parkingService } from '../services/parkingService.js'

export const useParkingLots = (filters = {}) => {
  const [parkingLots, setParkingLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchParkingLots = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await parkingService.getParkingLots(filters)
      if (error) {
        setError(error.message)
      } else {
        setParkingLots(data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParkingLots()
  }, [JSON.stringify(filters)])

  return {
    parkingLots,
    loading,
    error,
    refetch: fetchParkingLots
  }
}

export const useParkingLot = (id) => {
  const [parkingLot, setParkingLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchParkingLot = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await parkingService.getParkingLotById(id)
      if (error) {
        setError(error.message)
      } else {
        setParkingLot(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParkingLot()
  }, [id])

  return {
    parkingLot,
    loading,
    error,
    refetch: fetchParkingLot
  }
}

export const useAvailableSlots = (parkingLotId, vehicleType, startTime, endTime) => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAvailableSlots = async () => {
    if (!parkingLotId || !vehicleType || !startTime || !endTime) {
      setSlots([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await parkingService.getAvailableSlots(
        parkingLotId, 
        vehicleType, 
        startTime, 
        endTime
      )
      if (error) {
        setError(error.message)
      } else {
        setSlots(data || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableSlots()
  }, [parkingLotId, vehicleType, startTime, endTime])

  return {
    slots,
    loading,
    error,
    refetch: fetchAvailableSlots
  }
}
