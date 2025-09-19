import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card.jsx'

const AdminReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">View detailed reports and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Reports page is under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminReportsPage
