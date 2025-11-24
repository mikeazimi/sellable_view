'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AuthManager } from '@/lib/auth-manager'

export default function AdminPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const { toast } = useToast()

  const runLocationSync = async () => {
    const accessToken = AuthManager.getValidToken()
    
    if (!accessToken) {
      toast({
        title: 'Authentication required',
        description: 'Please authenticate in Settings first',
        variant: 'destructive',
      })
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    try {
      console.log('Starting location sync...')
      
      const response = await fetch('/api/sync/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sync failed')
      }

      setSyncResult(result)
      
      toast({
        title: 'Sync complete',
        description: result.message,
      })

      console.log('Sync result:', result)

    } catch (error: any) {
      console.error('Sync error:', error)
      
      setSyncResult({
        success: false,
        error: error.message
      })
      
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin - Data Sync
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage location cache and background sync jobs
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Sync Locations from ShipHero</CardTitle>
              <CardDescription>
                Cache location metadata (sellable/pickable status) to Supabase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Important: Credit Usage
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• This sync uses approximately 1,000-2,000 ShipHero credits</li>
              <li>• Run this ONLY when credits are available</li>
              <li>• Recommended: Run every 4-6 hours (locations don't change often)</li>
              <li>• Once cached, inventory queries use 60x fewer credits!</li>
            </ul>
          </div>

          <div>
            <Button 
              onClick={runLocationSync}
              disabled={isSyncing}
              size="lg"
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Locations...' : 'Run Location Sync'}
            </Button>
            {isSyncing && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                This may take 30-60 seconds...
              </p>
            )}
          </div>

          {syncResult && (
            <div className={`p-4 rounded-lg border ${
              syncResult.success 
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {syncResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    syncResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                  }`}>
                    {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                  </h3>
                  <p className={`text-sm ${
                    syncResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {syncResult.message || syncResult.error}
                  </p>
                  {syncResult.meta && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <p>Complexity: {syncResult.meta.complexity}</p>
                      <p>Synced at: {syncResult.meta.synced_at}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">What This Does</h3>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Fetches ALL location data from ShipHero (one-time cost)</li>
              <li>Saves sellable/pickable status to Supabase</li>
              <li>Future inventory queries use cached data (60x faster!)</li>
              <li>No more credit exhaustion on inventory loads</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p><strong>1. Wait for ShipHero credits to refresh</strong> (~1 hour)</p>
          <p><strong>2. Click "Run Location Sync"</strong> above</p>
          <p><strong>3. Verify data in Supabase:</strong> https://supabase.com/dashboard/project/ujfmsmyvyyqfcqqyozrm/editor</p>
          <p><strong>4. Inventory queries will then use cached data automatically</strong></p>
        </CardContent>
      </Card>
    </div>
  )
}

