'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Play, StopCircle, Eye, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Snapshot {
  id: string
  account_id: string
  account_name: string
  status: 'running' | 'completed' | 'failed' | 'aborted'
  started_at: string
  completed_at?: string
  total_records: number
  progress_percentage: number
  filters: {
    sellable: string
    pickable: string
  }
}

export default function SnapshotPage() {
  const [accountId, setAccountId] = useState('88774')
  const [snapshots] = useState<Snapshot[]>([])
  
  const { toast } = useToast()

  const handleRunSnapshot = () => {
    toast({
      title: 'Snapshot started',
      description: 'Inventory snapshot is now running',
    })
  }

  const handleAbortSnapshot = (id: string) => {
    toast({
      title: 'Snapshot aborted',
      description: 'Snapshot has been cancelled',
      variant: 'destructive',
    })
  }

  const handleReviewSnapshot = (id: string) => {
    toast({
      title: 'Review snapshot',
      description: `Reviewing snapshot ${id}`,
    })
  }

  const getStatusBadge = (status: Snapshot['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            <Clock className="w-3 h-3 animate-spin" />
            Running
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      case 'aborted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200">
            <StopCircle className="w-3 h-3" />
            Aborted
          </span>
        )
    }
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Inventory Snapshot
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Run and manage inventory snapshots from ShipHero
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Run Snapshot */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Run New Snapshot</CardTitle>
                <CardDescription>
                  Configure and execute a new inventory snapshot
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
            </div>

            {/* Info */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Snapshots include all inventory data. You cannot filter by pickable/sellable when creating a snapshot.
              </p>
            </div>

            {/* Run Button */}
            <Button
              onClick={handleRunSnapshot}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Snapshot
            </Button>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This will query ShipHero and update Supabase with the latest inventory data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Progress (if any) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Current Snapshot</CardTitle>
                <CardDescription>
                  Monitor active snapshot progress
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {snapshots.find(s => s.status === 'running') ? (
              <div className="space-y-4">
                {snapshots
                  .filter(s => s.status === 'running')
                  .map(snapshot => (
                    <div key={snapshot.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {snapshot.account_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started: {snapshot.started_at}
                          </p>
                        </div>
                        {getStatusBadge(snapshot.status)}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {snapshot.total_records.toLocaleString()} records processed
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {snapshot.progress_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${snapshot.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Abort Button */}
                      <Button
                        onClick={() => handleAbortSnapshot(snapshot.id)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Abort Snapshot
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active snapshots</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snapshot History */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Snapshot History</CardTitle>
              <CardDescription>
                View and manage previous snapshots
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {snapshot.account_name}
                    </p>
                    {getStatusBadge(snapshot.status)}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Account ID: {snapshot.account_id}</p>
                    <p>Started: {snapshot.started_at}</p>
                    {snapshot.completed_at && (
                      <p>Completed: {snapshot.completed_at}</p>
                    )}
                    <p>Records: {snapshot.total_records.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleReviewSnapshot(snapshot.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

