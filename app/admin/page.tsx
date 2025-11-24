'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Database, RefreshCw } from 'lucide-react'
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
  const { toast} = useToast()

  const runInventorySync = async () => {
    const accessToken = AuthManager.getValidToken()
    
    if (!accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please authenticate in Settings first',
        variant: 'destructive',
      })
      return
    }

    setIsSyncingInventory(true)
    setInventorySyncResult(null)

    try {
      console.log('Starting inventory snapshot sync...')
      
      const response = await fetch('/api/sync/inventory-snapshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sync failed')
      }

      setInventorySyncResult(result)
      
      toast({
        title: 'Inventory sync complete',
        description: result.message,
      })

    } catch (error: any) {
      console.error('Sync error:', error)
      
      setInventorySyncResult({
        success: false,
        error: error.message
      })
      
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
          Admin - Seed Location Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload CSV to populate location cache
        </p>
      </div>

      <Card className="max-w-2xl">
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
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Full Inventory Sync
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Generates complete inventory snapshot from ShipHero</li>
              <li>• Takes 5-10 minutes (polls until ready)</li>
              <li>• Syncs ALL SKUs with locations and quantities</li>
              <li>• Run manually or scheduled nightly at 2 AM</li>
            </ul>
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
  )
}

