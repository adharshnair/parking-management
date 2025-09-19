import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Badge } from 'src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
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
  Car, 
  Loader2,
  Search,
  Filter,
  Building
} from 'lucide-react'
import { parkingService } from 'src/services/parkingService'

const SlotsManagementPage = () => {
  const [slots, setSlots] = useState([])
  const [parkingLots, setParkingLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lotFilter, setLotFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [formData, setFormData] = useState({
    parking_lot_id: '',
    slot_number: '',
    slot_type: 'two_wheeler',
    hourly_rate: '',
    status: 'available'
  })
  const [bulkFormData, setBulkFormData] = useState({
    parking_lot_id: '',
    prefix: '',
    startNumber: 1,
    count: 10,
    slotType: 'two_wheeler',
    hourlyRate: ''
  })

  useEffect(() => {
    fetchData()
  }, [lotFilter, typeFilter, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch parking lots
      const { data: lotsData, error: lotsError } = await parkingService.getParkingLots()
      if (lotsError) throw lotsError

      // Fetch slots with filters
      const filters = {}
      if (lotFilter !== 'all') filters.parking_lot_id = lotFilter
      if (typeFilter !== 'all') filters.slot_type = typeFilter
      if (statusFilter !== 'all') filters.status = statusFilter

      const { data: slotsData, error: slotsError } = await parkingService.getAllParkingSlots(filters)
      if (slotsError) throw slotsError

      setParkingLots(lotsData || [])
      setSlots(slotsData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await parkingService.createParkingSlots([{
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate) || 0
      }])
      
      if (error) throw error
      
      setSlots([data[0], ...slots])
      setIsAddDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkAddSlots = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await parkingService.createBulkSlots(
        bulkFormData.parking_lot_id,
        {
          prefix: bulkFormData.prefix,
          startNumber: parseInt(bulkFormData.startNumber),
          count: parseInt(bulkFormData.count),
          slotType: bulkFormData.slotType,
          hourlyRate: parseFloat(bulkFormData.hourlyRate) || 0
        }
      )
      
      if (error) throw error
      
      setSlots([...data, ...slots])
      setIsBulkDialogOpen(false)
      resetBulkForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditSlot = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await parkingService.updateParkingSlot(editingSlot.id, {
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate) || 0
      })
      
      if (error) throw error
      
      setSlots(slots.map(slot => 
        slot.id === editingSlot.id ? data : slot
      ))
      setIsEditDialogOpen(false)
      setEditingSlot(null)
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteSlot = async (id) => {
    if (!confirm('Are you sure you want to delete this parking slot?')) return
    
    try {
      const { error } = await parkingService.deleteParkingSlot(id)
      if (error) throw error
      
      setSlots(slots.filter(slot => slot.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const openEditDialog = (slot) => {
    setEditingSlot(slot)
    setFormData({
      parking_lot_id: slot.parking_lot_id || '',
      slot_number: slot.slot_number || '',
      slot_type: slot.slot_type || 'two_wheeler',
      hourly_rate: slot.hourly_rate || '',
      status: slot.status || 'available'
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      parking_lot_id: '',
      slot_number: '',
      slot_type: 'two-wheeler',
      hourly_rate: '',
      status: 'available'
    })
  }

  const resetBulkForm = () => {
    setBulkFormData({
      parking_lot_id: '',
      prefix: '',
      startNumber: 1,
      count: 10,
      slotType: 'two-wheeler',
      hourlyRate: ''
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { variant: 'default', label: 'Available', color: 'text-green-600' },
      occupied: { variant: 'destructive', label: 'Occupied', color: 'text-red-600' },
      reserved: { variant: 'secondary', label: 'Reserved', color: 'text-blue-600' },
      maintenance: { variant: 'outline', label: 'Maintenance', color: 'text-orange-600' }
    }
    
    const config = statusConfig[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeIcon = (type) => {
    return <Car className="h-4 w-4 text-gray-400" />
  }

  const filteredSlots = slots.filter(slot => {
    const searchLower = searchTerm.toLowerCase()
    return (
      slot.slot_number?.toLowerCase().includes(searchLower) ||
      slot.parking_lots?.name?.toLowerCase().includes(searchLower) ||
      slot.slot_type?.toLowerCase().includes(searchLower)
    )
  })

  const getSlotStats = () => {
    return {
      total: slots.length,
      available: slots.filter(s => s.status === 'available').length,
      occupied: slots.filter(s => s.status === 'occupied').length,
      reserved: slots.filter(s => s.status === 'reserved').length,
      maintenance: slots.filter(s => s.status === 'maintenance').length
    }
  }

  const stats = getSlotStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading slots...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Slots Management</h1>
          <p className="text-muted-foreground">Manage parking slots across all locations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetBulkForm}>
                <Building className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reserved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search slots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={lotFilter} onValueChange={setLotFilter}>
          <SelectTrigger className="w-48">
            <Building className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {parkingLots.map(lot => (
              <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Car className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
            <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
            <SelectItem value="ev-charging">EV Charging</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
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

      {/* Slots Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Parking Slots ({filteredSlots.length})</CardTitle>
          <CardDescription>Manage and view all parking slots</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSlots.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No parking slots found</p>
              <p className="text-sm text-gray-400">Add slots to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getTypeIcon(slot.slot_type)}
                        <span className="ml-2">{slot.slot_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{slot.parking_lots?.name}</p>
                        <p className="text-sm text-gray-600">{slot.parking_lots?.address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{slot.slot_type}</Badge>
                    </TableCell>
                    <TableCell>₹{slot.hourly_rate}/hr</TableCell>
                    <TableCell>
                      {getStatusBadge(slot.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(slot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
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

      {/* Add Single Slot Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Parking Slot</DialogTitle>
            <DialogDescription>
              Create a new parking slot.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSlot} className="space-y-4">
            <div>
              <Label htmlFor="parking_lot_id">Parking Lot *</Label>
              <Select value={formData.parking_lot_id} onValueChange={(value) => setFormData({...formData, parking_lot_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parking lot" />
                </SelectTrigger>
                <SelectContent>
                  {parkingLots.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slot_number">Slot Number *</Label>
                <Input
                  id="slot_number"
                  value={formData.slot_number}
                  onChange={(e) => setFormData({...formData, slot_number: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slot_type">Slot Type</Label>
                <Select value={formData.slot_type} onValueChange={(value) => setFormData({...formData, slot_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                    <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
                    <SelectItem value="ev_charging">EV Charging</SelectItem>
                  </SelectContent>
                </Select>
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
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Slot</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Slots Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Parking Slots</DialogTitle>
            <DialogDescription>
              Create multiple parking slots at once.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkAddSlots} className="space-y-4">
            <div>
              <Label htmlFor="bulk_parking_lot_id">Parking Lot *</Label>
              <Select value={bulkFormData.parking_lot_id} onValueChange={(value) => setBulkFormData({...bulkFormData, parking_lot_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parking lot" />
                </SelectTrigger>
                <SelectContent>
                  {parkingLots.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  placeholder="A-"
                  value={bulkFormData.prefix}
                  onChange={(e) => setBulkFormData({...bulkFormData, prefix: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="startNumber">Start Number</Label>
                <Input
                  id="startNumber"
                  type="number"
                  value={bulkFormData.startNumber}
                  onChange={(e) => setBulkFormData({...bulkFormData, startNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  value={bulkFormData.count}
                  onChange={(e) => setBulkFormData({...bulkFormData, count: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk_slot_type">Slot Type</Label>
                <Select value={bulkFormData.slotType} onValueChange={(value) => setBulkFormData({...bulkFormData, slotType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                    <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
                    <SelectItem value="ev_charging">EV Charging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulk_hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="bulk_hourly_rate"
                  type="number"
                  step="0.01"
                  value={bulkFormData.hourlyRate}
                  onChange={(e) => setBulkFormData({...bulkFormData, hourlyRate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Preview: This will create {bulkFormData.count} slots from{' '}
                <strong>{bulkFormData.prefix}{bulkFormData.startNumber}</strong> to{' '}
                <strong>{bulkFormData.prefix}{parseInt(bulkFormData.startNumber) + parseInt(bulkFormData.count) - 1}</strong>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create {bulkFormData.count} Slots</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parking Slot</DialogTitle>
            <DialogDescription>
              Update the parking slot information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSlot} className="space-y-4">
            <div>
              <Label htmlFor="edit_parking_lot_id">Parking Lot *</Label>
              <Select value={formData.parking_lot_id} onValueChange={(value) => setFormData({...formData, parking_lot_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parking lot" />
                </SelectTrigger>
                <SelectContent>
                  {parkingLots.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_slot_number">Slot Number *</Label>
                <Input
                  id="edit_slot_number"
                  value={formData.slot_number}
                  onChange={(e) => setFormData({...formData, slot_number: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_slot_type">Slot Type</Label>
                <Select value={formData.slot_type} onValueChange={(value) => setFormData({...formData, slot_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                    <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
                    <SelectItem value="ev_charging">EV Charging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="edit_hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Slot</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SlotsManagementPage
