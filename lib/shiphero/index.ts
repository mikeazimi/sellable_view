/**
 * ShipHero API Integration
 * Singleton instance for server-side ShipHero API access
 */

import { ShipHeroAuth } from './auth';
import { ShipHeroApiClient } from './client';

let shipHeroClient: ShipHeroApiClient | null = null;

/**
 * Get or create the ShipHero API client singleton
 */
export function getShipHeroClient(): ShipHeroApiClient {
  if (!shipHeroClient) {
    const refreshToken = process.env.SHIPHERO_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error(
        'SHIPHERO_REFRESH_TOKEN environment variable is not set. ' +
        'Please add it to your environment variables in Vercel or .env.local'
      );
    }

    const auth = new ShipHeroAuth(refreshToken);
    shipHeroClient = new ShipHeroApiClient(auth);
  }

  return shipHeroClient;
}

/**
 * Get the customer account ID from environment
 * This is the client ID you want to filter by for 3PL operations
 */
export function getCustomerAccountId(): string | undefined {
  return process.env.SHIPHERO_CUSTOMER_ACCOUNT_ID;
}

/**
 * Reset the client singleton (useful for testing)
 */
export function resetShipHeroClient(): void {
  shipHeroClient = null;
}

// Re-export types and classes for convenience
export { ShipHeroAuth } from './auth';
export { ShipHeroApiClient } from './client';
export type { ShipHeroError } from './client';

