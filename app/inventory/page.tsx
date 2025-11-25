'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Download, RefreshCw, RotateCw, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react'
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
  type: string
}

type SortField = 'warehouse' | 'location' | 'sku' | 'productName' | 'quantity' | 'zone' | 'pickable' | 'sellable'

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

interface AccountId {
  id: string
  value: string
  name: string
}

export default function InventoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [flatInventory, setFlatInventory] = useState<FlatInventoryItem[]>([])
  const [sortField, setSortField] = useState<SortField>('warehouse')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('88774')
  const [accountIds, setAccountIds] = useState<AccountId[]>([])
  const [statusFilters, setStatusFilters] = useState<StatusFilter>({
    sellable: 'all',
    pickable: 'all'
  })
  const { toast } = useToast()

  useEffect(() => {
    // Check authentication
    const token = AuthManager.getValidToken()
    if (token) {
      setIsAuthenticated(true)
      
      // Load account IDs from settings
      const savedAccounts = localStorage.getItem('account_ids')
      if (savedAccounts) {
        setAccountIds(JSON.parse(savedAccounts))
      } else {
        // Default account
        setAccountIds([{
          id: '1',
          value: '88774',
          name: 'Donni HQ'
        }])
      }
      
      // Auto-load from Supabase
      loadFromSupabase()
    }
  }, [])

  // Apply status filters
  const filteredInventory = flatInventory.filter(item => {
    if (statusFilters.sellable === 'sellable' && !item.sellable) return false
    if (statusFilters.sellable === 'non-sellable' && item.sellable) return false
    if (statusFilters.pickable === 'pickable' && !item.pickable) return false
    if (statusFilters.pickable === 'non-pickable' && item.pickable) return false
    return true
  })

  // Calculate summaries
  const summary: InventorySummary = {
    totalSkus: new Set(filteredInventory.map(item => item.sku)).size,
    totalQtySellable: filteredInventory.filter(item => item.sellable).reduce((sum, item) => sum + item.quantity, 0),
    totalQtyNonSellable: filteredInventory.filter(item => !item.sellable).reduce((sum, item) => sum + item.quantity, 0),
    skusNonSellable: new Set(filteredInventory.filter(item => !item.sellable).map(item => item.sku)).size,
  }

  const loadFromSupabase = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        customer_account_id: selectedAccountId,
        sellable: 'all',
        pickable: 'all'
      })
      
      console.log('📦 Loading from Supabase cache...')
      const response = await fetch(`/api/inventory/supabase?${params.toString()}`)
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setFlatInventory(result.data)
        console.log(`✅ Loaded ${result.data.length} records from Supabase`)
        toast({
          title: 'Inventory loaded',
          description: `${result.data.length} records loaded from database`,
        })
      } else {
        setFlatInventory([])
        toast({
          title: 'No cached data',
          description: 'Click "Refresh from ShipHero" or upload data in Seed Data page',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      console.error('Error loading from Supabase:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to load inventory',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshFromShipHero = async () => {
    const accessToken = AuthManager.getValidToken()
    if (!accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please authenticate in Token Access page',
        variant: 'destructive',
      })
      return
    }

    // Start timing
    const startTime = Date.now()
    const startTimestamp = new Date().toLocaleTimeString()
    console.log('⏱️ ============================================')
    console.log(`⏱️ REFRESH STARTED at ${startTimestamp}`)
    console.log('⏱️ ============================================')

    setIsLoading(true)
    try {
      toast({
        title: 'Refreshing from ShipHero',
        description: 'This may take a few minutes...',
      })

      // Query ShipHero and cache results
      const response = await fetch('/api/inventory/cache-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_account_id: selectedAccountId,
          access_token: accessToken
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        // Reload from Supabase to show updated data
        const reloadStart = Date.now()
        console.log(`⏱️ Reloading from Supabase... (${((reloadStart - startTime) / 1000).toFixed(2)}s elapsed)`)
        
        await loadFromSupabase()
        
        const totalTime = Date.now() - startTime
        const endTimestamp = new Date().toLocaleTimeString()
        
        console.log('⏱️ ============================================')
        console.log(`⏱️ REFRESH COMPLETE at ${endTimestamp}`)
        console.log(`⏱️ Total Duration: ${(totalTime / 1000).toFixed(2)} seconds (${(totalTime / 60000).toFixed(2)} minutes)`)
        console.log('⏱️ ============================================')
        
        toast({
          title: 'Refresh complete',
          description: `Updated in ${(totalTime / 1000).toFixed(1)}s`,
        })
      } else {
        throw new Error(result.error || 'Failed to refresh')
      }
    } catch (error: any) {
      const totalTime = Date.now() - startTime
      console.error(`⏱️ Refresh error after ${(totalTime / 1000).toFixed(2)}s:`, error)
      toast({
        title: 'Refresh failed',
        description: error.message,
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
      ...filteredInventory.map(item => [
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
      description: `Exported ${filteredInventory.length} items`,
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1" />
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />
  }

  const getSelectedAccountName = () => {
    const account = accountIds.find(a => a.value === selectedAccountId)
    return account ? account.name : `Account ${selectedAccountId}`
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Actions */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Item Locations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getSelectedAccountName()} ({selectedAccountId})
            {flatInventory.length > 0 && ` • ${filteredInventory.length.toLocaleString()} items`}
          </p>
        </div>
        
        {/* Top Right Actions */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {/* Account Selector */}
            {accountIds.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value)
                  setFlatInventory([])
                }}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {accountIds.map((account) => (
                  <option key={account.id} value={account.value}>
                    {account.name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Reload Data Button */}
            <Button
              onClick={loadFromSupabase}
              disabled={isLoading}
              variant="outline"
              className="text-sm"
            >
              <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reload Data
            </Button>
            
            {/* Refresh from ShipHero Button */}
            <Button
              onClick={refreshFromShipHero}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh from ShipHero
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {flatInventory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total SKUs</div>
              <div className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">{summary.totalSkus.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty Sellable</div>
              <div className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-500">{summary.totalQtySellable.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qty Non-Sellable</div>
              <div className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-500">{summary.totalQtyNonSellable.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">SKUs Non-Sellable</div>
              <div className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-500">{summary.skusNonSellable.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {flatInventory.length > 0 && (
        <Card className="mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
                <select
                  value={statusFilters.sellable}
                  onChange={(e) => setStatusFilters(prev => ({ ...prev, sellable: e.target.value as any }))}
                  className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sellable</option>
                  <option value="sellable">Sellable</option>
                  <option value="non-sellable">Non-Sellable</option>
                </select>
                <select
                  value={statusFilters.pickable}
                  onChange={(e) => setStatusFilters(prev => ({ ...prev, pickable: e.target.value as any }))}
                  className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Pickable</option>
                  <option value="pickable">Pickable</option>
                  <option value="non-pickable">Non-Pickable</option>
                </select>
                <span className="text-xs text-gray-500 ml-2">
                  {filteredInventory.length.toLocaleString()} of {flatInventory.length.toLocaleString()} items
                </span>
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm" className="text-sm">
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isAuthenticated ? (
        <Card className="border-amber-200 bg-amber-50/20 dark:bg-amber-950/20">
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <p className="text-amber-800 dark:text-amber-200 text-lg mb-4">
              Authentication Required
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Please authenticate in Token Access page to view inventory
            </p>
            <Button onClick={() => window.location.href = '/token-access'}>
              Go to Token Access
            </Button>
          </CardContent>
        </Card>
      ) : isLoading && flatInventory.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600 text-lg">Loading inventory...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait</p>
          </CardContent>
        </Card>
      ) : flatInventory.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No inventory data found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Click "Refresh from ShipHero" or upload data in the Seed Data page
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={refreshFromShipHero} disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh from ShipHero
              </Button>
              <Button onClick={() => window.location.href = '/seed-data'} variant="outline">
                Upload Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('productName')}>
                        Item {getSortIcon('productName')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('warehouse')}>
                        Warehouse {getSortIcon('warehouse')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('location')}>
                        Location {getSortIcon('location')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('quantity')}>
                        Units {getSortIcon('quantity')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('pickable')}>
                        Pickable {getSortIcon('pickable')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      <Button variant="ghost" className="h-auto p-0 font-semibold hover:bg-transparent text-xs" onClick={() => sortData('sellable')}>
                        Sellable {getSortIcon('sellable')}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{item.productName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">SKU {item.sku}</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{item.warehouse}</td>
                      <td className="px-4 py-3.5 font-mono text-sm text-gray-900 dark:text-white">{item.location}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">{item.type}</td>
                      <td className="px-4 py-3.5 font-semibold text-sm text-gray-900 dark:text-white">{item.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-center">
                        {item.pickable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.sellable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
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
