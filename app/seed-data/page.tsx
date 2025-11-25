'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database, Upload, RefreshCw, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InventoryRecord {
  sku: string
  product_name: string
  location_name: string
  pickable_quantity: number
  sellable_quantity: number
  backorder_quantity: number
  warehouse: string
}

export default function SeedDataPage() {
  const [csvData, setCsvData] = useState<InventoryRecord[]>([])
  const [accountId, setAccountId] = useState('88774')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const { toast } = useToast()

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = text.split('\n').filter(row => row.trim())
      
      // Skip header row
      const dataRows = rows.slice(1)
      
      const parsed: InventoryRecord[] = dataRows.map(row => {
        const cols = row.split(',').map(col => col.trim())
        return {
          sku: cols[0] || '',
          product_name: cols[1] || '',
          location_name: cols[2] || '',
          pickable_quantity: parseInt(cols[3]) || 0,
          sellable_quantity: parseInt(cols[4]) || 0,
          backorder_quantity: parseInt(cols[5]) || 0,
          warehouse: cols[6] || 'Primary'
        }
      }).filter(record => record.sku) // Filter out empty rows

      setCsvData(parsed)
      toast({
        title: 'CSV loaded',
        description: `${parsed.length} records ready to upload`,
      })
    }
    
    reader.readAsText(file)
  }

  const uploadToSupabase = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'Error',
        description: 'Please load a CSV file first',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress('Starting upload...')

    try {
      const chunkSize = 500
      const totalChunks = Math.ceil(csvData.length / chunkSize)

      for (let i = 0; i < totalChunks; i++) {
        const chunk = csvData.slice(i * chunkSize, (i + 1) * chunkSize)
        setUploadProgress(`Uploading chunk ${i + 1}/${totalChunks} (${chunk.length} records)...`)

        const response = await fetch('/api/upload-inventory-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: chunk,
            customer_account_id: accountId,
            chunk_index: i,
            total_chunks: totalChunks
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
      }

      setUploadProgress('Upload complete!')
      toast({
        title: 'Success',
        description: `${csvData.length} records uploaded to Supabase`,
      })
      
      // Reset after successful upload
      setTimeout(() => {
        setCsvData([])
        setUploadProgress('')
      }, 3000)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
      setUploadProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Seed Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manually upload inventory CSV to update Supabase
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Upload Inventory CSV</CardTitle>
              <CardDescription>
                Upload a ShipHero inventory export to manually seed Supabase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CSV File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Inventory CSV File</Label>
            <div className="flex items-center gap-3">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
              />
            </div>
            {csvData.length > 0 && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {csvData.length.toLocaleString()} records loaded
                </span>
              </div>
            )}
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <Label htmlFor="account-id">Customer Account ID</Label>
            <Input
              id="account-id"
              type="text"
              placeholder="88774"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              The account ID that this data belongs to
            </p>
          </div>

          {/* Upload Button */}
          {csvData.length > 0 && (
            <Button
              onClick={uploadToSupabase}
              disabled={isUploading || !accountId}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {csvData.length.toLocaleString()} Records to Supabase
                </>
              )}
            </Button>
          )}

          {/* Progress */}
          {uploadProgress && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {uploadProgress}
              </p>
            </div>
          )}

          {/* CSV Format Info */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">
              Expected CSV Format
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
              <div className="text-gray-600 dark:text-gray-400">
                sku,product_name,location_name,pickable_quantity,sellable_quantity,backorder_quantity,warehouse
              </div>
              <div className="text-gray-500 dark:text-gray-500 mt-1">
                ABC123,Widget,A1-B2-C3,100,95,5,Primary
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Uploading will replace all existing inventory data for the specified account ID.
              Make sure your CSV contains complete, up-to-date inventory data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

