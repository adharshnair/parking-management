import React from 'react'
import { CheckCircle, Calendar, Clock, MapPin, Car, QrCode } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'

const BookingConfirmation = ({ booking, onClose, onCancelBooking }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = () => {
    const start = new Date(booking.start_time)
    const end = new Date(booking.end_time)
    const hours = Math.round((end - start) / (1000 * 60 * 60))
    return hours
  }

  // Generate a simple QR code placeholder
  const QRCodePlaceholder = () => (
    <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <QrCode className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div className="text-xs text-gray-500">QR Code</div>
        <div className="text-xs text-gray-400 mt-1">#{booking.id?.slice(-6) || 'ABC123'}</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-600">Booking Confirmed!</CardTitle>
          <p className="text-sm text-gray-600">Your parking slot has been reserved</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <QRCodePlaceholder />
          </div>
          
          <Separator />
          
          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{booking.parking_lot?.name || 'Demo Parking'}</div>
                <div className="text-sm text-gray-500">{booking.parking_lot?.address || 'Dmart Satellite'}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Car className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Slot: {booking.parking_slot?.slot_number || 'TW-01'}</div>
                <div className="text-sm text-gray-500">
                  {booking.vehicle_type === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler'} - {booking.vehicle_number}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{formatDate(booking.start_time)}</div>
                <div className="text-sm text-gray-500">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)} ({getDuration()}h)
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">₹{booking.total_amount || '30'}</div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onCancelBooking(booking.id)}
              className="flex-1"
            >
              Cancel Booking
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Show this QR code at the parking entrance
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BookingConfirmation
