import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Badge } from 'src/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from 'src/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from 'src/components/ui/table'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin, 
  Car, 
  Loader2,
  Search
} from 'lucide-react'
import { parkingService } from 'src/services/parkingService'

const AdminParkingLotsPage = () => {
  const [parkingLots, setParkingLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLot, setEditingLot] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    total_slots: '',
    hourly_rate: '',
    description: ''
  })

  useEffect(() => {
    fetchParkingLots()
  }, [])

  const fetchParkingLots = async () => {
    try {
      setLoading(true)
      const { data, error } = await parkingService.getParkingLots()
      if (error) throw error
      setParkingLots(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLot = async (e) => {
    e.preventDefault()
    try {
      const totalSlots = parseInt(formData.total_slots) || 0
      const { data, error } = await parkingService.createParkingLot({
        ...formData,
        status: 'active',
        total_slots: totalSlots,
        available_slots: totalSlots, // Set available_slots equal to total_slots initially
        hourly_rate: parseFloat(formData.hourly_rate) || 0.00,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null
      })
      
      if (error) throw error
      
      setParkingLots([data, ...parkingLots])
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditLot = async (e) => {
    e.preventDefault()
    try {
      const totalSlots = parseInt(formData.total_slots) || 0
      const currentLot = editingLot
      const currentAvailable = currentLot.available_slots || 0
      const currentTotal = currentLot.total_slots || 0
      
      // Calculate new available slots:
      // If total slots increased, add the difference to available slots
      // If total slots decreased, reduce available slots proportionally (but not below 0)
      let newAvailableSlots = currentAvailable
      if (totalSlots > currentTotal) {
        // Slots increased - add the difference to available
        newAvailableSlots = currentAvailable + (totalSlots - currentTotal)
      } else if (totalSlots < currentTotal) {
        // Slots decreased - reduce available proportionally
        const difference = currentTotal - totalSlots
        newAvailableSlots = Math.max(0, currentAvailable - difference)
      }
      
      const { data, error } = await parkingService.updateParkingLot(editingLot.id, {
        ...formData,
        total_slots: totalSlots,
        available_slots: newAvailableSlots,
        hourly_rate: parseFloat(formData.hourly_rate) || 0.00,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null
      })
      
      if (error) throw error
      
      setParkingLots(parkingLots.map(lot => 
        lot.id === editingLot.id ? data : lot
      ))
      setIsEditDialogOpen(false)
      setEditingLot(null)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteLot = async (id) => {
    if (!confirm('Are you sure you want to delete this parking lot?')) return
    
    try {
      const { error } = await parkingService.deleteParkingLot(id)
      if (error) throw error
      
      setParkingLots(parkingLots.filter(lot => lot.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const openEditDialog = (lot) => {
    setEditingLot(lot)
    setFormData({
      name: lot.name || '',
      address: lot.address || '',
      city: lot.city || '',
      state: lot.state || '',
      postal_code: lot.postal_code || '',
      latitude: lot.latitude || '',
      longitude: lot.longitude || '',
      total_slots: lot.total_slots || '',
      hourly_rate: lot.hourly_rate || '',
      description: lot.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      latitude: '',
      longitude: '',
      total_slots: '',
      hourly_rate: '',
      description: ''
    })
  }

  const filteredLots = parkingLots.filter(lot =>
    lot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading parking lots...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parking Lots</h1>
          <p className="text-muted-foreground">Manage your parking locations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Parking Lot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Parking Lot</DialogTitle>
              <DialogDescription>
                Create a new parking location for your system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_slots">Total Slots</Label>
                  <Input
                    id="total_slots"
                    type="number"
                    value={formData.total_slots}
                    onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  {/* Empty div for grid alignment */}
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Parking Lot</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2 mb-6">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search parking lots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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

      {/* Parking Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Parking Lots ({filteredLots.length})</CardTitle>
          <CardDescription>Manage and view all your parking locations</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLots.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No parking lots found</p>
              <p className="text-sm text-gray-400">Add your first parking lot to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Total Slots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{lot.address}</TableCell>
                    <TableCell>{lot.city}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-gray-400" />
                        {lot.total_slots || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lot.status === 'active' ? 'default' : 'secondary'}>
                        {lot.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(lot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteLot(lot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Parking Lot</DialogTitle>
            <DialogDescription>
              Update the parking lot information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLot} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-total_slots">Total Slots</Label>
                <Input
                  id="edit-total_slots"
                  type="number"
                  value={formData.total_slots}
                  onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="edit-hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                {/* Empty div for grid alignment */}
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-postal_code">Postal Code</Label>
                <Input
                  id="edit-postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Parking Lot</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminParkingLotsPage
