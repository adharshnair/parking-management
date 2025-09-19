import { supabase } from '../config/supabase.js'

export const userService = {
  // Get all users (admin only)
  async getAllUsers(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.role) {
        query = query.eq('role', filters.role)
      }

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update user profile
  async updateUserProfile(id, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update user role (admin only)
  async updateUserRole(id, role) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      // Get user bookings with amounts
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, total_amount')
        .eq('user_id', userId)

      if (bookingsError) {
        throw new Error('Error fetching user stats')
      }

      const totalBookings = bookings?.length || 0
      
      // Active bookings include both 'confirmed' (upcoming) and 'active' (in progress) 
      const activeBookings = bookings?.filter(b => 
        b.status === 'active' || b.status === 'confirmed'
      ).length || 0
      
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
      
      // Calculate total spent from confirmed and completed bookings
      const totalSpent = bookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'completed' || b.status === 'active'
      ).reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0

      const stats = {
        totalBookings,
        activeBookings,
        completedBookings,
        totalSpent
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
