import QRCode from 'qrcode'

// Generate QR code data for booking
export const generateQRCodeData = (booking) => {
  const qrData = {
    bookingId: booking.id || crypto.randomUUID(),
    parkingLotId: booking.parking_lot_id,
    slotId: booking.parking_slot_id,
    userId: booking.user_id,
    vehicleNumber: booking.vehicle_number,
    startTime: booking.start_time,
    endTime: booking.end_time,
    timestamp: Date.now()
  }
  
  return JSON.stringify(qrData)
}

// Generate QR code hash for database indexing (browser-compatible)
export const generateQRCodeHash = async (qrCodeData) => {
  try {
    // Use Web Crypto API for hashing (browser-compatible)
    const encoder = new TextEncoder()
    const data = encoder.encode(qrCodeData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('Error generating QR code hash:', error)
    // Fallback to a simple hash based on string content
    let hash = 0
    for (let i = 0; i < qrCodeData.length; i++) {
      const char = qrCodeData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

// Generate QR code as data URL
export const generateQRCode = async (booking) => {
  try {
    const qrData = generateQRCodeData(booking)
    
    // For database storage, just return the JSON data (much smaller)
    // The actual QR code image can be generated on-demand in the frontend
    return qrData
    
    // If you need the actual QR code image, use this instead:
    // const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    //   width: 256,
    //   margin: 2,
    //   color: {
    //     dark: '#000000',
    //     light: '#FFFFFF'
    //   }
    // })
    // return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Return the raw data as fallback
    return generateQRCodeData(booking)
  }
}

// Generate QR code image URL (for display purposes)
export const generateQRCodeImageURL = async (qrData) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code image:', error)
    return null
  }
}

// Validate QR code data
export const validateQRCodeData = (qrCodeString) => {
  try {
    const data = JSON.parse(qrCodeString)
    
    // Check required fields
    const requiredFields = ['bookingId', 'parkingLotId', 'slotId', 'userId', 'vehicleNumber', 'startTime', 'endTime']
    const hasAllFields = requiredFields.every(field => data[field])
    
    if (!hasAllFields) {
      return { valid: false, error: 'Invalid QR code format' }
    }
    
    // Check if QR code is not too old (24 hours)
    const now = Date.now()
    const qrTimestamp = data.timestamp || 0
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    if (now - qrTimestamp > maxAge) {
      return { valid: false, error: 'QR code has expired' }
    }
    
    return { valid: true, data }
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' }
  }
}

// Render QR code component
export const QRCodeComponent = ({ value, size = 256, className = '' }) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <QRCode value={value} size={size} />
    </div>
  )
}
