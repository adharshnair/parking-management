import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card.jsx'
import { Button } from 'src/components/ui/button.jsx'
import { Input } from 'src/components/ui/input.jsx'
import { Label } from 'src/components/ui/label.jsx'
import { Badge } from 'src/components/ui/badge.jsx'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from 'src/components/ui/select.jsx'
import { 
  MapPin, 
  Car, 
  Clock, 
  Calendar,
  Loader2,
  ArrowLeft,
  QrCode,
  CheckCircle
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext.jsx'
import { parkingService } from 'src/services/parkingService'
import { bookingService } from 'src/services/bookingService'
import BookingConfirmation from 'src/components/BookingConfirmation.jsx'

const BookingPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { parkingLotId } = useParams()
  const { user } = useAuth()
  
  // Get lot ID from either URL param or query param
  const lotId = parkingLotId || searchParams.get('lotId')

  const [parkingLot, setParkingLot] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  const [formData, setFormData] = useState({
    vehicle_type: '',
    vehicle_number: '',
    start_time: '',
    end_time: '',
    selected_slot: ''
  })

  useEffect(() => {
    if (lotId) {
      fetchParkingLotDetails()
    } else {
      setError('No parking lot selected')
      setLoading(false)
    }
  }, [lotId])

  useEffect(() => {
    if (formData.vehicle_type && formData.start_time && formData.end_time && parkingLot) {
      fetchAvailableSlots()
    }
  }, [formData.vehicle_type, formData.start_time, formData.end_time, parkingLot])

  const fetchParkingLotDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await parkingService.getParkingLotById(lotId)
      if (error) throw error
      setParkingLot(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await parkingService.getAvailableSlots(
        lotId,
        formData.vehicle_type,
        formData.start_time,
        formData.end_time
      )
      if (error) throw error
      setAvailableSlots(data || [])
    } catch (err) {
      console.error('Error fetching slots:', err)
      setAvailableSlots([])
    }
  }

  const calculateTotal = () => {
    if (!formData.start_time || !formData.end_time || !parkingLot) return 0
    
    const start = new Date(formData.start_time)
    const end = new Date(formData.end_time)
    const hours = Math.ceil((end - start) / (1000 * 60 * 60))
    return hours * (parkingLot.hourly_rate || 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setError('Please log in to make a booking')
      return
    }

    if (!formData.selected_slot) {
      setError('Please select a parking slot')
      return
    }

    try {
      setBooking(true)
      setError(null)

      const bookingData = {
        user_id: user.id,
        parking_lot_id: lotId,
        parking_slot_id: formData.selected_slot,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        total_amount: calculateTotal()
      }

      const { data, error } = await bookingService.createBooking(bookingData)
      if (error) throw error

      // Show confirmation dialog instead of redirect
      setConfirmedBooking(data)
      setShowConfirmation(true)

    } catch (err) {
      setError(err.message)
    } finally {
      setBooking(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      const { error } = await bookingService.cancelBooking(bookingId)
      if (error) throw error
      
      setShowConfirmation(false)
      setSuccess('Booking cancelled successfully!')
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err) {
      setError('Failed to cancel booking: ' + err.message)
    }
  }

  const handleCloseConfirmation = () => {
    setShowConfirmation(false)
    navigate('/dashboard')
  }

  const getMinDateTime = () => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const getMinEndDateTime = () => {
    if (!formData.start_time) return getMinDateTime()
    const start = new Date(formData.start_time)
    return new Date(start.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) // 1 hour minimum
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Successful!</h3>
              <p className="text-muted-foreground mb-4">{success}</p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/parking-lots')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Parking Lots
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Book Parking Slot</h1>
        <p className="text-muted-foreground">Reserve your parking space</p>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {parkingLot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parking Lot Info */}
          <Card>
            <CardHeader>
              <CardTitle>{parkingLot.name}</CardTitle>
              <CardDescription>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {parkingLot.address}, {parkingLot.city}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">₹{parkingLot.hourly_rate || 0}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available Slots:</span>
                  <span className="font-medium">{parkingLot.available_slots || 0}/{parkingLot.total_slots || 0}</span>
                </div>
                {parkingLot.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1">{parkingLot.description}</p>
                  </div>
                )}
                {parkingLot.amenities && parkingLot.amenities.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Amenities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parkingLot.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Fill in your booking information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <Select 
                      value={formData.vehicle_type} 
                      onValueChange={(value) => setFormData({...formData, vehicle_type: value, selected_slot: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                        <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                    <Input
                      id="vehicle_number"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({...formData, vehicle_number: e.target.value})}
                      placeholder="e.g., MH12AB1234"
                      required
                    />
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value, selected_slot: ''})}
                      min={getMinDateTime()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value, selected_slot: ''})}
                      min={getMinEndDateTime()}
                      required
                    />
                  </div>
                </div>

                {/* Slot Selection */}
                {formData.vehicle_type && formData.start_time && formData.end_time && (
                  <div>
                    <Label htmlFor="selected_slot">Available Slots</Label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">
                        No slots available for the selected time and vehicle type
                      </p>
                    ) : (
                      <Select 
                        value={formData.selected_slot} 
                        onValueChange={(value) => setFormData({...formData, selected_slot: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parking slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map((slot) => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.slot_number} - {slot.slot_type.replace('_', ' ')} 
                              {slot.hourly_rate && ` (₹${slot.hourly_rate}/hr)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Total Cost */}
                {formData.start_time && formData.end_time && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Cost:</span>
                      <span className="text-2xl font-bold">₹{calculateTotal()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Duration: {Math.ceil((new Date(formData.end_time) - new Date(formData.start_time)) / (1000 * 60 * 60))} hours
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={booking || !formData.selected_slot}
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Book Now
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Confirmation Dialog */}
      {showConfirmation && confirmedBooking && (
        <BookingConfirmation
          booking={confirmedBooking}
          onClose={handleCloseConfirmation}
          onCancelBooking={handleCancelBooking}
        />
      )}
    </div>
  )
}

export default BookingPage
