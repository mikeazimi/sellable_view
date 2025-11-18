import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/generate-token
 * Generate a ShipHero access token from a refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Use ShipHero's auth/refresh endpoint
    const response = await fetch('https://public-api.shiphero.com/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ShipHero auth error:', errorText)
      return NextResponse.json(
        { error: 'Invalid refresh token or authentication failed' },
        { status: 400 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in, // 2419200 seconds (28 days)
      tokenType: data.token_type, // "Bearer"
      scope: data.scope,
    })
  } catch (error) {
    console.error('Error generating auth token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
