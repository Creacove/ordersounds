
import { 
    Connection, 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    LAMPORTS_PER_SOL 
  } from '@solana/web3.js';
  import { useWallet } from '@solana/wallet-adapter-react';
  import { toast } from 'sonner';
  import { supabase } from '@/integrations/supabase/client';
  
  // Platform wallet address to receive fees
  const PLATFORM_WALLET = new PublicKey('5mLF6mwykxMXeb24KvMpi5aPXVgJbTPKAmk1pVzMHW8Q');
  const PLATFORM_FEE_PERCENTAGE = 0.1; // 10%
  
  /**
   * Processes a purchase transaction on Solana
   * @param price The price in USD
   * @param producerWalletAddress The producer's wallet address to receive payment
   * @param connection The Solana connection object
   * @param buyerWallet The buyer's wallet adapter
   * @returns Transaction signature if successful
   */
  export const processPurchase = async (
    price: number, 
    producerWalletAddress: string,
    connection: Connection,
    buyerWallet: ReturnType<typeof useWallet>
  ): Promise<string> => {
    if (!buyerWallet.publicKey || !buyerWallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    
    if (!producerWalletAddress) {
      throw new Error("Producer wallet not found");
    }
  
    // Convert USD price to SOL (using a fixed exchange rate for simplicity)
    // In a production app, you would use a price oracle
    const usdToSolRate = 100; // Example: 1 SOL = $100
    const priceInSol = price / usdToSolRate;
    const priceInLamports = priceInSol * LAMPORTS_PER_SOL;
    
    // Calculate platform fee
    const platformFeeAmount = priceInLamports * PLATFORM_FEE_PERCENTAGE;
    const producerAmount = priceInLamports - platformFeeAmount;
    
    // Create a transaction
    const transaction = new Transaction();
    
    // Add platform fee transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyerWallet.publicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: Math.round(platformFeeAmount)
      })
    );
    
    // Add producer payment instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyerWallet.publicKey,
        toPubkey: new PublicKey(producerWalletAddress),
        lamports: Math.round(producerAmount)
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = buyerWallet.publicKey;
    
    // Sign and send the transaction
    const signedTransaction = await buyerWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  };
  
  /**
   * Process multiple purchases at once, with separate transactions for each producer
   * @param items Array of items with price and producer wallet address
   * @param connection The Solana connection object
   * @param buyerWallet The buyer's wallet adapter
   * @returns Array of transaction signatures
   */
  export const processMultiplePayments = async (
    items: { price: number, producerWallet: string }[],
    connection: Connection,
    buyerWallet: ReturnType<typeof useWallet>
  ): Promise<string[]> => {
    if (!buyerWallet.publicKey || !buyerWallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    
    const signatures: string[] = [];
    
    // Group items by producer wallet
    const itemsByproducer: Record<string, number> = {};
    items.forEach(item => {
      if (!isValidSolanaAddress(item.producerWallet)) {
        throw new Error(`Invalid producer wallet address: ${item.producerWallet}`);
      }
      
      if (itemsByproducer[item.producerWallet]) {
        itemsByproducer[item.producerWallet] += item.price;
      } else {
        itemsByproducer[item.producerWallet] = item.price;
      }
    });
    
    // Process payment for each producer separately
    for (const [producerWallet, totalAmount] of Object.entries(itemsByproducer)) {
      try {
        const signature = await processPurchase(
          totalAmount, 
          producerWallet,
          connection,
          buyerWallet
        );
        signatures.push(signature);
      } catch (error) {
        console.error(`Error processing payment to ${producerWallet}:`, error);
        throw error; // Re-throw to handle in the calling function
      }
    }
    
    return signatures;
  };
  
  /**
   * Check if a wallet address is valid
   * @param address The wallet address to check
   * @returns boolean indicating if the address is valid
   */
  export const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };
  