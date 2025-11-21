'use client'

import { useState, useEffect } from 'react'
import { AuthManager } from '@/lib/auth-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Key, Zap, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Dev test token for development
const DEV_TEST_TOKEN = 'dYbj7j9dspqoxwAtW5S2TOBNacIYvv7BKFwQqbArw7mv-'

export default function SettingsPage() {
  const [refreshToken, setRefreshToken] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [tokenExpiry, setTokenExpiry] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedRefresh, setCopiedRefresh] = useState(false)
  const [copiedAuth, setCopiedAuth] = useState(false)
  const [copiedTest, setCopiedTest] = useState(false)
  const [showTestToken, setShowTestToken] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    // Load saved refresh token from localStorage
    const saved = localStorage.getItem('shiphero_refresh_token')
    if (saved) {
      setRefreshToken(saved)
    }

    // Check if already authenticated
    const authenticated = AuthManager.isAuthenticated()
    setIsAuthenticated(authenticated)
    
    if (authenticated) {
      const savedToken = AuthManager.getValidToken()
      if (savedToken) {
        setAuthToken(savedToken)
        setTimeRemaining(AuthManager.getTimeRemaining())
      }
    }
  }, [])

  const handleSaveRefreshToken = () => {
    localStorage.setItem('shiphero_refresh_token', refreshToken)
    toast({
      title: 'Refresh token saved',
      description: 'Your refresh token has been stored locally',
    })
  }

  const handleUseTestToken = () => {
    setRefreshToken(DEV_TEST_TOKEN)
    toast({
      title: 'Test token loaded',
      description: 'Dev test token has been loaded into the refresh token field',
    })
  }

  const handleGenerateAuthToken = async () => {
    if (!refreshToken) {
      toast({
        title: 'Error',
        description: 'Please enter a refresh token first',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/auth/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate token')
      }

      // Save to AuthManager for 28 days
      AuthManager.saveAuth(data.accessToken, data.expiresIn, refreshToken)
      
      setAuthToken(data.accessToken)
      setIsAuthenticated(true)
      
      const expiryDate = new Date(Date.now() + data.expiresIn * 1000)
      setTokenExpiry(expiryDate.toLocaleString())
      setTimeRemaining(AuthManager.getTimeRemaining())
      
      // Save refresh token for convenience  
      localStorage.setItem('shiphero_refresh_token', refreshToken)
      
      toast({
        title: 'Authentication successful',
        description: 'Access token saved for 28 days. You can now use the inventory page.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate auth token. Please check your refresh token.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearToken = () => {
    setRefreshToken('')
    setAuthToken('')
    setTokenExpiry('')
    setTimeRemaining(null)
    setIsAuthenticated(false)
    localStorage.removeItem('shiphero_refresh_token')
    AuthManager.clearAuth()
    
    toast({
      title: 'Authentication cleared',
      description: 'All tokens have been cleared. You will need to re-authenticate.',
    })
  }

  const copyToClipboard = async (text: string, type: 'refresh' | 'auth' | 'test') => {
    await navigator.clipboard.writeText(text)
    if (type === 'refresh') {
      setCopiedRefresh(true)
      setTimeout(() => setCopiedRefresh(false), 2000)
    } else if (type === 'auth') {
      setCopiedAuth(true)
      setTimeout(() => setCopiedAuth(false), 2000)
    } else {
      setCopiedTest(true)
      setTimeout(() => setCopiedTest(false), 2000)
    }
    toast({
      title: 'Copied to clipboard',
      description: `${type === 'test' ? 'Test token' : type === 'refresh' ? 'Refresh token' : 'Access token'} copied`,
    })
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your ShipHero API authentication
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">ShipHero Developer Authentication</CardTitle>
              <CardDescription>
                Use your ShipHero developer refresh token to access the API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Test Token */}
          {showTestToken && (
            <div className="relative bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <button
                onClick={() => setShowTestToken(false)}
                className="absolute top-3 right-3 text-blue-600 dark:text-blue-400"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Quick Test Token
                </span>
              </div>
              <div className="space-y-3">
                <Input
                  value={DEV_TEST_TOKEN}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleUseTestToken}
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Use Test Token
                </Button>
              </div>
            </div>
          )}

          {/* Refresh Token Input */}
          <div className="space-y-2">
            <Label htmlFor="refresh-token">Refresh Token</Label>
            <div className="flex gap-2">
              <Input
                id="refresh-token"
                type="text"
                placeholder="Enter your ShipHero developer refresh token"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                className="font-mono"
              />
              {refreshToken && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(refreshToken, 'refresh')}
                >
                  {copiedRefresh ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Get this from your ShipHero Third-Party Developer settings
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateAuthToken} 
              disabled={!refreshToken || isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate Access Token'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearToken}
              disabled={!refreshToken && !authToken}
            >
              Clear
            </Button>
          </div>

          {/* Authentication Status */}
          {isAuthenticated && (
            <div className="space-y-3 pt-4 border-t bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  Authenticated
                </span>
              </div>
              {timeRemaining && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Token expires in: {timeRemaining}
                </p>
              )}
              {authToken && (
                <div className="space-y-2">
                  <Label htmlFor="auth-token" className="text-sm">Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="auth-token"
                      type="text"
                      value={authToken.substring(0, 30) + '...'}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(authToken, 'auth')}
                    >
                      {copiedAuth ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-green-600 dark:text-green-400">
                Ready to access inventory data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="mt-6 max-w-2xl border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Refresh Token:</strong> Long-lived token from ShipHero developer settings (28-day access tokens)</p>
            <p><strong>API Endpoint:</strong> https://public-api.shiphero.com/graphql</p>
            <p><strong>Authentication:</strong> Bearer token authentication with automatic refresh</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
