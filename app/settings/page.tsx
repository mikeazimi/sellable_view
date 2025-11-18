'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Key, ArrowLeft, Zap, X } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

// Dev test token for 3PL development
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
      // Call ShipHero API to generate auth token
      const response = await fetch('/api/auth/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate token')
      }

      setAuthToken(data.accessToken)
      
      // Calculate expiry time (28 days from now)
      const expiryDate = new Date(Date.now() + data.expiresIn * 1000)
      setTokenExpiry(expiryDate.toLocaleString())
      
      toast({
        title: 'Auth token generated',
        description: 'Successfully generated new authentication token (expires in 28 days)',
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
    localStorage.removeItem('shiphero_refresh_token')
    toast({
      title: 'Tokens cleared',
      description: 'All tokens have been cleared',
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
      description: `${type === 'test' ? 'Test' : type === 'refresh' ? 'Refresh' : 'Auth'} token copied`,
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-balance">
            Authentication Settings
          </h1>
          <p className="text-muted-foreground text-lg text-balance">
            Configure your ShipHero API credentials for accessing inventory data
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Key className="w-6 h-6 mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">ShipHero Authentication</CardTitle>
                  <CardDescription className="text-base">
                    Enter your ShipHero Refresh Token to connect your account. The access token will be automatically generated for you.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Test Token Section */}
              {showTestToken && (
                <div className="relative bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <button
                    onClick={() => setShowTestToken(false)}
                    className="absolute top-3 right-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3 mb-4">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Quick Test Token
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Click "Use Test Token" to auto-fill, or "Copy Token" to paste elsewhere
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={DEV_TEST_TOKEN}
                      readOnly
                      className="font-mono text-sm bg-white dark:bg-slate-950"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUseTestToken}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Use Test Token
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(DEV_TEST_TOKEN, 'test')}
                        className="border-blue-300 dark:border-blue-700"
                      >
                        {copiedTest ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Token
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Refresh Token Input */}
              <div className="space-y-2">
                <Label htmlFor="refresh-token" className="text-base font-semibold">
                  Refresh Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="refresh-token"
                    type="text"
                    placeholder="Enter your refresh token"
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
                      {copiedRefresh ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your refresh token will be used to automatically generate access tokens
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateAuthToken} 
                  disabled={!refreshToken || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Refresh Token'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearToken}
                  disabled={!refreshToken && !authToken}
                >
                  Clear
                </Button>
              </div>

              {/* Generated Auth Token Display */}
              {authToken && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="auth-token" className="text-base font-semibold">
                    Generated Access Token
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="auth-token"
                      type="text"
                      value={authToken}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(authToken, 'auth')}
                    >
                      {copiedAuth ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {tokenExpiry && (
                    <p className="text-sm text-muted-foreground">
                      Token expires: {tokenExpiry}
                    </p>
                  )}
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Access token generated successfully
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-lg">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>For Development:</strong> Use the test token above or save your own refresh token locally.
              </p>
              <p>
                <strong>For Production:</strong> Set <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">SHIPHERO_REFRESH_TOKEN</code> in Vercel environment variables.
              </p>
              <p>
                <strong>3PL Filtering:</strong> Set <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">SHIPHERO_CUSTOMER_ACCOUNT_ID</code> to filter data for a specific customer.
              </p>
              <p className="text-muted-foreground pt-2 border-t border-amber-200 dark:border-amber-800">
                Access tokens expire after 28 days. The application automatically handles token refresh.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
