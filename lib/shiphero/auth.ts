/**
 * ShipHero Authentication Client
 * Handles token refresh and management for ShipHero API access
 */

export class ShipHeroAuth {
  private refreshToken: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    // Return existing token if still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshAccessToken();
    
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('https://public-api.shiphero.com/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    
    // Set expiry to 5 minutes before actual expiry for safety
    // expires_in is in seconds (28 days = 2419200 seconds)
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    
    console.log(`ShipHero token refreshed. Expires at: ${this.tokenExpiry.toISOString()}`);
    
    return this.accessToken;
  }

  /**
   * Force a token refresh
   */
  async forceRefresh(): Promise<string> {
    this.accessToken = null;
    this.tokenExpiry = null;
    return this.getValidToken();
  }

  /**
   * Check if token is valid without refreshing
   */
  isTokenValid(): boolean {
    return this.accessToken !== null && 
           this.tokenExpiry !== null && 
           new Date() < this.tokenExpiry;
  }
}

