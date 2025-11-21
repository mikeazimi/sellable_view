'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Key, Zap, X, User, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Dev test token for development
const DEV_TEST_TOKEN = 'dYbj7j9dspqoxwAtW5S2TOBNacIYvv7BKFwQqbArw7mv-'

export default function SettingsPage() {
  // Refresh Token Method
  const [refreshToken, setRefreshToken] = useState('')
  const [refreshAuthToken, setRefreshAuthToken] = useState('')
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState<string>('')
  const [isGeneratingRefresh, setIsGeneratingRefresh] = useState(false)
  const [copiedRefresh, setCopiedRefresh] = useState(false)
  const [copiedRefreshAuth, setCopiedRefreshAuth] = useState(false)
  const [copiedTest, setCopiedTest] = useState(false)
  const [showTestToken, setShowTestToken] = useState(true)
  
  // Username/Password Method
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userPassAuthToken, setUserPassAuthToken] = useState('')
  const [userPassTokenExpiry, setUserPassTokenExpiry] = useState<string>('')
  const [isGeneratingUserPass, setIsGeneratingUserPass] = useState(false)
  const [copiedUserPassAuth, setCopiedUserPassAuth] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    // Load saved refresh token from localStorage
    const saved = localStorage.getItem('shiphero_refresh_token')
    if (saved) {
      setRefreshToken(saved)
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

  const handleGenerateFromRefreshToken = async () => {
    if (!refreshToken) {
      toast({
        title: 'Error',
        description: 'Please enter a refresh token first',
        variant: 'destructive',
      })
      return
    }

    setIsGeneratingRefresh(true)
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

      setRefreshAuthToken(data.accessToken)
      
      const expiryDate = new Date(Date.now() + data.expiresIn * 1000)
      setRefreshTokenExpiry(expiryDate.toLocaleString())
      
      toast({
        title: 'Access token generated',
        description: 'Successfully generated access token from refresh token',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate auth token. Please check your refresh token.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingRefresh(false)
    }
  }

  const handleGenerateFromUserPass = async () => {
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both username and password',
        variant: 'destructive',
      })
      return
    }

    setIsGeneratingUserPass(true)
    try {
      const response = await fetch('/api/auth/username-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate')
      }

      setUserPassAuthToken(data.accessToken)
      
      const expiryDate = new Date(Date.now() + data.expiresIn * 1000)
      setUserPassTokenExpiry(expiryDate.toLocaleString())
      
      toast({
        title: 'Authentication successful',
        description: 'Successfully authenticated with username and password',
      })
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.message || 'Please check your username and password.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingUserPass(false)
    }
  }

  const handleClearRefreshToken = () => {
    setRefreshToken('')
    setRefreshAuthToken('')
    setRefreshTokenExpiry('')
    localStorage.removeItem('shiphero_refresh_token')
    toast({
      title: 'Refresh token cleared',
      description: 'Refresh token and generated access token have been cleared',
    })
  }

  const handleClearUserPass = () => {
    setUsername('')
    setPassword('')
    setUserPassAuthToken('')
    setUserPassTokenExpiry('')
    toast({
      title: 'Credentials cleared',
      description: 'Username, password, and generated token have been cleared',
    })
  }

  const copyToClipboard = async (text: string, type: 'refresh' | 'refresh-auth' | 'userpass-auth' | 'test') => {
    await navigator.clipboard.writeText(text)
    if (type === 'refresh') {
      setCopiedRefresh(true)
      setTimeout(() => setCopiedRefresh(false), 2000)
    } else if (type === 'refresh-auth') {
      setCopiedRefreshAuth(true)
      setTimeout(() => setCopiedRefreshAuth(false), 2000)
    } else if (type === 'userpass-auth') {
      setCopiedUserPassAuth(true)
      setTimeout(() => setCopiedUserPassAuth(false), 2000)
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: Refresh Token */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Refresh Token Method</CardTitle>
                <CardDescription>
                  Use a ShipHero developer refresh token
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Test Token */}
            {showTestToken && (
              <div className="relative bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <button
                  onClick={() => setShowTestToken(false)}
                  className="absolute top-2 right-2 text-blue-600 dark:text-blue-400"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Quick Test Token
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={DEV_TEST_TOKEN}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleUseTestToken}
                    size="sm"
                    className="w-full"
                  >
                    <Zap className="w-3 h-3 mr-2" />
                    Use Test Token
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="refresh-token">Refresh Token</Label>
              <div className="flex gap-2">
                <Input
                  id="refresh-token"
                  type="text"
                  placeholder="Enter refresh token"
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
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateFromRefreshToken} 
                disabled={!refreshToken || isGeneratingRefresh}
                className="flex-1"
              >
                {isGeneratingRefresh ? 'Generating...' : 'Generate Token'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearRefreshToken}
                disabled={!refreshToken && !refreshAuthToken}
              >
                Clear
              </Button>
            </div>

            {refreshAuthToken && (
              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="refresh-auth-token">Generated Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="refresh-auth-token"
                    type="text"
                    value={refreshAuthToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(refreshAuthToken, 'refresh-auth')}
                  >
                    {copiedRefreshAuth ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {refreshTokenExpiry && (
                  <p className="text-xs text-gray-500">
                    Expires: {refreshTokenExpiry}
                  </p>
                )}
                <p className="text-xs text-green-600 font-medium">
                  Access token ready
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Method 2: Username/Password */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Username & Password</CardTitle>
                <CardDescription>
                  Use your ShipHero login credentials
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter ShipHero username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter ShipHero password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateFromUserPass} 
                disabled={!username || !password || isGeneratingUserPass}
                className="flex-1"
              >
                {isGeneratingUserPass ? 'Authenticating...' : 'Authenticate'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearUserPass}
                disabled={!username && !password && !userPassAuthToken}
              >
                Clear
              </Button>
            </div>

            {userPassAuthToken && (
              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="userpass-auth-token">Generated Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="userpass-auth-token"
                    type="text"
                    value={userPassAuthToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(userPassAuthToken, 'userpass-auth')}
                  >
                    {copiedUserPassAuth ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {userPassTokenExpiry && (
                  <p className="text-xs text-gray-500">
                    Expires: {userPassTokenExpiry}
                  </p>
                )}
                <p className="text-xs text-green-600 font-medium">
                  Authentication successful
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information */}
      <Card className="mt-6 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><strong>Refresh Token:</strong> Long-lived token from ShipHero developer settings</p>
            <p><strong>Username/Password:</strong> Your regular ShipHero account credentials</p>
            <p><strong>Access Tokens:</strong> Generated tokens expire after 28 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
