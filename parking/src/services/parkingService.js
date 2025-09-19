import { supabase } from '../config/supabase.js'

export const parkingService = {
  // Get all parking lots
  async getParkingLots(filters = {}) {
    try {
      let query = supabase
        .from('parking_lots')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get parking lot by ID with slots
  async getParkingLotById(id) {
    try {
      const { data, error } = await supabase
        .from('parking_lots')
        .select(`
          *,
          parking_slots (*)
        `)
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Auto-create slots for a parking lot if they don't exist
  async ensureSlotsExist(parkingLotId) {
    try {
      // Check if slots already exist
      const { data: existingSlots } = await supabase
        .from('parking_slots')
        .select('id')
        .eq('parking_lot_id', parkingLotId)
        .limit(1)

      if (existingSlots && existingSlots.length > 0) {
        return { success: true }
      }

      // Get parking lot details
      const { data: parkingLot } = await supabase
        .from('parking_lots')
        .select('total_slots, hourly_rate')
        .eq('id', parkingLotId)
        .single()

      if (!parkingLot) {
        return { success: false, error: 'Parking lot not found' }
      }

      const totalSlots = parkingLot.total_slots
      const twoWheelerSlots = Math.ceil(totalSlots * 0.4)
      const fourWheelerSlots = totalSlots - twoWheelerSlots

      const slotsToCreate = []

      // Create two-wheeler slots
      for (let i = 1; i <= twoWheelerSlots; i++) {
        slotsToCreate.push({
          parking_lot_id: parkingLotId,
          slot_number: `TW-${i.toString().padStart(2, '0')}`,
          slot_type: 'two_wheeler',
          status: 'available',
          hourly_rate: parkingLot.hourly_rate * 0.6,
          floor_level: 1
        })
      }

      // Create four-wheeler slots
      for (let i = 1; i <= fourWheelerSlots; i++) {
        slotsToCreate.push({
          parking_lot_id: parkingLotId,
          slot_number: `FW-${i.toString().padStart(2, '0')}`,
          slot_type: 'four_wheeler',
          status: 'available',
          hourly_rate: parkingLot.hourly_rate,
          floor_level: 1
        })
      }

      const { error } = await supabase
        .from('parking_slots')
        .insert(slotsToCreate)

      return { success: !error, error }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Get available slots for a parking lot
  async getAvailableSlots(parkingLotId, vehicleType, startTime, endTime) {
    try {
      // Ensure slots exist first
      await this.ensureSlotsExist(parkingLotId)

      // Get all slots of the specified type
      const { data: allSlots, error: slotsError } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('parking_lot_id', parkingLotId)
        .eq('slot_type', vehicleType)
        .eq('status', 'available')
        .order('slot_number')

      if (slotsError) throw slotsError

      // Get conflicting bookings
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('parking_slot_id')
        .eq('parking_lot_id', parkingLotId)
        .in('status', ['confirmed', 'active'])
        .or(
          `and(start_time.lte.${startTime},end_time.gt.${startTime}),` +
          `and(start_time.lt.${endTime},end_time.gte.${endTime}),` +
          `and(start_time.gte.${startTime},end_time.lte.${endTime})`
        )

      if (bookingsError) {
        console.warn('Error checking conflicting bookings:', bookingsError)
        // If booking check fails, return all slots
        return { data: allSlots, error: null }
      }

      // Filter out conflicted slots
      const conflictedSlotIds = conflictingBookings.map(b => b.parking_slot_id)
      const availableSlots = allSlots.filter(slot => !conflictedSlotIds.includes(slot.id))

      return { data: availableSlots, error: null }
    } catch (error) {
      console.error('Error in getAvailableSlots:', error)
      return { data: [], error }
    }
  },

  // Create parking lot (admin only)
  async createParkingLot(parkingLotData) {
    try {
      const { data, error } = await supabase
        .from('parking_lots')
        .insert(parkingLotData)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update parking lot (admin only)
  async updateParkingLot(id, updates) {
    try {
      const { data, error } = await supabase
        .from('parking_lots')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete parking lot (admin only)
  async deleteParkingLot(id) {
    try {
      const { data, error } = await supabase
        .from('parking_lots')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create parking slots (admin only)
  async createParkingSlots(slots) {
    try {
      const { data, error } = await supabase
        .from('parking_slots')
        .insert(slots)
        .select()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update parking slot (admin only)
  async updateParkingSlot(id, updates) {
    try {
      const { data, error } = await supabase
        .from('parking_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete parking slot (admin only)
  async deleteParkingSlot(id) {
    try {
      const { data, error } = await supabase
        .from('parking_slots')
        .delete()
        .eq('id', id)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get all parking slots with filters
  async getAllParkingSlots(filters = {}) {
    try {
      let query = supabase
        .from('parking_slots')
        .select(`
          *,
          parking_lots(name, address)
        `)

      if (filters.parking_lot_id) {
        query = query.eq('parking_lot_id', filters.parking_lot_id)
      }

      if (filters.slot_type) {
        query = query.eq('slot_type', filters.slot_type)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('slot_number', { ascending: true })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Bulk create slots
  async createBulkSlots(parkingLotId, slotConfig) {
    try {
      const slots = []
      const { prefix, startNumber, count, slotType, hourlyRate } = slotConfig

      for (let i = 0; i < count; i++) {
        slots.push({
          parking_lot_id: parkingLotId,
          slot_number: `${prefix}${startNumber + i}`,
          slot_type: slotType,
          status: 'available',
          hourly_rate: hourlyRate
        })
      }

      const { data, error } = await supabase
        .from('parking_slots')
        .insert(slots)
        .select()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Dashboard stats
  async getDashboardStats() {
    try {
      // Total parking lots
      const { data: lots, error: lotsError } = await supabase
        .from('parking_lots')
        .select('id')
        .eq('status', 'active')

      // Total slots
      const { data: slots, error: slotsError } = await supabase
        .from('parking_slots')
        .select('id, status')

      // Active bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .in('status', ['confirmed', 'active'])

      // Today's revenue
      const today = new Date().toISOString().split('T')[0]
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success')
        .gte('created_at', today)

      if (lotsError || slotsError || bookingsError || paymentsError) {
        throw new Error('Error fetching dashboard stats')
      }

      const availableSlots = slots?.filter(slot => slot.status === 'available').length || 0
      const occupiedSlots = slots?.filter(slot => slot.status === 'occupied').length || 0
      const totalRevenue = payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0

      const stats = {
        totalLots: lots?.length || 0,
        totalSlots: slots?.length || 0,
        availableSlots,
        occupiedSlots,
        activeBookings: bookings?.length || 0,
        todayRevenue: totalRevenue,
        occupancyRate: slots?.length ? Math.round((occupiedSlots / slots.length) * 100) : 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
