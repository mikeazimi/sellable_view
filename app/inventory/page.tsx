'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Download, RefreshCw, RotateCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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
        await loadFromSupabase()
        toast({
          title: 'Refresh complete',
          description: 'Supabase updated with latest ShipHero data',
        })
      } else {
        throw new Error(result.error || 'Failed to refresh')
      }
    } catch (error: any) {
      console.error('Refresh error:', error)
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
    <div className="p-6">
      {/* Header with Actions */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Inventory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customer: {getSelectedAccountName()} ({selectedAccountId})
            {flatInventory.length > 0 && ` • ${filteredInventory.length.toLocaleString()} records`}
          </p>
        </div>
        
        {/* Top Right Actions */}
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {/* Account Selector */}
            {accountIds.length > 1 && (
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value)
                  setFlatInventory([])
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            >
              <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reload Data
            </Button>
            
            {/* Refresh from ShipHero Button */}
            <Button
              onClick={refreshFromShipHero}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh from ShipHero
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {flatInventory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total SKUs</div>
              <div className="text-2xl font-bold">{summary.totalSkus.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Qty Sellable</div>
              <div className="text-2xl font-bold text-green-600">{summary.totalQtySellable.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Qty Non-Sellable</div>
              <div className="text-2xl font-bold text-amber-600">{summary.totalQtyNonSellable.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">SKUs Non-Sellable</div>
              <div className="text-2xl font-bold text-amber-600">{summary.skusNonSellable.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {flatInventory.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sellable:</span>
                  <select
                    value={statusFilters.sellable}
                    onChange={(e) => setStatusFilters(prev => ({ ...prev, sellable: e.target.value as any }))}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800"
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
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800"
                  >
                    <option value="all">All</option>
                    <option value="pickable">Pickable Only</option>
                    <option value="non-pickable">Non-Pickable Only</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {filteredInventory.length.toLocaleString()} of {flatInventory.length.toLocaleString()} records
                </div>
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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
                      <td className="px-4 py-3 font-mono text-sm">{item.location}</td>
                      <td className="px-4 py-3 text-sm">{item.type}</td>
                      <td className="px-4 py-3 font-semibold text-lg">{item.quantity.toLocaleString()}</td>
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
