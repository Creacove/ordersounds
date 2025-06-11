
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

// Process a single USDC payment
export const processUSDCPayment = async (
  usdAmount: number,
  recipientAddress: string, 
  connection: Connection, 
  wallet: WalletContextState,
  network: string = 'devnet'
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!isValidSolanaAddress(recipientAddress)) throw new Error("Invalid recipient address");
    
    const usdcMint = getUSDCMint(network);
    const usdcAmount = usdToUSDCUnits(usdAmount);
    
    console.log(`Processing USDC payment: $${usdAmount} (${usdcAmount.toString()} USDC units) to ${recipientAddress}`);
    
    const transaction = new Transaction();
    
    // Get sender's USDC token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.publicKey,
      usdcMint,
      wallet.publicKey,
      transaction
    );
    
    // Get recipient's USDC token account
    const recipientPublicKey = new PublicKey(recipientAddress);
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
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
    
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 3,
      skipPreflight: false
    });
    
    console.log(`USDC transfer signature: ${signature}`);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    
    return signature;
  } catch (error: any) {
    console.error("Error in USDC transaction:", error);
    throw new Error(error.message || "Failed to process USDC payment");
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
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    // Validate all recipient addresses first
    for (const item of items) {
      if (!isValidSolanaAddress(item.producerWallet)) {
        throw new Error(`Invalid recipient address: ${item.producerWallet}`);
      }
    }
    
    const signatures: string[] = [];
    
    // For now, process sequentially to avoid complexity
    // TODO: Implement true batching with single transaction
    for (const item of items) {
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
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Failed USDC payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    return signatures;
  } catch (error: any) {
    console.error("Error processing multiple USDC payments:", error);
    throw new Error(error.message || "Failed to process USDC payments");
  }
};
