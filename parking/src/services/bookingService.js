import { supabase } from '../config/supabase'
import { generateQRCode } from '../utils/qrCodeUtils.jsx'

export const bookingService = {
  // Create a new booking
  async createBooking(bookingData) {
    try {
      // Generate QR code for the booking
      const qrCode = await generateQRCode(bookingData)
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          qr_code: qrCode,
          status: 'confirmed'
        })
        .select(`
          *,
          parking_lot:parking_lots(*),
          parking_slot:parking_slots(*)
        `)
        .single()
      
      if (!error) {
        // Update slot status to reserved
        await supabase
          .from('parking_slots')
          .update({ status: 'reserved' })
          .eq('id', bookingData.parking_slot_id)
        
        // Decrease available_slots count in parking_lots table
        // First get current count, then update
        const { data: lotData } = await supabase
          .from('parking_lots')
          .select('available_slots')
          .eq('id', bookingData.parking_lot_id)
          .single()
        
        if (lotData && lotData.available_slots > 0) {
          await supabase
            .from('parking_lots')
            .update({ 
              available_slots: lotData.available_slots - 1
            })
            .eq('id', bookingData.parking_lot_id)
        }
      }
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get user bookings with filtering
  async getUserBookings(userId, status = null) {
    const query = supabase
      .from('bookings')
      .select(`
        *,
        parking_slot:parking_slots(slot_number),
        parking_lot:parking_lots(name, address, city)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (status) {
      query.eq('status', status)
    }

    return await query
  },

  // Cancel booking
  async cancelBooking(bookingId, userId = null) {
    try {
      // Get booking details first
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: booking, error: fetchError } = await query.single()

      if (fetchError) return { data: null, error: fetchError }
      if (!booking) return { data: null, error: new Error('Booking not found') }

      // Check if booking can be cancelled
      if (booking.status !== 'confirmed') {
        return { data: null, error: new Error('Only confirmed bookings can be cancelled') }
      }

      // Update booking status to cancelled
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (!error) {
        // Make the slot available again
        await supabase
          .from('parking_slots')
          .update({ status: 'available' })
          .eq('id', booking.parking_slot_id)
        
        // Increase available_slots count in parking_lots table
        // First get current count, then update
        const { data: lotData } = await supabase
          .from('parking_lots')
          .select('available_slots')
          .eq('id', booking.parking_lot_id)
          .single()
        
        if (lotData) {
          await supabase
            .from('parking_lots')
            .update({ 
              available_slots: lotData.available_slots + 1
            })
            .eq('id', booking.parking_lot_id)
        }
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get booking by ID
  async getBookingById(id) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_lot:parking_lots(*),
          parking_slot:parking_slots(*),
          user:profiles(*)
        `)
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get booking by QR code
  async getBookingByQRCode(qrCode) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_lot:parking_lots(*),
          parking_slot:parking_slots(*),
          user:profiles(*)
        `)
        .eq('qr_code', qrCode)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update booking status
  async updateBookingStatus(id, status, updates = {}) {
    try {
      const updateData = { status, ...updates }
      
      if (status === 'active') {
        updateData.actual_start_time = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.actual_end_time = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          parking_lot:parking_lots(*),
          parking_slot:parking_slots(*)
        `)
        .single()

      if (!error) {
        // Update slot status based on booking status
        let slotStatus = 'available'
        if (status === 'active') {
          slotStatus = 'occupied'
        } else if (status === 'completed' || status === 'cancelled') {
          slotStatus = 'available'
        }

        await supabase
          .from('parking_slots')
          .update({ status: slotStatus })
          .eq('id', data.parking_slot_id)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Cancel booking
  async cancelBooking(id, userId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'confirmed') // Only confirmed bookings can be cancelled
        .select(`
          *,
          parking_slot:parking_slots(*)
        `)
        .single()

      if (!error && data) {
        // Update slot status to available
        await supabase
          .from('parking_slots')
          .update({ status: 'available' })
          .eq('id', data.parking_slot_id)
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Validate QR code for entry/exit
  async validateQRCode(qrCode, action = 'entry') {
    try {
      const { data: booking, error } = await this.getBookingByQRCode(qrCode)
      
      if (error || !booking) {
        return { valid: false, error: 'Invalid QR code' }
      }

      const now = new Date()
      const startTime = new Date(booking.start_time)
      const endTime = new Date(booking.end_time)

      if (action === 'entry') {
        // Check if booking is confirmed and within valid time
        if (booking.status !== 'confirmed') {
          return { valid: false, error: 'Booking is not confirmed' }
        }
        
        if (now < startTime) {
          return { valid: false, error: 'Booking time has not started yet' }
        }
        
        if (now > endTime) {
          return { valid: false, error: 'Booking time has expired' }
        }

        // Activate the booking
        const { data: updatedBooking, error: updateError } = await this.updateBookingStatus(
          booking.id, 
          'active'
        )

        return { 
          valid: true, 
          booking: updatedBooking, 
          action: 'entry',
          error: updateError 
        }
      } else if (action === 'exit') {
        // Check if booking is active
        if (booking.status !== 'active') {
          return { valid: false, error: 'No active booking found' }
        }

        // Complete the booking
        const { data: updatedBooking, error: updateError } = await this.updateBookingStatus(
          booking.id, 
          'completed'
        )

        return { 
          valid: true, 
          booking: updatedBooking, 
          action: 'exit',
          error: updateError 
        }
      }

      return { valid: false, error: 'Invalid action' }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  // Get all bookings (admin only)
  async getAllBookings(filters = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          parking_lot:parking_lots(*),
          parking_slot:parking_slots(*),
          user:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.parking_lot_id) {
        query = query.eq('parking_lot_id', filters.parking_lot_id)
      }

      if (filters.start_date) {
        query = query.gte('start_time', filters.start_date)
      }

      if (filters.end_date) {
        query = query.lte('end_time', filters.end_date)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}
