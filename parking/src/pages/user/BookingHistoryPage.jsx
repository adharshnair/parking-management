import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Badge } from 'src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
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
  Search, 
  Filter, 
  Loader2,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  Download
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext'
import { bookingService } from 'src/services/bookingService'

const BookingHistoryPage = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user, statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      let status = null
      if (statusFilter !== 'all') {
        status = statusFilter
      }

      const { data, error } = await bookingService.getUserBookings(user.id, status)
      if (error) throw error
      
      let filteredData = data || []
      
      // Apply date filter
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        filteredData = filteredData.filter(booking => 
          booking.start_time.startsWith(today)
        )
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filteredData = filteredData.filter(booking => 
          new Date(booking.start_time) >= weekAgo
        )
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        filteredData = filteredData.filter(booking => 
          new Date(booking.start_time) >= monthAgo
        )
      }

      setBookings(filteredData)
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

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase()
    return (
      booking.parking_lot?.name?.toLowerCase().includes(searchLower) ||
      booking.parking_slot?.slot_number?.toLowerCase().includes(searchLower) ||
      booking.vehicle_number?.toLowerCase().includes(searchLower)
    )
  })

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      active: bookings.filter(b => b.status === 'active').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalSpent: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0)
    }
    return stats
  }

  const stats = getBookingStats()

  const canCancelBooking = (booking) => {
    return booking.status === 'confirmed' && new Date(booking.start_time) > new Date()
  }

  const canShowQR = (booking) => {
    return booking.status === 'confirmed' || booking.status === 'active'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading booking history...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking History</h1>
          <p className="text-muted-foreground">View and manage your parking bookings</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="active">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>Complete history of your parking bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found</p>
              <p className="text-sm text-gray-400">
                {statusFilter !== 'all' || dateFilter !== 'all' || searchTerm 
                  ? 'Try adjusting your filters'
                  : 'Make your first booking to see history here'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const startTime = new Date(booking.start_time)
                  const endTime = new Date(booking.end_time)
                  const duration = Math.round((endTime - startTime) / (1000 * 60 * 60 * 1000)) // hours
                  
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        #{booking.id.slice(-8)}
                      </TableCell>
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
                          <p className="text-sm font-medium">{booking.vehicle_number}</p>
                          <p className="text-xs text-gray-600">{booking.vehicle_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {startTime.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {startTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {endTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{duration}h</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">₹{booking.total_amount}</p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {canShowQR(booking) && (
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                          {canCancelBooking(booking) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {booking.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingHistoryPage
