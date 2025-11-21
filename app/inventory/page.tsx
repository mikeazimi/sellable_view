'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Package, MapPin, Search, Warehouse } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface LocationProduct {
  sku: string
  productName: string
  quantity: number
  barcode?: string
}

interface LocationData {
  locationId: string
  legacyId: number
  locationName: string
  locationNameRaw: string
  zone: string
  pickable: boolean
  sellable: boolean
  warehouseId: string
  products: LocationProduct[]
  totalItems: number
}

interface WarehouseData {
  id: string
  legacyId: number
  identifier: string
  name: string
  address: {
    name: string
    city: string
    state: string
    country: string
  }
}

interface CombinedInventoryData {
  warehouses: WarehouseData[]
  locations: LocationData[]
  locationsByWarehouse: Map<string, LocationData[]>
}

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [inventoryData, setInventoryData] = useState<CombinedInventoryData | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [loadDuration, setLoadDuration] = useState<number>(0)
  const { toast } = useToast()

  const loadInventory = async () => {
    setIsLoading(true)
    setHasSearched(true)
    setLoadingProgress('Initializing query...')
    setInventoryData(null) // Clear previous results
    
    const startTime = Date.now()
    
    try {
      // Load warehouses first
      setLoadingProgress('Loading warehouses...')
      const warehousesResponse = await fetch('/api/shiphero/warehouses')
      
      if (!warehousesResponse.ok) {
        const error = await warehousesResponse.json()
        throw new Error(error.error || 'Failed to fetch warehouses')
      }

      const warehousesResult = await warehousesResponse.json()
      if (!warehousesResult.success) {
        throw new Error(warehousesResult.error || 'Failed to fetch warehouses')
      }

      // Load locations
      const params = new URLSearchParams()
      if (warehouseId.trim()) {
        params.append('warehouse_id', warehouseId.trim())
      }

      setLoadingProgress('Fetching all bin locations (this may take a moment)...')
      const locationsResponse = await fetch(`/api/shiphero/locations?${params.toString()}`)

      if (!locationsResponse.ok) {
        const error = await locationsResponse.json()
        throw new Error(error.error || 'Failed to fetch locations')
      }

      const locationsResult = await locationsResponse.json()
      
      if (!locationsResult.success) {
        throw new Error(locationsResult.error || 'Failed to fetch locations')
      }

      // Group locations by warehouse
      const locationsByWarehouse = new Map<string, LocationData[]>()
      locationsResult.data.forEach((location: LocationData) => {
        const warehouseKey = location.warehouseId
        if (!locationsByWarehouse.has(warehouseKey)) {
          locationsByWarehouse.set(warehouseKey, [])
        }
        locationsByWarehouse.get(warehouseKey)!.push(location)
      })

      const duration = Date.now() - startTime
      setLoadDuration(duration)
      
      setInventoryData({
        warehouses: warehousesResult.data,
        locations: locationsResult.data,
        locationsByWarehouse
      })
      
      toast({
        title: 'Inventory loaded successfully',
        description: `Found ${warehousesResult.data.length} warehouses, ${locationsResult.meta.total_locations} locations with ${locationsResult.meta.total_skus} SKUs (loaded in ${(duration / 1000).toFixed(1)}s)`,
      })
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to load inventory'
      if (error.message?.includes('Authentication') || error.message?.includes('token')) {
        errorMessage = 'Please configure authentication in Settings first'
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      setInventoryData(null)
    } finally {
      setIsLoading(false)
      setLoadingProgress('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadInventory()
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Inventory
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Query bin locations by customer account ID
        </p>
      </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Load Inventory Locations
            </CardTitle>
            <CardDescription>
              View all bin locations and inventory for your authenticated account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse-id">
                  Warehouse ID <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="warehouse-id"
                  placeholder="Filter by specific warehouse"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to query all warehouses
                </p>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={loadInventory} 
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading Inventory...' : 'Load All Inventory'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground text-lg mb-2">
                Loading inventory...
              </p>
              {loadingProgress && (
                <p className="text-sm text-muted-foreground">
                  {loadingProgress}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Loading warehouses and locations with pagination
              </p>
            </CardContent>
          </Card>
        ) : hasSearched && (!inventoryData || (inventoryData.warehouses.length === 0 && inventoryData.locations.length === 0)) ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Warehouse className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                No inventory found
              </p>
              <p className="text-sm text-muted-foreground">
                Check if there's inventory in your account or verify authentication in Settings
              </p>
            </CardContent>
          </Card>
        ) : hasSearched && inventoryData ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{inventoryData.warehouses.length}</p>
                    <p className="text-sm text-muted-foreground">Warehouses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inventoryData.locations.length}</p>
                    <p className="text-sm text-muted-foreground">Locations</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {inventoryData.locations.reduce((sum, loc) => sum + loc.products.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique SKUs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {inventoryData.locations.reduce((sum, loc) => sum + loc.totalItems, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {inventoryData.locations.filter(loc => loc.pickable).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Pickable</p>
                  </div>
                </div>
                {loadDuration > 0 && (
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Loaded in {(loadDuration / 1000).toFixed(1)}s via paginated queries
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Warehouses with Locations */}
            {inventoryData.warehouses.map((warehouse) => {
              const warehouseLocations = inventoryData.locationsByWarehouse.get(warehouse.id) || []
              const totalWarehouseItems = warehouseLocations.reduce((sum, loc) => sum + loc.totalItems, 0)
              
              return (
                <Card key={warehouse.id} className="overflow-hidden">
                  <CardHeader className="bg-blue-50 dark:bg-blue-950/20 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                          <Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          {warehouse.identifier}
                        </CardTitle>
                        <CardDescription className="mt-1 text-base">
                          {warehouse.address.name} • {warehouse.address.city}, {warehouse.address.state}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-1">
                          {warehouseLocations.length} locations • {totalWarehouseItems} total units
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {warehouseLocations.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No locations with inventory in this warehouse
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {warehouseLocations.map((location) => (
                          <Card key={location.locationId} className="border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="w-4 h-4" />
                                    {location.locationName}
                                  </CardTitle>
                                  <CardDescription>
                                    Zone: {location.zone} • {location.products.length} SKU(s) • {location.totalItems} units
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant={location.pickable ? 'default' : 'secondary'} className="text-xs">
                                    {location.pickable ? '✓ Pickable' : '✗ Not Pickable'}
                                  </Badge>
                                  <Badge variant={location.sellable ? 'default' : 'secondary'} className="text-xs">
                                    {location.sellable ? '✓ Sellable' : '✗ Not Sellable'}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <div className="space-y-2">
                                {location.products.map((product, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50"
                                  >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">SKU</p>
                                        <p className="font-mono font-semibold">{product.sku}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Product Name</p>
                                        <p className="font-medium">{product.productName}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                                        <p className="font-semibold text-lg">{product.quantity}</p>
                                      </div>
                                    </div>
                                    {product.barcode && (
                                      <div className="ml-4">
                                        <p className="text-xs text-muted-foreground mb-1">Barcode</p>
                                        <p className="font-mono text-sm">{product.barcode}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                Ready to load inventory locations
              </p>
              <p className="text-sm text-muted-foreground">
                Click "Load All Inventory" to view warehouses and bin locations
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
