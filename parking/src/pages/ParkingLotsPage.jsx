import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card.jsx'
import { Button } from 'src/components/ui/button.jsx'
import { Input } from 'src/components/ui/input.jsx'
import { Badge } from 'src/components/ui/badge.jsx'
import { 
  MapPin, 
  Car, 
  Clock, 
  Search,
  Loader2,
  Star,
  Navigation
} from 'lucide-react'
import { parkingService } from 'src/services/parkingService'

const ParkingLotsPage = () => {
  const navigate = useNavigate()
  const [parkingLots, setParkingLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    city: '',
    maxRate: ''
  })

  useEffect(() => {
    fetchParkingLots()
  }, [])

  const fetchParkingLots = async () => {
    try {
      setLoading(true)
      const { data, error } = await parkingService.getParkingLots({
        search: searchTerm,
        city: filters.city
      })
      if (error) throw error
      setParkingLots(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchParkingLots()
  }

  const handleBookNow = (lotId) => {
    navigate(`/booking?lotId=${lotId}`)
  }

  const filteredLots = parkingLots.filter(lot => {
    const matchesSearch = !searchTerm || 
      lot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.city?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRate = !filters.maxRate || 
      (lot.hourly_rate && lot.hourly_rate <= parseFloat(filters.maxRate))
    
    return matchesSearch && matchesRate
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Find Parking</h1>
        <p className="text-muted-foreground">Discover available parking spots near you</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, address, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Input
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
              />
            </div>
            <div>
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Input
                type="number"
                placeholder="Max hourly rate (₹)"
                value={filters.maxRate}
                onChange={(e) => setFilters({...filters, maxRate: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Parking Lots Grid */}
      {filteredLots.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No parking lots found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search criteria or check back later.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLots.map((lot) => (
            <Card key={lot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{lot.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {lot.address}, {lot.city}
                    </CardDescription>
                  </div>
                  <Badge variant={lot.status === 'active' ? 'default' : 'secondary'}>
                    {lot.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Description */}
                  {lot.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {lot.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{lot.available_slots || 0}/{lot.total_slots || 0} available</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>₹{lot.hourly_rate || 0}/hr</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {lot.amenities && lot.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lot.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity.replace('_', ' ')}
                        </Badge>
                      ))}
                      {lot.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{lot.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button 
                      onClick={() => handleBookNow(lot.id)}
                      className="w-full"
                      disabled={lot.status !== 'active' || (lot.available_slots || 0) === 0}
                    >
                      {lot.status !== 'active' ? 'Not Available' : 
                       (lot.available_slots || 0) === 0 ? 'Fully Booked' : 
                       'Book Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ParkingLotsPage
