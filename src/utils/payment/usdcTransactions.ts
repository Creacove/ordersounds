
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { toast } from 'sonner';
import { createOptimalConnection, getBestRpcEndpoint } from './rpcHealthCheck';

// USDC Mint addresses for different networks
const USDC_MINT_ADDRESSES = {
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  'devnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  'testnet': new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
};

// Get current network's USDC mint
const getUSDCMint = (network: string = 'devnet'): PublicKey => {
  return USDC_MINT_ADDRESSES[network] || USDC_MINT_ADDRESSES.devnet;
};

// Check if a string is a valid Solana address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    if (!address) return false;
    new PublicKey(address);
    return true;
  } catch (error) {
    console.error("Invalid Solana address:", error);
    return false;
  }
};

// Convert USD amount to USDC units (6 decimals)
const usdToUSDCUnits = (usdAmount: number): bigint => {
  return BigInt(Math.round(usdAmount * 1_000_000)); // USDC has 6 decimals
};

// Enhanced connection health check
const ensureHealthyConnection = async (connection: Connection, network: string): Promise<Connection> => {
  try {
    // Quick health check
    await connection.getSlot();
    return connection;
  } catch (error: any) {
    console.warn('⚠️ Connection unhealthy, getting new endpoint...', error.message);
    
    // Get a new optimal connection
    const networkKey = network === 'mainnet-beta' ? 'mainnet' : 'devnet';
    return await createOptimalConnection(networkKey);
  }
};

// Create or get associated token account
const getOrCreateAssociatedTokenAccount = async (
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  transaction: Transaction
): Promise<PublicKey> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
  
  try {
    // Check if account exists
    await getAccount(connection, associatedTokenAddress);
    return associatedTokenAddress;
  } catch (error) {
    // Account doesn't exist, create it
    const createAccountInstruction = createAssociatedTokenAccountInstruction(
      payer,
      associatedTokenAddress,
      owner,
      mint
    );
    transaction.add(createAccountInstruction);
    return associatedTokenAddress;
  }
};

// Process a single USDC payment with enhanced error handling
export const processUSDCPayment = async (
  usdAmount: number,
  recipientAddress: string, 
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("WALLET_NOT_CONNECTED");
    if (!isValidSolanaAddress(recipientAddress)) throw new Error("INVALID_RECIPIENT_ADDRESS");
    
    console.log(`🔄 Starting USDC payment: $${usdAmount} to ${recipientAddress}`);
    
    // Ensure we have a healthy connection
    const healthyConnection = await ensureHealthyConnection(connection, network);
    
    const usdcMint = getUSDCMint(network);
    const usdcAmount = usdToUSDCUnits(usdAmount);
    
    console.log(`💰 Processing ${usdcAmount.toString()} USDC units on ${network}`);
    
    const transaction = new Transaction();
    
    // Get sender's USDC token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      healthyConnection,
      wallet.publicKey,
      usdcMint,
      wallet.publicKey,
      transaction
    );
    
    // Get recipient's USDC token account
    const recipientPublicKey = new PublicKey(recipientAddress);
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      healthyConnection,
      wallet.publicKey, // Payer for account creation
      usdcMint,
      recipientPublicKey,
      transaction
    );
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      wallet.publicKey,
      usdcAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    transaction.add(transferInstruction);
    
    // Get the latest blockhash with retry logic
    let blockhash: string;
    let lastValidBlockHeight: number;
    
    try {
      const blockhashInfo = await healthyConnection.getLatestBlockhash('confirmed');
      blockhash = blockhashInfo.blockhash;
      lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
      console.log(`📋 Got blockhash: ${blockhash.slice(0, 8)}...`);
    } catch (error: any) {
      console.error('❌ Failed to get blockhash:', error);
      
      if (error.message.includes('403') || error.message.includes('rate limit')) {
        throw new Error("RPC_RATE_LIMITED: The network is currently rate limiting requests. Please try again in a moment.");
      } else if (error.message.includes('timeout')) {
        throw new Error("RPC_TIMEOUT: Network connection timed out. Please check your internet connection and try again.");
      } else {
        throw new Error(`RPC_ERROR: Failed to connect to Solana network. ${error.message}`);
      }
    }
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send the transaction with retry logic
    let signature: string;
    
    try {
      console.log('✍️ Signing and sending transaction...');
      signature = await wallet.sendTransaction(transaction, healthyConnection, {
        maxRetries: 3,
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      console.log(`📝 Transaction signature: ${signature}`);
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      
      if (error.message.includes('User rejected')) {
        throw new Error("TRANSACTION_REJECTED: Transaction was cancelled by user");
      } else if (error.message.includes('insufficient funds')) {
        throw new Error("INSUFFICIENT_FUNDS: Insufficient USDC balance for this transaction");
      } else if (error.message.includes('blockhash not found')) {
        throw new Error("BLOCKHASH_EXPIRED: Transaction expired. Please try again.");
      } else {
        throw new Error(`TRANSACTION_FAILED: ${error.message}`);
      }
    }
    
    // Wait for confirmation with timeout
    try {
      console.log('⏳ Waiting for transaction confirmation...');
      const confirmation = await healthyConnection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`CONFIRMATION_FAILED: ${confirmation.value.err.toString()}`);
      }
      
      console.log('✅ Transaction confirmed successfully!');
      return signature;
    } catch (error: any) {
      console.error('❌ Confirmation failed:', error);
      throw new Error(`CONFIRMATION_TIMEOUT: Transaction may have succeeded but confirmation timed out. Signature: ${signature}`);
    }
    
  } catch (error: any) {
    console.error("❌ USDC payment error:", error);
    
    // Re-throw with clear error types for better handling
    if (error.message.startsWith('WALLET_') || 
        error.message.startsWith('RPC_') || 
        error.message.startsWith('TRANSACTION_') ||
        error.message.startsWith('CONFIRMATION_') ||
        error.message.startsWith('INSUFFICIENT_')) {
      throw error;
    }
    
    throw new Error(`PAYMENT_ERROR: ${error.message || "Unknown error occurred"}`);
  }
};

// Process multiple USDC payments in batch
export const processMultipleUSDCPayments = async (
  items: { price: number, producerWallet: string, id?: string, title?: string }[],
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string[]> => {
  try {
    if (!wallet.publicKey) throw new Error("WALLET_NOT_CONNECTED");
    
    // Validate all recipient addresses first
    for (const item of items) {
      if (!isValidSolanaAddress(item.producerWallet)) {
        throw new Error(`INVALID_ADDRESS: Invalid recipient address for ${item.title || 'item'}`);
      }
    }
    
    console.log(`🔄 Processing ${items.length} USDC payments...`);
    
    const signatures: string[] = [];
    
    // Process sequentially to avoid overwhelming the RPC
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`💳 Payment ${i + 1}/${items.length}: $${item.price} to ${item.producerWallet}`);
      
      try {
        const signature = await processUSDCPayment(
          item.price,
          item.producerWallet,
          connection,
          wallet,
          network
        );
        signatures.push(signature);
        
        // Small delay between transactions to avoid rate limiting
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Payment failed for ${item.title}:`, error);
        throw new Error(`BATCH_PAYMENT_FAILED: Payment ${i + 1} failed: ${error.message}`);
      }
    }
    
    console.log(`✅ All ${signatures.length} payments completed successfully!`);
    return signatures;
  } catch (error: any) {
    console.error("❌ Multiple USDC payments error:", error);
    throw error;
  }
};
