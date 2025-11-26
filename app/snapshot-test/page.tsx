'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, StopCircle } from 'lucide-react'
import { AuthManager } from '@/lib/auth-manager'

export default function SnapshotTestPage() {
  const [customerAccountId, setCustomerAccountId] = useState('Q3VzdG9tZXJBY2NvdW50Ojg4Nzc0')
  const [email, setEmail] = useState('mike.azimi@dischub.com')
  const [snapshotId, setSnapshotId] = useState('')
  const [status, setStatus] = useState('Ready')
  const [isRunning, setIsRunning] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [elapsedTime, setElapsedTime] = useState('0m 0s')
  const [results, setResults] = useState<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const testSnapshot = () => {
    console.log('🔥 TEST BUTTON CLICKED!')
    
    const accessToken = AuthManager.getValidToken()
    if (!accessToken) {
      console.error('❌ Not authenticated')
      setStatus('Error: Not authenticated. Go to Token Access page first.')
      return
    }

    console.log('✅ Token found, starting snapshot test...')
    
    setIsRunning(true)
    setStatus('Creating snapshot...')
    setCheckCount(0)
    setResults(null)
    startTimeRef.current = Date.now()

    console.log('═══════════════════════════════════════════════')
    console.log('🧪 SNAPSHOT TEST STARTED')
    console.log('═══════════════════════════════════════════════')
    console.log(`Customer: ${customerAccountId}`)
    console.log(`Email: ${email}`)
    console.log('')

    // Start elapsed time counter
    elapsedIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsedTime(formatElapsedTime(elapsed))
    }, 1000)

    // Run the actual test
    runSnapshotTest(accessToken)
  }

  const runSnapshotTest = async (accessToken: string) => {
    try {
      // Step 1: Create snapshot
      console.log('🚀 Step 1: Creating snapshot...')
      setStatus('Creating snapshot...')
      
      const createUrl = `/api/shiphero/snapshot-test?action=create&customer_account_id=${customerAccountId}&email=${encodeURIComponent(email)}`
      console.log(`   Calling: ${createUrl}`)
      
      const createResponse = await fetch(createUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log(`   Response status: ${createResponse.status}`)
      
      const createData = await createResponse.json()
      console.log(`   Response data:`, createData)

      if (!createData.success) {
        throw new Error(createData.error)
      }

      const snapshotIdValue = createData.snapshot_id
      setSnapshotId(snapshotIdValue)
      
      console.log(`✅ Snapshot created!`)
      console.log(`   ID: ${snapshotIdValue}`)
      console.log(`   Complexity: ${createData.complexity} credits`)
      console.log(`   Request ID: ${createData.request_id}`)
      console.log('')

      // Step 2: Poll for completion
      setStatus('Polling for completion...')
      console.log('⏱️  Step 2: Polling for completion (every 30 seconds)...')
      console.log('')

      let checkNum = 0
      let lastStatus = ''
      let statusUnchangedCount = 0
      
      const pollSnapshot = async () => {
        try {
          checkNum++
          setCheckCount(checkNum)
          
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)

          const statusResponse = await fetch(
            `/api/shiphero/snapshot-test?action=status&snapshot_id=${snapshotIdValue}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          )
          const statusData = await statusResponse.json()

          if (!statusData.success) {
            throw new Error(statusData.error)
          }

          const currentStatus = statusData.status
          const link = statusData.link || 'Not ready'

          console.log(`⏱️  Check #${checkNum} (${formatElapsedTime(elapsed)}) | Status: ${currentStatus} | Link: ${link !== 'Not ready' ? link.substring(0, 50) + '...' : link}`)

          // Track if status hasn't changed
          if (currentStatus === lastStatus) {
            statusUnchangedCount++
            if (statusUnchangedCount >= 10) {
              console.log(`⚠️  WARNING: Status has been "${currentStatus}" for 20 minutes. Snapshot may be stuck.`)
              console.log(`⚠️  You can click "Abort Snapshot" to cancel it and try again.`)
            }
          } else {
            statusUnchangedCount = 0
          }
          lastStatus = currentStatus

          setStatus(`${currentStatus.toUpperCase()} (check #${checkNum})`)

          // Check if completed (can be 'completed', 'success', or 'InventorySnapshotStatus.success')
          const isComplete = currentStatus.includes('success') || currentStatus === 'completed'
          
          if (isComplete && statusData.link) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            if (elapsedIntervalRef.current) {
              clearInterval(elapsedIntervalRef.current)
              elapsedIntervalRef.current = null
            }

            console.log('')
            console.log('✅ Snapshot completed!')
            console.log(`   Link: ${statusData.link}`)
            console.log('')

            // Step 3: Download and analyze
            setStatus('Downloading and analyzing...')
            console.log('📥 Step 3: Downloading and analyzing snapshot...')
            
            const downloadResponse = await fetch(
              `/api/shiphero/snapshot-test?action=download&url=${encodeURIComponent(statusData.link)}`,
              { headers: { 'Authorization': `Bearer ${accessToken}` } }
            )
            const downloadData = await downloadResponse.json()

            if (!downloadData.success) {
              throw new Error(downloadData.error)
            }

            const snapshotData = downloadData.data
            
            console.log('   Snapshot data structure:', Object.keys(snapshotData))
            
            // Calculate statistics
            // ShipHero snapshot structure: products -> account_id -> SKU -> product data
            let products = []
            if (snapshotData.products && typeof snapshotData.products === 'object') {
              // Get the account object (first level)
              const accountKeys = Object.keys(snapshotData.products)
              console.log(`   Account keys in products:`, accountKeys)
              
              if (accountKeys.length > 0) {
                const accountId = accountKeys[0] // Usually just one account
                const productsByAccount = snapshotData.products[accountId]
                
                // Now convert the SKU object to array
                products = Object.values(productsByAccount)
                console.log(`   Converted ${products.length} products for account ${accountId}`)
              }
            } else if (Array.isArray(snapshotData.products)) {
              products = snapshotData.products
            } else if (Array.isArray(snapshotData)) {
              products = snapshotData
            } else {
              console.log('❌ Unexpected data structure:', snapshotData)
              throw new Error('Unexpected snapshot data structure')
            }
            
            const totalProducts = products.length
            let totalLocations = 0
            let maxLocations = 0
            let productsWithLocations = 0

            products.forEach((product: any) => {
              // warehouse_products is an object keyed by warehouse ID
              const warehouseProducts = product.warehouse_products || {}
              const warehouses = Object.values(warehouseProducts)
              
              warehouses.forEach((wh: any) => {
                const bins = wh.item_bins || {}
                const binCount = Object.keys(bins).length
                
                if (binCount > 0) {
                  totalLocations += binCount
                  if (binCount > maxLocations) {
                    maxLocations = binCount
                  }
                }
              })
              
              if (totalLocations > 0) {
                productsWithLocations++
              }
            })

            const avgLocations = productsWithLocations > 0 
              ? (totalLocations / productsWithLocations).toFixed(2)
              : '0.00'

            const stats = {
              totalProducts,
              totalLocations,
              productsWithLocations,
              avgLocations,
              maxLocations
            }

            const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)

            console.log('')
            console.log('📊 STATISTICS:')
            console.log(`   Total products: ${totalProducts.toLocaleString()}`)
            console.log(`   Total locations: ${totalLocations.toLocaleString()}`)
            console.log(`   Products with locations: ${productsWithLocations.toLocaleString()}`)
            console.log(`   Avg locations/product: ${avgLocations}`)
            console.log(`   Max locations: ${maxLocations}`)
            console.log('')
            console.log('✅ TEST COMPLETED SUCCESSFULLY!')
            console.log(`⏱️  Total time: ${formatElapsedTime(finalElapsed)}`)
            console.log('═══════════════════════════════════════════════')

            setResults(stats)
            setStatus('Completed!')
            setIsRunning(false)
            setElapsedTime(formatElapsedTime(finalElapsed))
            return
          }

          // Check if failed
          if (currentStatus === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            if (elapsedIntervalRef.current) {
              clearInterval(elapsedIntervalRef.current)
              elapsedIntervalRef.current = null
            }

            console.log('')
            console.log(`❌ Snapshot failed: ${statusData.error || 'Unknown error'}`)
            console.log('═══════════════════════════════════════════════')
            
            setStatus(`Failed: ${statusData.error}`)
            setIsRunning(false)
            return
          }
        } catch (pollError: any) {
          console.error(`❌ Poll error: ${pollError.message}`)
        }
      }

      // Poll immediately
      await pollSnapshot()

      // Then poll every 30 seconds
      pollIntervalRef.current = setInterval(pollSnapshot, 30000)

    } catch (error: any) {
      console.error('❌ Error:', error.message)
      console.log('═══════════════════════════════════════════════')
      
      setStatus(`Error: ${error.message}`)
      setIsRunning(false)
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
        elapsedIntervalRef.current = null
      }
    }
  }

  const abortSnapshot = async () => {
    if (!snapshotId) {
      console.log('❌ No snapshot to abort')
      setStatus('Error: No snapshot to abort')
      return
    }

    const accessToken = AuthManager.getValidToken()
    if (!accessToken) {
      console.error('❌ Not authenticated')
      setStatus('Error: Not authenticated')
      return
    }

    console.log(`🛑 Aborting snapshot ${snapshotId}...`)
    setStatus('Aborting...')

    try {
      const response = await fetch(
        `/api/shiphero/snapshot-test?action=abort&snapshot_id=${snapshotId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      const data = await response.json()

      if (!data.success) {
        if (data.code === 9) {
          console.log(`❌ Abort failed: Snapshot is in processing status and cannot be aborted`)
          console.log(`⚠️  Contact ShipHero support if snapshot is stuck`)
          setStatus('Cannot abort - snapshot is processing')
        } else {
          throw new Error(data.error)
        }
        return
      }

      console.log(`✅ Snapshot aborted successfully`)
      console.log(`   Complexity: ${data.complexity} credits`)
      console.log('═══════════════════════════════════════════════')

      // Reset state
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
        elapsedIntervalRef.current = null
      }

      setIsRunning(false)
      setStatus('Aborted')
      setSnapshotId('')
      setCheckCount(0)
      setElapsedTime('0m 0s')

    } catch (error: any) {
      console.error('❌ Abort error:', error.message)
      setStatus(`Error: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ShipHero Snapshot Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test snapshot workflow with comprehensive logging
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Account ID */}
          <div>
            <Label htmlFor="customer-id">Customer Account ID</Label>
            <Input
              id="customer-id"
              value={customerAccountId}
              onChange={(e) => setCustomerAccountId(e.target.value)}
              disabled={isRunning}
              className="font-mono text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isRunning}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={testSnapshot}
              disabled={isRunning}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Snapshot
            </Button>
            <Button
              onClick={abortSnapshot}
              disabled={!isRunning || !snapshotId}
              variant="destructive"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Abort Snapshot
            </Button>
          </div>

          {/* Status Display */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Status:</span>
                <span className={isRunning ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                  {status}
                </span>
              </div>
              {isRunning && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progress:</span>
                    <span className="text-gray-600">
                      Check #{checkCount} ({elapsedTime} elapsed)
                    </span>
                  </div>
                  {snapshotId && (
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Snapshot ID:</span>
                      <span className="text-gray-600 font-mono text-xs break-all">
                        {snapshotId}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="border-t pt-4 bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-green-900 dark:text-green-100">✅ Results:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total products:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{results.totalProducts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total locations:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{results.totalLocations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Products with locations:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{results.productsWithLocations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Avg locations/product:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{results.avgLocations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Max locations:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{results.maxLocations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Total time:</span>
                  <span className="font-mono font-bold text-green-700 dark:text-green-300">{elapsedTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              📝 Check browser console (F12 → Console tab) for detailed logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
