
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { toast } from 'sonner';

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

// Process a single purchase payment
export const processPurchase = async (
  amount: number,
  recipientAddress: string, 
  connection: Connection, 
  wallet: WalletContextState
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!isValidSolanaAddress(recipientAddress)) throw new Error("Invalid recipient address");
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: amount * 1000000000 // Convert USDC amount to lamports (1 SOL = 1,000,000,000 lamports)
      })
    );
    
    // Get the latest blockhash for the transaction
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }
    
    return signature;
  } catch (error: any) {
    console.error("Error in Solana transaction:", error);
    throw new Error(error.message || "Failed to process payment");
  }
};

// Process multiple payments in one go
export const processMultiplePayments = async (
  items: { price: number, producerWallet: string }[],
  connection: Connection, 
  wallet: WalletContextState
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
    
    // Process each payment sequentially
    for (const item of items) {
      try {
        const signature = await processPurchase(
          item.price,
          item.producerWallet,
          connection,
          wallet
        );
        signatures.push(signature);
      } catch (error: any) {
        console.error(`Failed payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    return signatures;
  } catch (error: any) {
    console.error("Error processing multiple payments:", error);
    throw new Error(error.message || "Failed to process payments");
  }
};
