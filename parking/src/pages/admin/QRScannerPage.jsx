import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card.jsx'

const QRScannerPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">QR Code Scanner</h1>
        <p className="text-muted-foreground">Scan QR codes for entry and exit validation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QR Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <p>QR Scanner page is under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRScannerPage
