'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Database, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { AuthManager } from '@/lib/auth-manager'
import Papa from 'papaparse'

export default function AdminPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [parsedLocations, setParsedLocations] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSyncingInventory, setIsSyncingInventory] = useState(false)
  const [inventorySyncResult, setInventorySyncResult] = useState<any>(null)
  const [snapshotCustomerId, setSnapshotCustomerId] = useState('88774')
  const [snapshotWarehouseId, setSnapshotWarehouseId] = useState('74776')
  const [snapshotStatus, setSnapshotStatus] = useState('')
  const [pollAttempt, setPollAttempt] = useState(0)
  const [currentSnapshotId, setCurrentSnapshotId] = useState('')
  const [recentSnapshots, setRecentSnapshots] = useState<any[]>([])
  const [inventoryCsvData, setInventoryCsvData] = useState<any[]>([])
  const [isUploadingInventory, setIsUploadingInventory] = useState(false)
  const [inventoryUploadProgress, setInventoryUploadProgress] = useState('')
  const { toast} = useToast()

  const handleInventoryCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Parse CSV
      const headers = lines[0].split(',')
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        const obj: any = {}
        headers.forEach((header, i) => {
          obj[header.trim()] = values[i]?.trim()
        })
        return obj
      })

      setInventoryCsvData(data)
      toast({
        title: 'CSV loaded',
        description: `${data.length} records ready to upload`,
      })
    }
    reader.readAsText(file)
  }

  const uploadInventorySnapshot = async () => {
    if (inventoryCsvData.length === 0) {
      toast({
        title: 'No data',
        description: 'Please select a CSV file first',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingInventory(true)
    setInventoryUploadProgress('Starting upload...')

    try {
      const accessToken = AuthManager.getValidToken()
      if (!accessToken) throw new Error('Not authenticated')

      // Convert customer ID
      let accountId = snapshotCustomerId.trim()
      if (/^\d+$/.test(accountId)) {
        accountId = btoa(`CustomerAccount:${accountId}`)
      }

      // Upload in chunks of 500
      const chunkSize = 500
      let uploaded = 0

      for (let i = 0; i < inventoryCsvData.length; i += chunkSize) {
        const chunk = inventoryCsvData.slice(i, i + chunkSize)
        const isFirstChunk = i === 0
        setInventoryUploadProgress(`Uploading ${i + 1}-${i + chunk.length} of ${inventoryCsvData.length}...`)

        const response = await fetch('/api/upload-inventory-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chunk,
            customer_account_id: accountId,
            is_first_chunk: isFirstChunk // Delete old data on first chunk
          })
        })

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error)
        }

        uploaded += result.uploaded
      }

      setInventoryUploadProgress(`✅ Complete! ${uploaded} records uploaded`)
      toast({
        title: 'Upload complete',
        description: `${uploaded} inventory records saved to Supabase`,
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      setInventoryUploadProgress(`❌ Error: ${error.message}`)
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingInventory(false)
    }
  }

  const loadRecentSnapshots = async () => {
    const accessToken = AuthManager.getValidToken()
    if (!accessToken) return

    try {
      let accountId = snapshotCustomerId.trim()
      if (/^\d+$/.test(accountId)) {
        accountId = btoa(`CustomerAccount:${accountId}`)
      }

      const response = await fetch(`/api/sync/snapshots-list?customer_account_id=${accountId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const result = await response.json()
      if (result.success) {
        setRecentSnapshots(result.snapshots || [])
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    }
  }

  const abortCurrentSnapshot = async () => {
    if (!currentSnapshotId) {
      toast({
        title: 'No snapshot to abort',
        description: 'No snapshot is currently running',
        variant: 'destructive',
      })
      return
    }

    const accessToken = AuthManager.getValidToken()
    if (!accessToken) return

    try {
      const response = await fetch('/api/sync/snapshot-abort', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          snapshot_id: currentSnapshotId,
          reason: 'Manual abort by user'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Snapshot aborted',
          description: `Snapshot ${currentSnapshotId.substring(0, 8)}... has been aborted`,
        })
        setIsSyncingInventory(false)
        setCurrentSnapshotId('')
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: 'Abort failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const runInventorySync = async () => {
    const accessToken = AuthManager.getValidToken()
    
    if (!accessToken || !snapshotCustomerId) {
      toast({
        title: 'Authentication required',
        description: 'Please authenticate and enter customer ID',
        variant: 'destructive',
      })
      return
    }

    setIsSyncingInventory(true)
    setInventorySyncResult(null)

    try {
      console.log('Starting snapshot for:', snapshotCustomerId)
      
      // Convert customer ID to UUID
      let accountId = snapshotCustomerId.trim()
      if (/^\d+$/.test(accountId)) {
        accountId = btoa(`CustomerAccount:${accountId}`)
      }

      // Convert warehouse ID to base64
      let warehouseId = snapshotWarehouseId.trim()
      if (/^\d+$/.test(warehouseId)) {
        warehouseId = btoa(`Warehouse:${warehouseId}`)
        console.log('Converted warehouse ID to:', warehouseId)
      }
      
      // Step 1: Start snapshot generation
      const startResponse = await fetch('/api/sync/snapshot-start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          customer_account_id: accountId,
          warehouse_id: warehouseId
        })
      })

      const startResult = await startResponse.json()

      if (!startResult.success) {
        throw new Error(startResult.error)
      }

      const snapshotId = startResult.snapshot_id
      setCurrentSnapshotId(snapshotId)
      console.log('Snapshot ID:', snapshotId, '- Polling for completion...')

      toast({
        title: 'Snapshot requested',
        description: 'Waiting for ShipHero to generate snapshot (5-10 min)...',
      })

      // Step 2: Poll until ready
      let attempts = 0
      const maxAttempts = 60

      while (attempts < maxAttempts) {
        attempts++
        setPollAttempt(attempts)
        
        await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds
        
        console.log(`Checking status... (${attempts}/60)`)
        setSnapshotStatus(`Polling... (${attempts}/60)`)

        const checkResponse = await fetch('/api/sync/snapshot-check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ snapshot_id: snapshotId })
        })

        const checkResult = await checkResponse.json()
        
        console.log('Check result:', checkResult)

        if (checkResult.status === 'complete') {
          setSnapshotStatus('Processing complete! Syncing to database...')
          setInventorySyncResult(checkResult)
          toast({
            title: 'Sync complete!',
            description: checkResult.message,
          })
          break
        } else if (checkResult.status === 'processing') {
          setSnapshotStatus(`Snapshot generating... (${attempts}/60 - ${Math.round(attempts * 0.5)} min)`)
          console.log('Still processing...')
        } else if (checkResult.status === 'error') {
          throw new Error('Snapshot generation failed on ShipHero side')
        } else if (!checkResult.success) {
          throw new Error(checkResult.error)
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Snapshot timed out after 30 minutes - may still be processing on ShipHero')
      }

    } catch (error: any) {
      console.error('Sync error:', error)
      setInventorySyncResult({ success: false, error: error.message })
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncingInventory(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Parsing CSV...')
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log(`Parsed ${results.data.length} rows`)
        
        // Transform and DEDUPLICATE by warehouse+location
        const locationMap = new Map()
        
        results.data
          .filter((row: any) => row.Location && row.Location !== '#VALUE!')
          .forEach((row: any) => {
            const key = `${row.Warehouse || 'Primary'}_${row.Location}`
            // Keep last occurrence if duplicate
            locationMap.set(key, {
              warehouse: row.Warehouse || 'Primary',
              location: row.Location,
              pickable: row.Pickable === 'Yes',
              sellable: row.Sellable === 'Yes',
              pick_priority: parseInt(row['Pick Priority']) || 0,
              transfer_bin: row['Transfer bin'] === 'Yes',
              staging: row.Staging === 'Yes',
              quantity: parseInt(row.Quantity) || 0,
              type: row.Type || 'None'
            })
          })

        const locations = Array.from(locationMap.values())
        console.log(`Deduplicated to ${locations.length} unique locations`)

        setParsedLocations(locations)
        toast({
          title: 'CSV parsed',
          description: `${locations.length} locations ready to upload`,
        })
      },
      error: (error: any) => {
        toast({
          title: 'Parse error',
          description: error.message,
          variant: 'destructive',
        })
      }
    })
  }

  const handleConfirmUpload = async () => {
    if (parsedLocations.length === 0) return

    setIsUploading(true)
    setUploadResult(null)
    setUploadProgress(0)

    try {
      console.log(`Uploading ${parsedLocations.length} locations in chunks...`)

      // Upload in chunks of 500 to avoid 413 error
      const chunkSize = 500
      let uploaded = 0

      for (let i = 0; i < parsedLocations.length; i += chunkSize) {
        const chunk = parsedLocations.slice(i, i + chunkSize)
        
        console.log(`Uploading chunk ${Math.floor(i / chunkSize) + 1}...`)

        const response = await fetch('/api/upload-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: chunk })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed: ${errorText}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error)
        }

        uploaded += chunk.length
        setUploadProgress(Math.round((uploaded / parsedLocations.length) * 100))
        console.log(`Uploaded ${uploaded}/${parsedLocations.length}`)
      }

      setUploadResult({
        success: true,
        message: `Successfully uploaded ${uploaded} locations`,
        total: uploaded
      })
      
      toast({
        title: 'Upload complete',
        description: `${uploaded} locations uploaded to Supabase`,
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadResult({ success: false, error: error.message })
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin - Data Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload CSVs and manage inventory sync
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Inventory Snapshot CSV Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Upload Inventory Snapshot</CardTitle>
                <CardDescription>
                  Upload ShipHero inventory snapshot CSV (4,606 records → instant Supabase!)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleInventoryCsvUpload}
                className="block w-full text-sm"
              />
              {inventoryCsvData.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  ✅ {inventoryCsvData.length.toLocaleString()} records loaded from CSV
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Customer Account ID</label>
              <Input
                type="text"
                value={snapshotCustomerId}
                onChange={(e) => setSnapshotCustomerId(e.target.value)}
                placeholder="88774"
              />
            </div>

            {inventoryCsvData.length > 0 && (
              <Button 
                onClick={uploadInventorySnapshot} 
                disabled={isUploadingInventory}
                className="w-full"
              >
                {isUploadingInventory ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Upload {inventoryCsvData.length.toLocaleString()} Records to Supabase</>
                )}
              </Button>
            )}

            {inventoryUploadProgress && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {inventoryUploadProgress}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locations CSV Upload */}
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Upload Locations CSV</CardTitle>
              <CardDescription>
                Seed Supabase with location data from CSV file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button asChild disabled={isUploading}>
                <span>
                  Choose CSV File
                </span>
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-3">
              Select your locations CSV file
            </p>
          </div>

          {parsedLocations.length > 0 && !isUploading && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                Ready to upload {parsedLocations.length} locations
              </p>
              <Button 
                onClick={handleConfirmUpload}
                className="w-full"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Confirm Upload to Supabase
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Uploading... {uploadProgress}% complete
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadResult && (
            <div className={`p-4 rounded-lg border ${
              uploadResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                  </h3>
                  <p className="text-sm mt-1">
                    {uploadResult.message || uploadResult.error}
                  </p>
                  {uploadResult.total && (
                    <p className="text-xs text-gray-600 mt-2">
                      Total: {uploadResult.total} locations
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>CSV Format Expected:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Warehouse, Location, Pickable, Sellable, Type</li>
              <li>Pickable/Sellable: "Yes" or "No"</li>
              <li>Rows with #VALUE! will be skipped</li>
              <li>Duplicates automatically merged (upsert)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Safe to upload multiple times - duplicates are handled automatically
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Sync Inventory Snapshot</CardTitle>
              <CardDescription>
                Generate ShipHero snapshot and sync all inventory to Supabase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Account ID</label>
              <Input
                type="text"
                value={snapshotCustomerId}
                onChange={(e) => setSnapshotCustomerId(e.target.value)}
                placeholder="88774"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the account ID to sync (e.g., 88774 for Donni HQ)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Warehouse ID</label>
              <Input
                type="text"
                value={snapshotWarehouseId}
                onChange={(e) => setSnapshotWarehouseId(e.target.value)}
                placeholder="74776"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only snapshot this warehouse (MUCH faster!)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What This Does
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Generates complete inventory snapshot from ShipHero</li>
                <li>• Takes 5-10 minutes (snapshot generation + download)</li>
                <li>• Syncs ALL SKUs with locations and quantities to Supabase</li>
                <li>• After sync: Query Supabase instead of ShipHero (instant!)</li>
                <li>• Automatic: Runs nightly at 2 AM via Vercel Cron</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={runInventorySync}
            disabled={isSyncingInventory}
            size="lg"
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingInventory ? 'animate-spin' : ''}`} />
            {isSyncingInventory ? 'Syncing Inventory Snapshot...' : 'Run Inventory Snapshot Sync'}
          </Button>

          {isSyncingInventory && snapshotStatus && (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {snapshotStatus}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Snapshot ID: {currentSnapshotId.substring(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={abortCurrentSnapshot}
                    variant="destructive"
                    size="sm"
                  >
                    Abort
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Snapshots</h3>
              <Button onClick={loadRecentSnapshots} variant="outline" size="sm">
                Refresh List
              </Button>
            </div>
            {recentSnapshots.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {recentSnapshots.map((snap) => (
                  <div key={snap.snapshot_id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono">{snap.snapshot_id}</p>
                        <p className="text-xs text-gray-500">{new Date(snap.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          snap.status === 'success' ? 'text-green-600' : 
                          snap.status === 'error' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {snap.status}
                        </span>
                        {snap.snapshot_url && (
                          <p className="text-xs text-blue-600 mt-1">
                            <a href={snap.snapshot_url} target="_blank" rel="noopener">Download</a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent snapshots. Run a sync to get started.</p>
            )}
          </div>

          {inventorySyncResult && (
            <div className={`p-4 rounded-lg border ${
              inventorySyncResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {inventorySyncResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {inventorySyncResult.success ? 'Sync Successful' : 'Sync Failed'}
                  </h3>
                  <p className="text-sm mt-1">
                    {inventorySyncResult.message || inventorySyncResult.error}
                  </p>
                  {inventorySyncResult.meta && (
                    <p className="text-xs text-gray-600 mt-2">
                      Synced {inventorySyncResult.meta.total_records} records at {inventorySyncResult.meta.synced_at}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

