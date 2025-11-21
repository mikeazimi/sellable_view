import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/username-password
 * Authenticate with ShipHero using username and password
 * This flow is different from refresh token authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // ShipHero username/password authentication
    // Note: This might need to be updated based on ShipHero's actual auth flow
    const response = await fetch('https://public-api.shiphero.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password,
        grant_type: 'password' // Standard OAuth2 flow
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ShipHero username/password auth error:', errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 400 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // If provided
      expiresIn: data.expires_in,
      tokenType: data.token_type || 'Bearer',
      scope: data.scope,
    })
  } catch (error) {
    console.error('Username/password authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
