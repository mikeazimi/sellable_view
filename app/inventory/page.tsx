'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Download, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AuthManager } from '@/lib/auth-manager'
import { CustomerManager } from '@/lib/customer-manager'

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
  type: string
}

type SortField = 'warehouse' | 'location' | 'sku' | 'productName' | 'quantity' | 'zone'

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [flatInventory, setFlatInventory] = useState<FlatInventoryItem[]>([])
  const [sortField, setSortField] = useState<SortField>('warehouse')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    setIsAuthenticated(AuthManager.isAuthenticated())
    setSelectedCustomer(CustomerManager.getSelectedCustomer())
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

    const customerAccountId = CustomerManager.getCustomerAccountId()
    
    if (!customerAccountId) {
      toast({
        title: 'Customer account required',
        description: 'Please select a customer account in Settings first',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🚀 Loading ALL inventory - frontend pagination')
      
      const allItems: FlatInventoryItem[] = []
      let hasNextPage = true
      let cursor: string | null = null
      let pageCount = 0

      while (hasNextPage && pageCount < 200) {
        pageCount++
        
        // Build URL with cursor for pagination
        const url = `/api/shiphero/inventory?customer_account_id=${encodeURIComponent(customerAccountId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
        
        console.log(`📄 Fetching page ${pageCount}...`)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Page', pageCount, 'error:', errorData)
          
          if (response.status === 401) {
            AuthManager.clearAuth()
            setIsAuthenticated(false)
            throw new Error('Authentication expired')
          }
          
          throw new Error(errorData.error || `Error on page ${pageCount}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to load page')
        }

        // Process page data
        const pageData = result.data?.warehouse_products?.data
        const edges = pageData?.edges || []
        
        console.log(`✅ Page ${pageCount}: ${edges.length} products, complexity: ${result.meta?.complexity}`)

        // Transform products to flat items
        edges.forEach(({ node: product }: any) => {
          const locationEdges = product.locations?.edges || []
          
          locationEdges.forEach(({ node: itemLoc }: any) => {
            if (itemLoc.quantity > 0) {
              allItems.push({
                sku: product.sku,
                productName: product.product?.name || product.sku,
                quantity: itemLoc.quantity,
                location: itemLoc.location?.name || 'Unknown',
                zone: itemLoc.location?.name?.split('-')[0] || 'Zone',
                pickable: itemLoc.location?.pickable || false,
                sellable: itemLoc.location?.sellable || false,
                warehouse: product.warehouse_identifier,
                type: 'Bin',
                barcode: product.product?.barcode || ''
              })
            }
          })
        })

        // Update UI immediately with current data - user sees results right away!
        setFlatInventory([...allItems])

        hasNextPage = pageData?.pageInfo?.hasNextPage || false
        cursor = pageData?.pageInfo?.endCursor || null

        // Pause between pages for credit conservation
        if (hasNextPage) {
          // Always 2 second base pause
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Additional 5 second pause every 10 pages
          if (pageCount % 10 === 0) {
            console.log(`⏸️  Extended pause after page ${pageCount} (+5 seconds)...`)
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }
      }

      console.log(`🎉 Complete! ${allItems.length} items from ${pageCount} pages`)
      
      toast({
        title: 'Inventory loaded',
        description: `${allItems.length} items loaded from ${pageCount} pages`,
      })

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
            {selectedCustomer && (
              <span className="inline-flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {selectedCustomer.name}
                </Badge>
              </span>
            )}
            {flatInventory.length > 0 && ` ${flatInventory.length} items`}
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

      {isLoading && flatInventory.length > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Loading more data... ({flatInventory.length} items loaded so far)
          </p>
        </div>
      )}

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
      ) : flatInventory.length === 0 && !isLoading ? (
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
      ) : flatInventory.length === 0 && isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600 text-lg">Starting to load inventory...</p>
            <p className="text-sm text-gray-500 mt-2">Data will appear shortly</p>
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
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('productName')}>
                        Item {getSortIcon('productName')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('warehouse')}>
                        Warehouse {getSortIcon('warehouse')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('location')}>
                        Location {getSortIcon('location')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('quantity')}>
                        Units {getSortIcon('quantity')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-center">Pickable</th>
                    <th className="px-4 py-3 text-center">Sellable</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {flatInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-gray-500 font-mono">SKU {item.sku}</div>
                      </td>
                      <td className="px-4 py-3">{item.warehouse}</td>
                      <td className="px-4 py-3">DONNI. HQ</td>
                      <td className="px-4 py-3 font-mono text-sm">{item.location}</td>
                      <td className="px-4 py-3 text-sm">{item.type}</td>
                      <td className="px-4 py-3 font-semibold text-lg">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        {item.pickable && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.sellable && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30">
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          </span>
                        )}
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
