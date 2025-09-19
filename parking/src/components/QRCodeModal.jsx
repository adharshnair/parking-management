import React, { useState, useEffect } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { generateQRCodeImageURL } from '../utils/qrCodeUtils.jsx'

const QRCodeModal = ({ booking, isOpen, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && booking) {
      generateQRCodeImage()
    }
  }, [isOpen, booking])

  const generateQRCodeImage = async () => {
    try {
      setLoading(true)
      // Use the QR code data from the booking to generate the image
      const qrData = booking.qr_code || JSON.stringify({
        bookingId: booking.id,
        parkingLotId: booking.parking_lot_id,
        slotId: booking.parking_slot_id,
        userId: booking.user_id,
        vehicleNumber: booking.vehicle_number,
        startTime: booking.start_time,
        endTime: booking.end_time,
        timestamp: Date.now()
      })
      
      const qrUrl = await generateQRCodeImageURL(qrData)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `parking-qr-${booking.id}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleShare = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        const file = new File([blob], `parking-qr-${booking.id}.png`, { type: 'image/png' })
        
        await navigator.share({
          title: 'Parking Booking QR Code',
          text: `QR Code for parking booking at ${booking.parking_lot?.name}`,
          files: [file]
        })
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback: copy booking details to clipboard
        const bookingText = `Parking Booking\nLocation: ${booking.parking_lot?.name}\nSlot: ${booking.parking_slot?.slot_number}\nVehicle: ${booking.vehicle_number}\nTime: ${new Date(booking.start_time).toLocaleString()}`
        navigator.clipboard.writeText(bookingText)
      }
    }
  }

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Parking QR Code</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-500">Generating QR Code...</div>
                </div>
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Parking QR Code" 
                className="w-64 h-64 border rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500">QR Code Error</div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={booking.status === 'confirmed' ? 'secondary' : 'default'}>
                {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm text-gray-600">{booking.parking_lot?.name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Slot:</span>
              <span className="text-sm text-gray-600">{booking.parking_slot?.slot_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Vehicle:</span>
              <span className="text-sm text-gray-600">{booking.vehicle_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm text-gray-600">{formatDate(booking.start_time)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Time:</span>
              <span className="text-sm text-gray-600">
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-sm font-semibold">₹{booking.total_amount}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleDownload} className="flex-1" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRCodeModal
