import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar'
import { Badge } from 'src/components/ui/badge'
import { Separator } from 'src/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Car, 
  Shield, 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  Loader2
} from 'lucide-react'
import { useAuth } from 'src/context/AuthContext'
import { supabase } from 'src/config/supabase'

const ProfilePage = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })
  const [vehicles, setVehicles] = useState([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    vehicle_type: 'car',
    vehicle_model: ''
  })
  const [addingVehicle, setAddingVehicle] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchVehicles()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setProfile(data)
      } else {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || '',
            avatar_url: user.user_metadata?.avatar_url || ''
          }])
          .select()
          .single()

        if (createError) throw createError
        setProfile(newProfile)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setVehicles(data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_number.trim()) return

    try {
      const { data, error } = await supabase
        .from('user_vehicles')
        .insert([{
          user_id: user.id,
          ...newVehicle
        }])
        .select()
        .single()

      if (error) throw error
      
      setVehicles([...vehicles, data])
      setNewVehicle({
        vehicle_number: '',
        vehicle_type: 'car',
        vehicle_model: ''
      })
      setAddingVehicle(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const { error } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('user_id', user.id)

      if (error) throw error
      setVehicles(vehicles.filter(v => v.id !== vehicleId))
    } catch (err) {
      setError(err.message)
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'car': return '🚗'
      case 'motorcycle': return '🏍️'
      case 'bicycle': return '🚲'
      case 'truck': return '🚚'
      default: return '🚗'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.full_name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {profile.full_name || 'Add your name'}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role || 'user'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      placeholder="Enter your full name"
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member_since">Member Since</Label>
                  <Input
                    id="member_since"
                    value={new Date(profile.created_at || user.created_at).toLocaleDateString()}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type</span>
                <Badge>{profile.role || 'user'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicles</span>
                <span className="font-semibold">{vehicles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vehicles Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Manage your registered vehicles</CardDescription>
            </div>
            <Button
              onClick={() => setAddingVehicle(true)}
              disabled={addingVehicle}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Vehicle Form */}
          {addingVehicle && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-semibold mb-3">Add New Vehicle</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vehicle_number">Vehicle Number</Label>
                  <Input
                    id="vehicle_number"
                    value={newVehicle.vehicle_number}
                    onChange={(e) => setNewVehicle({...newVehicle, vehicle_number: e.target.value.toUpperCase()})}
                    placeholder="e.g., KA01AB1234"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_type">Type</Label>
                  <select
                    id="vehicle_type"
                    value={newVehicle.vehicle_type}
                    onChange={(e) => setNewVehicle({...newVehicle, vehicle_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="vehicle_model">Model (Optional)</Label>
                  <Input
                    id="vehicle_model"
                    value={newVehicle.vehicle_model}
                    onChange={(e) => setNewVehicle({...newVehicle, vehicle_model: e.target.value})}
                    placeholder="e.g., Honda City"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleAddVehicle} size="sm">
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingVehicle(false)
                    setNewVehicle({ vehicle_number: '', vehicle_type: 'car', vehicle_model: '' })
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vehicles registered</p>
              <p className="text-sm text-gray-400">Add your first vehicle to start booking parking slots</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getVehicleIcon(vehicle.vehicle_type)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{vehicle.vehicle_number}</p>
                        <p className="text-muted-foreground capitalize">{vehicle.vehicle_type}</p>
                        {vehicle.vehicle_model && (
                          <p className="text-sm text-gray-600">{vehicle.vehicle_model}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
