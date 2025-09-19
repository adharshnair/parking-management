import { supabase } from '../config/supabase.js'

export const notificationService = {
  // Get user notifications
  async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Create notification
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

    // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      return { count, error }
    } catch (error) {
      return { count: 0, error }
    }
  },

  // Send booking confirmation notification
  async sendBookingConfirmation(userId, bookingId, bookingDetails) {
    const notification = {
      user_id: userId,
      booking_id: bookingId,
      type: 'booking_confirmation',
      title: 'Booking Confirmed',
      message: `Your parking slot ${bookingDetails.slot_number} at ${bookingDetails.parking_lot_name} has been confirmed for ${bookingDetails.start_time}.`
    }
    return await this.createNotification(notification)
  },

  // Send reminder notification
  async sendReminder(userId, bookingId, bookingDetails) {
    const notification = {
      user_id: userId,
      booking_id: bookingId,
      type: 'reminder',
      title: 'Parking Reminder',
      message: `Reminder: Your parking slot ${bookingDetails.slot_number} at ${bookingDetails.parking_lot_name} starts in 30 minutes.`
    }
    return await this.createNotification(notification)
  },

  // Send payment success notification
  async sendPaymentSuccess(userId, bookingId, amount) {
    const notification = {
      user_id: userId,
      booking_id: bookingId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Payment of $${amount} has been processed successfully for your parking booking.`
    }
    return await this.createNotification(notification)
  },

  // Send cancellation notification
  async sendCancellation(userId, bookingId, bookingDetails) {
    const notification = {
      user_id: userId,
      booking_id: bookingId,
      type: 'cancellation',
      title: 'Booking Cancelled',
      message: `Your booking for slot ${bookingDetails.slot_number} at ${bookingDetails.parking_lot_name} has been cancelled.`
    }
    return await this.createNotification(notification)
  }
}
