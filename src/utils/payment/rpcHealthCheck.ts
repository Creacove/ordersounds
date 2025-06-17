
import { Connection } from '@solana/web3.js';

// RPC endpoint configurations with fallbacks
export const RPC_ENDPOINTS = {
  mainnet: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
  ],
  devnet: [
    'https://devnet.helius-rpc.com/?api-key=public',
    'https://api.devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet',
    'https://solana-devnet.g.alchemy.com/v2/demo'
  ]
};

export interface RpcHealthStatus {
  endpoint: string;
  isHealthy: boolean;
  latency?: number;
  error?: string;
}

// Check if an RPC endpoint is healthy
export const checkRpcHealth = async (endpoint: string): Promise<RpcHealthStatus> => {
  const startTime = Date.now();
  
  try {
    const connection = new Connection(endpoint, 'confirmed');
    
    // Try to get slot - this is a lightweight operation
    await connection.getSlot();
    
    const latency = Date.now() - startTime;
    
    return {
      endpoint,
      isHealthy: true,
      latency
    };
  } catch (error: any) {
    return {
      endpoint,
      isHealthy: false,
      error: error.message || 'Unknown error'
    };
  }
};

// Get the best available RPC endpoint
export const getBestRpcEndpoint = async (network: 'mainnet' | 'devnet'): Promise<string> => {
  const endpoints = RPC_ENDPOINTS[network];
  
  console.log(`🔍 Checking ${endpoints.length} RPC endpoints for ${network}...`);
  
  // Check all endpoints in parallel
  const healthChecks = await Promise.allSettled(
    endpoints.map(endpoint => checkRpcHealth(endpoint))
  );
  
  const healthyEndpoints: RpcHealthStatus[] = [];
  
  healthChecks.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.isHealthy) {
      healthyEndpoints.push(result.value);
      console.log(`✅ ${result.value.endpoint} - ${result.value.latency}ms`);
    } else {
      const error = result.status === 'rejected' ? result.reason : result.value.error;
      console.log(`❌ ${endpoints[index]} - ${error}`);
    }
  });
  
  if (healthyEndpoints.length === 0) {
    console.error('❌ No healthy RPC endpoints found!');
    // Return first endpoint as fallback
    return endpoints[0];
  }
  
  // Sort by latency and return the fastest
  healthyEndpoints.sort((a, b) => (a.latency || 999) - (b.latency || 999));
  const bestEndpoint = healthyEndpoints[0];
  
  console.log(`🚀 Best RPC endpoint: ${bestEndpoint.endpoint} (${bestEndpoint.latency}ms)`);
  return bestEndpoint.endpoint;
};

// Create a connection with automatic endpoint selection
export const createOptimalConnection = async (network: 'mainnet' | 'devnet'): Promise<Connection> => {
  const endpoint = await getBestRpcEndpoint(network);
  
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};
