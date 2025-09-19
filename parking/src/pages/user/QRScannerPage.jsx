import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Badge } from 'src/components/ui/badge'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { 
  QrCode, 
  Camera, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Car,
  MapPin,
  Clock,
  CreditCard
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext'
import { bookingService } from 'src/services/bookingService'

const QRScannerPage = () => {
  const { user } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [cameraSupported, setCameraSupported] = useState(true)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false)
    }
  }, [])

  const startCamera = async () => {
    try {
      setScanning(true)
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.')
      setScanning(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
    setScanning(false)
  }

  const validateQRCode = async (code) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await bookingService.validateQRCode(code, user.id)
      
      if (error) throw error
      
      setResult(data)
      stopCamera()
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      setError('Please enter a valid QR code')
      return
    }
    
    await validateQRCode(manualCode.trim())
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      
      // In a real implementation, you would use a QR code library like qr-scanner
      // For now, we'll simulate the scanning process
      setTimeout(() => {
        setError('QR code scanning from image is not yet implemented. Please use manual entry.')
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to read QR code from image')
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setResult(null)
    setError(null)
    setManualCode('')
    stopCamera()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'invalid':
        return <XCircle className="h-6 w-6 text-red-600" />
      case 'expired':
        return <AlertCircle className="h-6 w-6 text-orange-600" />
      default:
        return <QrCode className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50 border-green-200'
      case 'invalid': return 'text-red-600 bg-red-50 border-red-200'
      case 'expired': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">QR Code Scanner</h1>
        <p className="text-muted-foreground">
          Scan QR codes to access parking slots or validate bookings
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {result && (
        <Card className={`mb-6 border-2 ${getStatusColor(result.status)}`}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              {getStatusIcon(result.status)}
              <div>
                <CardTitle className="capitalize">{result.status} QR Code</CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {result.booking && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Vehicle: {result.booking.vehicle_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Slot: {result.booking.parking_slot?.slot_number} at {result.booking.parking_lot?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(result.booking.start_time).toLocaleString()} - {new Date(result.booking.end_time).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Amount: ₹{result.booking.total_amount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Badge variant={result.status === 'valid' ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={resetScanner} className="w-full">
                  Scan Another Code
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Camera Scanner</span>
            </CardTitle>
            <CardDescription>
              Use your camera to scan QR codes directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!cameraSupported ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Camera is not supported on this device or browser.
                  Please use manual entry instead.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {scanning ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white rounded-lg shadow-lg"></div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={stopCamera} variant="outline" className="flex-1">
                        Stop Camera
                      </Button>
                      <Button onClick={() => validateQRCode('demo-qr-code-123')} className="flex-1">
                        Simulate Scan
                      </Button>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Position the QR code within the frame to scan
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Camera preview will appear here</p>
                      </div>
                    </div>
                    <Button onClick={startCamera} className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>Manual Entry</span>
            </CardTitle>
            <CardDescription>
              Enter QR code manually or upload an image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">QR Code</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR code here..."
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={handleManualEntry} 
              className="w-full"
              disabled={loading || !manualCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Code'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload QR Code Image</Label>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Support for JPG, PNG, GIF up to 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use QR Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">1. Scan with Camera</h4>
              <p className="text-sm text-muted-foreground">
                Use your device camera to scan QR codes from booking confirmations
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">2. Manual Entry</h4>
              <p className="text-sm text-muted-foreground">
                Type in the QR code manually if camera scanning is not available
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">3. Access Granted</h4>
              <p className="text-sm text-muted-foreground">
                Valid QR codes will grant you access to your booked parking slot
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRScannerPage
