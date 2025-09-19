import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Switch } from 'src/components/ui/switch'
import { Label } from 'src/components/ui/label'
import { Separator } from 'src/components/ui/separator'
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Info, 
  X,
  Settings,
  Loader2,
  Filter,
  Check
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext'
import { supabase } from 'src/config/supabase'

const NotificationsPage = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    booking_reminders: true,
    promotional_emails: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, unread, read
  
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchNotificationSettings()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data?.notification_settings) {
        setSettings({ ...settings, ...data.notification_settings })
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ))
    } catch (err) {
      setError(err.message)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      
      setNotifications(notifications.map(notif => ({ ...notif, read: true })))
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error
      
      setNotifications(notifications.filter(notif => notif.id !== notificationId))
    } catch (err) {
      setError(err.message)
    }
  }

  const updateNotificationSettings = async (newSettings) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: newSettings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setSettings(newSettings)
    } catch (err) {
      setError(err.message)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'payment_success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'booking_reminder':
      case 'booking_expiring':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'booking_cancelled':
      case 'payment_failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getNotificationBadge = (type) => {
    const typeConfig = {
      booking_confirmed: { variant: 'default', label: 'Booking' },
      booking_reminder: { variant: 'secondary', label: 'Reminder' },
      booking_cancelled: { variant: 'destructive', label: 'Cancelled' },
      payment_success: { variant: 'default', label: 'Payment' },
      payment_failed: { variant: 'destructive', label: 'Payment' },
      promotional: { variant: 'outline', label: 'Promotion' },
      system: { variant: 'secondary', label: 'System' }
    }
    
    const config = typeConfig[type] || { variant: 'outline', label: 'Info' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your bookings and account activity
            {unreadCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              <Filter className="h-4 w-4 mr-2" />
              Unread ({unreadCount})
            </Button>
            <Button 
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Your latest updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications found</p>
                  <p className="text-sm text-gray-400">
                    {filter === 'unread' 
                      ? 'All caught up! No unread notifications.'
                      : 'Your notifications will appear here when you have activity.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`border rounded-lg p-4 ${
                        !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-sm">
                                {notification.title}
                              </h4>
                              {getNotificationBadge(notification.type)}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>
                Customize how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ ...settings, email_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ ...settings, push_notifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="booking-reminders">Booking Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders before your booking time
                    </p>
                  </div>
                  <Switch
                    id="booking-reminders"
                    checked={settings.booking_reminders}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ ...settings, booking_reminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="promotional-emails">Promotional Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive offers and promotions
                    </p>
                  </div>
                  <Switch
                    id="promotional-emails"
                    checked={settings.promotional_emails}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ ...settings, promotional_emails: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{notifications.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unread</span>
                <span className="font-semibold text-blue-600">{unreadCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-semibold">
                  {notifications.filter(n => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(n.created_at) >= weekAgo
                  }).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
