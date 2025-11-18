/**
 * ShipHero GraphQL API Client
 * Provides robust API interaction with retry logic and error handling
 */

import { ShipHeroAuth } from './auth';

export interface ShipHeroError {
  type: 'authentication' | 'authorization' | 'validation' | 'rate_limit' | 'system';
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: {
      code: string;
      details?: any;
    };
  }>;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ShipHeroApiClient {
  private auth: ShipHeroAuth;
  private retryConfig: RetryConfig;
  private readonly apiEndpoint = 'https://public-api.shiphero.com/graphql';

  constructor(
    auth: ShipHeroAuth,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.auth = auth;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      ...retryConfig
    };
  }

  /**
   * Execute a GraphQL query
   */
  async query<T>(
    query: string,
    variables?: any,
    customerAccountId?: string
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const token = await this.auth.getValidToken();
      
      // Add customer_account_id to variables if provided (for 3PL operations)
      const finalVariables = customerAccountId
        ? { ...variables, customer_account_id: customerAccountId }
        : variables;
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query, 
          variables: finalVariables 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();
      
      if (result.errors) {
        const error = result.errors[0];
        throw this.createShipHeroError(error);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    }, 'GraphQL Query');
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T>(
    mutation: string,
    variables?: any,
    customerAccountId?: string
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const token = await this.auth.getValidToken();
      
      // Add customer_account_id to variables if provided (for 3PL operations)
      const finalVariables = customerAccountId
        ? { ...variables, customer_account_id: customerAccountId }
        : variables;
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: mutation, 
          variables: finalVariables 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();
      
      if (result.errors) {
        const error = result.errors[0];
        throw this.createShipHeroError(error);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL mutation');
      }

      return result.data;
    }, 'GraphQL Mutation');
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry certain error types
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        console.log(
          `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ` +
          `retrying in ${delay}ms: ${error.message}`
        );
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    const shipHeroError = error as ShipHeroError;

    // Don't retry authentication or validation errors
    if (shipHeroError.type === 'authentication' ||
        shipHeroError.type === 'authorization' ||
        shipHeroError.type === 'validation') {
      return false;
    }

    // Retry rate limit and system errors
    return shipHeroError.type === 'rate_limit' || 
           shipHeroError.type === 'system' ||
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * 
                  Math.pow(this.retryConfig.backoffMultiplier, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a structured error from GraphQL error
   */
  private createShipHeroError(error: any): ShipHeroError {
    const extensions = error.extensions || {};
    
    switch (extensions.code) {
      case 'UNAUTHENTICATED':
        return {
          type: 'authentication',
          message: 'Authentication failed - token may be expired',
          code: extensions.code
        };
      
      case 'FORBIDDEN':
        return {
          type: 'authorization',
          message: 'Insufficient permissions for this operation',
          code: extensions.code
        };
      
      case 'BAD_USER_INPUT':
        return {
          type: 'validation',
          message: error.message,
          code: extensions.code,
          field: extensions.field,
          details: extensions.details
        };
      
      case 'RATE_LIMITED':
        return {
          type: 'rate_limit',
          message: 'Rate limit exceeded - please retry after delay',
          code: extensions.code,
          details: extensions.retryAfter
        };
      
      default:
        return {
          type: 'system',
          message: error.message || 'Unknown error occurred',
          code: extensions.code
        };
    }
  }
}

