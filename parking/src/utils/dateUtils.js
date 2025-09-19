import { format, parseISO, differenceInMinutes, addMinutes, isAfter, isBefore } from 'date-fns'

// Format date for display
export const formatDate = (date, formatString = 'PPP') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

// Format time for display
export const formatTime = (date, formatString = 'p') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

// Format date and time for display
export const formatDateTime = (date, formatString = 'PPp') => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

// Calculate duration between two dates in hours
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return Math.max(1, Math.ceil(differenceInMinutes(end, start) / 60))
}

// Calculate parking cost
export const calculateParkingCost = (startDate, endDate, hourlyRate) => {
  const hours = calculateDuration(startDate, endDate)
  return hours * hourlyRate
}

// Check if a time slot is available
export const isTimeSlotAvailable = (startTime, endTime, existingBookings) => {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime
  
  return !existingBookings.some(booking => {
    const bookingStart = parseISO(booking.start_time)
    const bookingEnd = parseISO(booking.end_time)
    
    // Check for any overlap
    return (
      (isAfter(start, bookingStart) && isBefore(start, bookingEnd)) ||
      (isAfter(end, bookingStart) && isBefore(end, bookingEnd)) ||
      (isBefore(start, bookingStart) && isAfter(end, bookingEnd)) ||
      (start.getTime() === bookingStart.getTime())
    )
  })
}

// Get minimum booking time (current time + 15 minutes)
export const getMinimumBookingTime = () => {
  return addMinutes(new Date(), 15)
}

// Get maximum booking time (current time + 30 days)
export const getMaximumBookingTime = () => {
  return addMinutes(new Date(), 30 * 24 * 60)
}

// Round time to next 15-minute interval
export const roundToNext15Minutes = (date) => {
  const roundedMinutes = Math.ceil(date.getMinutes() / 15) * 15
  const roundedDate = new Date(date)
  roundedDate.setMinutes(roundedMinutes, 0, 0)
  
  if (roundedMinutes >= 60) {
    roundedDate.setHours(roundedDate.getHours() + 1)
    roundedDate.setMinutes(0)
  }
  
  return roundedDate
}

// Format duration for display
export const formatDuration = (hours) => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    
    if (minutes === 0) {
      return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`
    } else {
      return `${wholeHours}h ${minutes}m`
    }
  } else {
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`
    } else {
      return `${days}d ${remainingHours}h`
    }
  }
}

// Check if booking time is valid
export const isValidBookingTime = (startTime, endTime) => {
  const now = new Date()
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime
  
  // Start time must be in the future (at least 15 minutes from now)
  if (isBefore(start, addMinutes(now, 15))) {
    return { valid: false, error: 'Start time must be at least 15 minutes from now' }
  }
  
  // End time must be after start time
  if (!isAfter(end, start)) {
    return { valid: false, error: 'End time must be after start time' }
  }
  
  // Minimum booking duration is 1 hour
  if (differenceInMinutes(end, start) < 60) {
    return { valid: false, error: 'Minimum booking duration is 1 hour' }
  }
  
  // Maximum booking duration is 7 days
  if (differenceInMinutes(end, start) > 7 * 24 * 60) {
    return { valid: false, error: 'Maximum booking duration is 7 days' }
  }
  
  return { valid: true }
}
