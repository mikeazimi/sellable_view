'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Download, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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

type SortField = 'warehouse' | 'location' | 'sku' | 'productName' | 'quantity' | 'zone'

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [flatInventory, setFlatInventory] = useState<FlatInventoryItem[]>([])
  const [sortField, setSortField] = useState<SortField>('warehouse')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsAuthenticated(AuthManager.isAuthenticated())
  }, [])

  const loadInventory = async () => {
    const accessToken = AuthManager.getValidToken()
    if (!accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please authenticate in Settings first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🚀 Making DIRECT ShipHero API call...')
      
      // DIRECT call to ShipHero API - NO server middleman
      const response = await fetch('https://public-api.shiphero.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          query: `
            query GetAllInventory {
              warehouse_products(first: 250) {
                request_id
                complexity
                data {
                  edges {
                    node {
                      sku
                      warehouse_identifier
                      inventory_bin
                      on_hand
                      active
                      product {
                        name
                        barcode
                      }
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
          `
        })
      })

      console.log('✅ ShipHero responded:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        
        if (response.status === 401) {
          AuthManager.clearAuth()
          setIsAuthenticated(false)
          throw new Error('Token expired - please re-authenticate in Settings')
        }
        
        throw new Error(`API error ${response.status}`)
      }

      const result = await response.json()
      console.log('📦 Data received:', result.data?.warehouse_products?.data?.edges?.length || 0, 'products')

      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors)
        throw new Error(result.errors[0].message)
      }

      if (!result.data?.warehouse_products?.data?.edges) {
        throw new Error('No data returned from ShipHero')
      }

      // Transform to flat table data
      const flatData: FlatInventoryItem[] = result.data.warehouse_products.data.edges
        .map(({ node }: any) => ({
          warehouse: node.warehouse_identifier || 'Unknown',
          location: node.inventory_bin || 'Unassigned',
          zone: (node.inventory_bin || 'U').split('-')[0],
          pickable: node.active !== false,
          sellable: node.active !== false,
          sku: node.sku,
          productName: node.product?.name || node.sku,
          quantity: node.on_hand,
          barcode: node.product?.barcode,
        }))
        .filter((item: FlatInventoryItem) => item.quantity > 0)

      setFlatInventory(flatData)
      
      toast({
        title: 'Inventory loaded',
        description: `${flatData.length} items loaded`,
      })

      console.log('🎉 SUCCESS! Loaded', flatData.length, 'items')

    } catch (error: any) {
      console.error('💥 Error:', error)
      
      if (error.message?.includes('401') || error.message?.includes('expired')) {
        AuthManager.clearAuth()
        setIsAuthenticated(false)
      }
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to load inventory',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sortData = (field: SortField) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(direction)

    const sorted = [...flatInventory].sort((a, b) => {
      let aVal: any = a[field]
      let bVal: any = b[field]

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
    const headers = ['Warehouse', 'Location', 'Zone', 'SKU', 'Product', 'Quantity', 'Pickable', 'Sellable', 'Barcode']
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
      description: `Exported ${flatInventory.length} items`,
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1" />
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
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
          {isAuthenticated && (
            <Button onClick={loadInventory} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh Data'}
            </Button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <Card className="border-amber-200 bg-amber-50/20 dark:bg-amber-950/20">
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <p className="text-amber-800 dark:text-amber-200 text-lg mb-4">
              Authentication Required
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Please authenticate in Settings to view inventory
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600 text-lg">Loading inventory...</p>
          </CardContent>
        </Card>
      ) : flatInventory.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg mb-4">Ready to load inventory</p>
            <Button onClick={loadInventory} size="lg">
              <Package className="w-4 h-4 mr-2" />
              Load All Inventory
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('warehouse')}
                      >
                        Warehouse {getSortIcon('warehouse')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('location')}
                      >
                        Location {getSortIcon('location')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('zone')}
                      >
                        Zone {getSortIcon('zone')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('sku')}
                      >
                        SKU {getSortIcon('sku')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('productName')}
                      >
                        Product {getSortIcon('productName')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => sortData('quantity')}
                      >
                        Quantity {getSortIcon('quantity')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flatInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium">{item.warehouse}</td>
                      <td className="px-4 py-3 font-mono text-sm">{item.location}</td>
                      <td className="px-4 py-3 text-sm">{item.zone}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{item.sku}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{item.productName}</div>
                        {item.barcode && (
                          <div className="text-xs text-gray-500 font-mono mt-1">{item.barcode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-lg">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Badge variant={item.pickable ? 'default' : 'secondary'} className="text-xs">
                            {item.pickable ? 'P' : '—'}
                          </Badge>
                          <Badge variant={item.sellable ? 'default' : 'secondary'} className="text-xs">
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
