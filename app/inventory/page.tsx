'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Download, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AuthManager } from '@/lib/auth-manager'

interface FlatInventoryItem {
  warehouse: string
  location: string
  zone: string
  pickable: boolean
  sellable: boolean
  sku: string
  productName: string
  quantity: number
  barcode?: string
}

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')
  const [flatInventory, setFlatInventory] = useState<FlatInventoryItem[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsAuthenticated(AuthManager.isAuthenticated())
  }, [])

  const loadInventory = async () => {
    setIsLoading(true)
    setLoadingProgress('Initializing query...')
    
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
      setLoadingProgress('Fetching all bin locations (this may take a moment)...')
      const locationsResponse = await fetch('/api/shiphero/locations')

      if (!locationsResponse.ok) {
        const error = await locationsResponse.json()
        throw new Error(error.error || 'Failed to fetch locations')
      }

      const locationsResult = await locationsResponse.json()
      
      if (!locationsResult.success) {
        throw new Error(locationsResult.error || 'Failed to fetch locations')
      }

      // Create warehouse lookup
      const warehouseMap = new Map<string, WarehouseData>()
      warehousesResult.data.forEach((warehouse: WarehouseData) => {
        warehouseMap.set(warehouse.id, warehouse)
      })

      // Flatten data for table view
      const flatData: FlatInventoryItem[] = []
      locationsResult.data.forEach((location: LocationData) => {
        const warehouse = warehouseMap.get(location.warehouseId)
        location.products.forEach((product: LocationProduct) => {
          flatData.push({
            warehouse: warehouse?.identifier || 'Unknown',
            warehouseId: location.warehouseId,
            location: location.locationName,
            locationId: location.locationId,
            zone: location.zone,
            pickable: location.pickable,
            sellable: location.sellable,
            sku: product.sku,
            productName: product.productName,
            quantity: product.quantity,
            barcode: product.barcode,
          })
        })
      })

      const duration = Date.now() - startTime
      setLoadDuration(duration)
      setFlatInventory(flatData)
      
      toast({
        title: 'Inventory loaded',
        description: `${flatData.length} inventory items loaded in ${(duration / 1000).toFixed(1)}s`,
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
      setFlatInventory([])
    } finally {
      setIsLoading(false)
      setLoadingProgress('')
    }
  }

  const sortData = (field: SortField) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...flatInventory].sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]

      if (field === 'quantity') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      } else {
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
      }

      if (direction === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    setFlatInventory(sorted)
  }

  const exportToCSV = () => {
    const headers = [
      'Warehouse',
      'Location',
      'Zone',
      'SKU',
      'Product Name',
      'Quantity',
      'Pickable',
      'Sellable',
      'Barcode'
    ]

    const csvContent = [
      headers.join(','),
      ...flatInventory.map(item => [
        `"${item.warehouse}"`,
        `"${item.location}"`,
        `"${item.zone}"`,
        `"${item.sku}"`,
        `"${item.productName}"`,
        item.quantity,
        item.pickable ? 'Yes' : 'No',
        item.sellable ? 'Yes' : 'No',
        `"${item.barcode || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: 'Export complete',
      description: `Exported ${flatInventory.length} inventory items to CSV`,
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Inventory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {flatInventory.length > 0 && `${flatInventory.length} items across all warehouses`}
          </p>
        </div>
        <div className="flex gap-2">
          {flatInventory.length > 0 && (
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Button 
            onClick={loadInventory} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

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
          </CardContent>
        </Card>
      ) : flatInventory.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-2">
              No inventory found
            </p>
            <p className="text-sm text-muted-foreground">
              Check authentication in Settings or verify account has inventory
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('warehouse')}
                      >
                        Warehouse {getSortIcon('warehouse')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('location')}
                      >
                        Location {getSortIcon('location')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('zone')}
                      >
                        Zone {getSortIcon('zone')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('sku')}
                      >
                        SKU {getSortIcon('sku')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('productName')}
                      >
                        Product {getSortIcon('productName')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-gray-900 dark:text-gray-100 hover:bg-transparent"
                        onClick={() => sortData('quantity')}
                      >
                        Quantity {getSortIcon('quantity')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {flatInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.warehouse}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{item.location}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{item.zone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{item.productName}</div>
                        {item.barcode && (
                          <div className="text-xs text-gray-500 font-mono">{item.barcode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-lg">{item.quantity}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Badge 
                            variant={item.pickable ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.pickable ? 'P' : '—'}
                          </Badge>
                          <Badge 
                            variant={item.sellable ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.sellable ? 'S' : '—'}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
