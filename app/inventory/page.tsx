'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

type SortField = 'warehouse' | 'location' | 'sku' | 'productName' | 'quantity' | 'zone' | 'pickable' | 'sellable'

interface ColumnFilters {
  productName: boolean
  warehouse: boolean
  location: boolean
  pickable: boolean
  sellable: boolean
}

interface StatusFilter {
  sellable: 'all' | 'sellable' | 'non-sellable'
  pickable: 'all' | 'pickable' | 'non-pickable'
}

interface InventorySummary {
  totalSkus: number
  totalQtySellable: number
  totalQtyNonSellable: number
  skusNonSellable: number
}

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [flatInventory, setFlatInventory] = useState<FlatInventoryItem[]>([])
  const [sortField, setSortField] = useState<SortField>('warehouse')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerAccountId, setCustomerAccountId] = useState('')
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    productName: true,
    warehouse: true,
    location: true,
    pickable: true,
    sellable: true,
  })
  const [statusFilters, setStatusFilters] = useState<StatusFilter>({
    sellable: 'all',
    pickable: 'all'
  })
  const [preLoadFilters, setPreLoadFilters] = useState<StatusFilter>({
    sellable: 'all',
    pickable: 'all'
  })
  const { toast } = useToast()

  // Apply status filters FIRST
  const filteredInventory = flatInventory.filter(item => {
    if (statusFilters.sellable === 'sellable' && !item.sellable) return false
    if (statusFilters.sellable === 'non-sellable' && item.sellable) return false
    if (statusFilters.pickable === 'pickable' && !item.pickable) return false
    if (statusFilters.pickable === 'non-pickable' && item.pickable) return false
    return true
  })

  // Calculate real-time summaries based on filtered data
  const summary: InventorySummary = {
    totalSkus: new Set(filteredInventory.map(item => item.sku)).size,
    totalQtySellable: filteredInventory.filter(item => item.sellable).reduce((sum, item) => sum + item.quantity, 0),
    totalQtyNonSellable: filteredInventory.filter(item => !item.sellable).reduce((sum, item) => sum + item.quantity, 0),
    skusNonSellable: new Set(filteredInventory.filter(item => !item.sellable).map(item => item.sku)).size,
  }

  useEffect(() => {
    const authenticated = AuthManager.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    // Load saved customer if exists
    const savedCustomer = CustomerManager.getSelectedCustomer()
    if (savedCustomer) {
      setSelectedCustomer(savedCustomer)
      setCustomerAccountId(savedCustomer.id)
    }
    
    // Load available customers if authenticated
    if (authenticated) {
      loadAvailableCustomers()
    }
  }, [])

  const loadAvailableCustomers = async () => {
    const accessToken = AuthManager.getValidToken()
    if (!accessToken) return

    try {
      const response = await fetch('/api/shiphero/customers', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAvailableCustomers(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    setCustomerAccountId(customerId)
    const customer = availableCustomers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      CustomerManager.saveCustomer(customer)
    }
  }

  const toggleColumn = (column: keyof ColumnFilters) => {
    setColumnFilters(prev => ({ ...prev, [column]: !prev[column] }))
  }

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

    if (!customerAccountId) {
      toast({
        title: 'Customer account required',
        description: 'Please select a customer account from the dropdown',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Auto-convert legacy ID to UUID if just a number
      let accountIdToUse = customerAccountId.trim()
      
      if (/^\d+$/.test(accountIdToUse)) {
        accountIdToUse = btoa(`CustomerAccount:${accountIdToUse}`)
        console.log(`Converted ${customerAccountId} to UUID: ${accountIdToUse}`)
      }
      
      console.log('🚀 Loading from Supabase cache (NOT ShipHero!)')
      
      // Try Supabase first
      const supabaseParams = new URLSearchParams({
        customer_account_id: accountIdToUse,
        sellable: preLoadFilters.sellable,
        pickable: preLoadFilters.pickable
      })
      
      const supabaseResponse = await fetch(`/api/inventory/supabase?${supabaseParams.toString()}`)
      const supabaseResult = await supabaseResponse.json()
      
      if (supabaseResult.success) {
        // SUCCESS - Got data from Supabase!
        console.log(`✅ Loaded ${supabaseResult.data.length} records from Supabase (instant!)`)
        
        setFlatInventory(supabaseResult.data)
        
        toast({
          title: 'Inventory loaded from cache',
          description: `${supabaseResult.data.length} records loaded instantly from Supabase`,
        })
        
        return // Done - no ShipHero query needed!
      }
      
      if (supabaseResult.empty_database) {
        // Database is empty - show error
        throw new Error('No inventory data cached. Please run snapshot sync in Admin page first.')
      }
      
      // If we get here, there was an error - fall through to ShipHero query as backup
      console.warn('Supabase query failed, falling back to ShipHero:', supabaseResult.error)
      console.log('🔄 Falling back to real-time ShipHero query...')
      
      // Step 1: Get filtered location names from Supabase (INSTANT!)
      let allowedLocations: Set<string> | null = null
      
      if (preLoadFilters.sellable !== 'all' || preLoadFilters.pickable !== 'all') {
        console.log('📦 Querying Supabase for filtered locations...')
        
        const filterParams = new URLSearchParams({
          sellable: preLoadFilters.sellable,
          pickable: preLoadFilters.pickable
        })
        
        const locResponse = await fetch(`/api/locations/filter?${filterParams.toString()}`)
        const locResult = await locResponse.json()
        
        if (locResult.success) {
          allowedLocations = new Set(locResult.locationNames)
          console.log(`✅ Supabase returned ${allowedLocations.size} matching locations (instant!)`)
          
          toast({
            title: 'Filter applied',
            description: `Loading inventory for ${allowedLocations.size} ${preLoadFilters.sellable} locations`,
          })
        }
      }
      
      // Step 2: Query ShipHero
      const allItems: FlatInventoryItem[] = []
      let hasNextPage = true
      let cursor: string | null = null
      let pageCount = 0

      while (hasNextPage && pageCount < 50) {
        pageCount++
        
        const filterParams = new URLSearchParams({
          customer_account_id: accountIdToUse,
          filter_sellable: preLoadFilters.sellable,
          filter_pickable: preLoadFilters.pickable,
          ...(cursor && { cursor })
        })
        
        const url = `/api/shiphero/inventory?${filterParams.toString()}`
        
        console.log(`📄 Page ${pageCount}`)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Error:', errorData)
          throw new Error(errorData.error || 'Failed to load')
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed')
        }

        // Process warehouse_products data (correct structure)
        const warehouseData = result.data?.warehouse_products?.data
        const productEdges = warehouseData?.edges || []
        
        console.log(`✅ Page ${pageCount}: ${productEdges.length} products, complexity: ${result.meta?.complexity}`)

        // Transform each product and its locations
        productEdges.forEach(({ node: product }: any) => {
          const locationEdges = product.locations?.edges || []
          
          locationEdges.forEach(({ node: locationData }: any) => {
            // If we have filtered locations from Supabase, only include those
            if (allowedLocations && !allowedLocations.has(locationData.location?.name)) {
              return // Skip this location - not in our filtered set
            }
            
            if (locationData.quantity > 0) {
              allItems.push({
                sku: product.sku,
                productName: product.product?.name || product.sku,
                quantity: locationData.quantity,
                location: locationData.location?.name || 'Unknown',
                zone: locationData.location?.name?.split('-')[0] || 'Zone',
                pickable: locationData.location?.pickable || false,
                sellable: locationData.location?.sellable || false,
                warehouse: product.warehouse_identifier,
                type: 'Bin',
                barcode: ''
              })
            }
          })
        })

        setFlatInventory([...allItems])

        hasNextPage = warehouseData?.pageInfo?.hasNextPage || false
        cursor = warehouseData?.pageInfo?.endCursor || null

        if (hasNextPage) {
          // Optimal pause strategy for credit conservation
          if (pageCount % 5 === 0) {
            // Every 5th page: 3 second pause
            console.log(`⏸️  Extended pause after page ${pageCount} (3s)...`)
            await new Promise(resolve => setTimeout(resolve, 3000))
          } else {
            // Regular: 1 second pause
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      console.log(`🎉 Complete! ${allItems.length} records from ${pageCount} pages`)
      
      toast({
        title: 'Inventory loaded',
        description: `${items.length} records loaded`,
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
      } else if (field === 'pickable' || field === 'sellable') {
        // Sort boolean fields
        aVal = a[field] ? 1 : 0
        bVal = b[field] ? 1 : 0
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
            Inventory Summary
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCustomer && (
              <span className="inline-flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {selectedCustomer.name}
                </Badge>
              </span>
            )}
            {flatInventory.length > 0 && ` ${filteredInventory.length} records`}
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

      {/* Summary Stats */}
      {flatInventory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Total SKUs</div>
              <div className="text-2xl font-bold">{summary.totalSkus}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Qty Sellable</div>
              <div className="text-2xl font-bold text-green-600">{summary.totalQtySellable}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">Qty Non-Sellable</div>
              <div className="text-2xl font-bold text-amber-600">{summary.totalQtyNonSellable}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">SKUs Non-Sellable</div>
              <div className="text-2xl font-bold text-amber-600">{summary.skusNonSellable}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Filters */}
      {flatInventory.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sellable:</span>
                <select
                  value={statusFilters.sellable}
                  onChange={(e) => setStatusFilters(prev => ({ ...prev, sellable: e.target.value as any }))}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All</option>
                  <option value="sellable">Sellable Only</option>
                  <option value="non-sellable">Non-Sellable Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Pickable:</span>
                <select
                  value={statusFilters.pickable}
                  onChange={(e) => setStatusFilters(prev => ({ ...prev, pickable: e.target.value as any }))}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All</option>
                  <option value="pickable">Pickable Only</option>
                  <option value="non-pickable">Non-Pickable Only</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredInventory.length} of {flatInventory.length} records
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      {isAuthenticated && flatInventory.length === 0 && !isLoading && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            {/* Customer Account ID Input */}
            <div>
              <h3 className="font-semibold mb-2">Customer Account ID</h3>
              <p className="text-sm text-gray-500 mb-3">Enter the account ID number (e.g., 88774 for Donni HQ)</p>
              <Input
                type="text"
                value={customerAccountId}
                onChange={(e) => setCustomerAccountId(e.target.value)}
                placeholder="88774"
                className="w-full md:w-96"
              />
              <p className="text-xs text-gray-500 mt-2">
                Just type the numeric ID - we'll handle the conversion automatically
              </p>
            </div>

            {/* Pre-Load Data Filters */}
            <div>
              <h3 className="font-semibold mb-2">Data Filters (Apply Before Loading)</h3>
              <p className="text-sm text-gray-500 mb-3">Filter data at the source - loads much faster!</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sellable:</span>
                  <select
                    value={preLoadFilters.sellable}
                    onChange={(e) => setPreLoadFilters(prev => ({ ...prev, sellable: e.target.value as any }))}
                    className="px-3 py-1.5 border rounded text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="sellable">Sellable Only</option>
                    <option value="non-sellable">Non-Sellable Only</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pickable:</span>
                  <select
                    value={preLoadFilters.pickable}
                    onChange={(e) => setPreLoadFilters(prev => ({ ...prev, pickable: e.target.value as any }))}
                    className="px-3 py-1.5 border rounded text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="pickable">Pickable Only</option>
                    <option value="non-pickable">Non-Pickable Only</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                These filters reduce the amount of data fetched - much faster loading!
              </p>
            </div>

            {/* Column Filters */}
            <div>
              <h3 className="font-semibold mb-2">Select Columns to Load</h3>
              <p className="text-sm text-gray-500 mb-3">Choose which data to fetch - fewer columns = faster loading</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilters.productName}
                  onChange={() => toggleColumn('productName')}
                  className="rounded"
                />
                <span className="text-sm">Product Name</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilters.warehouse}
                  onChange={() => toggleColumn('warehouse')}
                  className="rounded"
                />
                <span className="text-sm">Warehouse</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilters.location}
                  onChange={() => toggleColumn('location')}
                  className="rounded"
                />
                <span className="text-sm">Bin Location</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilters.pickable}
                  onChange={() => toggleColumn('pickable')}
                  className="rounded"
                />
                <span className="text-sm">Pickable Status</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilters.sellable}
                  onChange={() => toggleColumn('sellable')}
                  className="rounded"
                />
                <span className="text-sm">Sellable Status</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: SKU, Quantity, and Type are always included
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && flatInventory.length > 0 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Loading page {loadingPage}...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {flatInventory.length} records loaded so far
              </p>
            </div>
          </div>
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
                    <th className="px-4 py-3 text-center">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('pickable')}>
                        Pickable {getSortIcon('pickable')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent" onClick={() => sortData('sellable')}>
                        Sellable {getSortIcon('sellable')}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventory.map((item, idx) => (
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
                        <span className={item.pickable ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {item.pickable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={item.sellable ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                          {item.sellable ? 'Yes' : 'No'}
                        </span>
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
