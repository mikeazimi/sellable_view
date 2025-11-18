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

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [customerAccountId, setCustomerAccountId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [locationsData, setLocationsData] = useState<LocationData[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [loadDuration, setLoadDuration] = useState<number>(0)
  const { toast } = useToast()

  const loadLocations = async () => {
    if (!customerAccountId.trim()) {
      toast({
        title: 'Customer Account ID Required',
        description: 'Please enter a customer account ID to query locations',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setLoadingProgress('Initializing query...')
    setLocationsData([]) // Clear previous results
    
    const startTime = Date.now()
    
    try {
      const params = new URLSearchParams({
        customer_account_id: customerAccountId.trim(),
      })
      
      if (warehouseId.trim()) {
        params.append('warehouse_id', warehouseId.trim())
      }

      setLoadingProgress('Fetching all bin locations (this may take a moment)...')

      const response = await fetch(`/api/shiphero/locations?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch locations')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch locations')
      }

      const duration = Date.now() - startTime
      setLoadDuration(duration)
      setLocationsData(result.data)
      
      toast({
        title: '✓ Locations loaded successfully',
        description: `Found ${result.meta.total_locations} locations with ${result.meta.total_skus} SKUs and ${result.meta.total_units} total units (loaded in ${(duration / 1000).toFixed(1)}s)`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load locations. Please check your customer account ID.',
        variant: 'destructive',
      })
      setLocationsData([])
    } finally {
      setIsLoading(false)
      setLoadingProgress('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadLocations()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-balance">
            Bin Location Inventory
          </h1>
          <p className="text-muted-foreground text-lg text-balance">
            View all bin locations with their inventory, including SKUs, quantities, and status
          </p>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Query Locations
            </CardTitle>
            <CardDescription>
              Enter a customer account ID to view their bin locations and inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-id">
                  Customer Account ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer-id"
                  placeholder="e.g., Q3VzdG9tZXJBY2NvdW50OjEyMzQ1"
                  value={customerAccountId}
                  onChange={(e) => setCustomerAccountId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  UUID format (base64 encoded customer account ID)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-id">
                  Warehouse ID <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="warehouse-id"
                  placeholder="Filter by warehouse ID"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to query all warehouses
                </p>
              </div>
            </div>
            <Button 
              onClick={loadLocations} 
              disabled={isLoading || !customerAccountId.trim()}
              size="lg"
              className="w-full md:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading Locations...' : 'Query Bin Locations'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground text-lg mb-2">
                Loading bin locations...
              </p>
              {loadingProgress && (
                <p className="text-sm text-muted-foreground">
                  {loadingProgress}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Using pagination to fetch all data safely
              </p>
            </CardContent>
          </Card>
        ) : hasSearched && locationsData.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Warehouse className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                No locations found
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different customer account ID or check if there's inventory in the account
              </p>
            </CardContent>
          </Card>
        ) : hasSearched ? (
          <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{locationsData.length}</p>
                    <p className="text-sm text-muted-foreground">Total Locations</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {locationsData.reduce((sum, loc) => sum + loc.products.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique SKUs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {locationsData.reduce((sum, loc) => sum + loc.totalItems, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Units</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {locationsData.filter(loc => loc.pickable).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Pickable</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {locationsData.filter(loc => loc.sellable).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Sellable</p>
                  </div>
                </div>
                {loadDuration > 0 && (
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Loaded in {(loadDuration / 1000).toFixed(1)}s via paginated queries
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location Cards */}
            <div className="grid grid-cols-1 gap-4">
              {locationsData.map((location) => (
                <Card key={location.locationId} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <MapPin className="w-5 h-5" />
                          {location.locationName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Zone: {location.zone} • {location.products.length} SKU(s) • {location.totalItems} units
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={location.pickable ? 'default' : 'secondary'}>
                          {location.pickable ? '✓ Pickable' : '✗ Not Pickable'}
                        </Badge>
                        <Badge variant={location.sellable ? 'default' : 'secondary'}>
                          {location.sellable ? '✓ Sellable' : '✗ Not Sellable'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {location.products.map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
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
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                Enter a Customer Account ID to get started
              </p>
              <p className="text-sm text-muted-foreground">
                You can find customer account IDs in your ShipHero 3PL dashboard
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
