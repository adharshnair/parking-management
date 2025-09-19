import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from 'src/components/ui/table'
import { 
  Calendar, 
  Car, 
  MapPin, 
  Clock, 
  Loader2,
  Plus,
  QrCode,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext.jsx'
import { bookingService } from 'src/services/bookingService'
import { userService } from 'src/services/userService'
import QRCodeModal from 'src/components/QRCodeModal.jsx'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user bookings
      const { data: bookingsData, error: bookingsError } = await bookingService.getUserBookings(user.id)
      if (bookingsError) throw bookingsError

      // Fetch user stats
      const { data: statsData, error: statsError } = await userService.getUserStats(user.id)
      if (statsError) throw statsError

      setBookings(bookingsData || [])
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const { data, error } = await bookingService.cancelBooking(bookingId, user.id)
      if (error) throw error
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleShowQR = (booking) => {
    setSelectedBooking(booking)
    setShowQRModal(true)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { 
        variant: 'secondary', 
        label: 'Confirmed',
        icon: Clock,
        color: 'text-blue-600'
      },
      active: { 
        variant: 'default', 
        label: 'In Progress',
        icon: CheckCircle,
        color: 'text-green-600'
      },
      completed: { 
        variant: 'outline', 
        label: 'Completed',
        icon: CheckCircle,
        color: 'text-gray-600'
      },
      cancelled: { 
        variant: 'destructive', 
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-600'
      }
    }
    
    const config = statusConfig[status] || { variant: 'secondary', label: status }
    const IconComponent = config.icon || Clock
    
    return (
      <div className="flex items-center space-x-2">
        <IconComponent className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    )
  }

  const getUpcomingBookings = () => {
    const now = new Date()
    return bookings.filter(booking => 
      booking.status === 'confirmed' && new Date(booking.start_time) > now
    )
  }

  const getActiveBookings = () => {
    return bookings.filter(booking => booking.status === 'active')
  }

  const getRecentBookings = () => {
    return bookings.slice(0, 5)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">Here's your parking dashboard</p>
        </div>
        <Button onClick={() => navigate('/parking-lots')}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedBookings || 0}</div>
            <p className="text-xs text-muted-foreground">Successful bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Lifetime spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Active/Upcoming Bookings */}
      {(getActiveBookings().length > 0 || getUpcomingBookings().length > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current & Upcoming Bookings</CardTitle>
            <CardDescription>Your active and confirmed bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getActiveBookings().map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Car className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Active Parking</p>
                      <p className="text-sm text-green-600">
                        {booking.parking_lot?.name} - Slot {booking.parking_slot?.slot_number}
                      </p>
                      <p className="text-xs text-green-500">
                        Started: {new Date(booking.actual_start_time || booking.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleShowQR(booking)}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR
                    </Button>
                  </div>
                </div>
              ))}
              
              {getUpcomingBookings().map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Upcoming Booking</p>
                      <p className="text-sm text-blue-600">
                        {booking.parking_lot?.name} - Slot {booking.parking_slot?.slot_number}
                      </p>
                      <p className="text-xs text-blue-500">
                        Starts: {new Date(booking.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(booking.status)}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest parking history</CardDescription>
        </CardHeader>
        <CardContent>
          {getRecentBookings().length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings yet</p>
              <p className="text-sm text-gray-400">Book your first parking slot to get started</p>
              <Button className="mt-4" onClick={() => navigate('/parking-lots')}>
                <Plus className="h-4 w-4 mr-2" />
                Make a Booking
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getRecentBookings().map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.parking_lot?.name}</p>
                        <p className="text-sm text-gray-600">{booking.parking_lot?.city}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-gray-400" />
                        {booking.parking_slot?.slot_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {new Date(booking.start_time).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(booking.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(booking.end_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{booking.vehicle_number}</p>
                        <p className="text-xs text-gray-600">{booking.vehicle_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">₹{booking.total_amount}</p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {(booking.status === 'confirmed' || booking.status === 'active') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShowQR(booking)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <QRCodeModal 
        booking={selectedBooking}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  )
}

export default DashboardPage
