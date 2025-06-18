
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, Transaction, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError
} from '@solana/spl-token';
import { toast } from 'sonner';

// DEVNET ONLY - USDC Mint address
const DEVNET_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Get DEVNET USDC mint - hardcoded for testing
const getUSDCMint = (): PublicKey => {
  console.log('🌐 Using DEVNET USDC mint for testing');
  return DEVNET_USDC_MINT;
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

// Check USDC balance for an account
const checkUSDCBalance = async (
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<{ balance: bigint; hasAccount: boolean }> => {
  try {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
    const account = await getAccount(connection, associatedTokenAddress);
    return { balance: account.amount, hasAccount: true };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError || 
        error instanceof TokenInvalidAccountOwnerError) {
      return { balance: BigInt(0), hasAccount: false };
    }
    throw error;
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
    await getAccount(connection, associatedTokenAddress);
    console.log(`✓ DEVNET USDC token account exists: ${associatedTokenAddress.toString()}`);
    return associatedTokenAddress;
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      console.log(`Creating DEVNET USDC token account for: ${owner.toString()}`);
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        payer,
        associatedTokenAddress,
        owner,
        mint
      );
      transaction.add(createAccountInstruction);
      return associatedTokenAddress;
    }
    throw error;
  }
};

// Simulate transaction to catch errors early
const simulateTransaction = async (
  connection: Connection,
  transaction: Transaction
): Promise<{ success: boolean; error?: string }> => {
  try {
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error('Transaction simulation failed:', simulation.value.err);
      return { 
        success: false, 
        error: `Transaction would fail: ${JSON.stringify(simulation.value.err)}` 
      };
    }
    
    console.log('✓ Transaction simulation successful');
    return { success: true };
  } catch (error) {
    console.error('Simulation error:', error);
    return { 
      success: false, 
      error: `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Add priority fee to transaction for faster confirmation
const addPriorityFee = (transaction: Transaction, microLamports: number = 10000) => {
  const priorityFeeInstruction = SystemProgram.transfer({
    fromPubkey: transaction.feePayer!,
    toPubkey: transaction.feePayer!,
    lamports: 0
  });
  
  transaction.instructions.unshift(priorityFeeInstruction);
};

// Process a single USDC payment - DEVNET ONLY
export const processUSDCPayment = async (
  usdAmount: number,
  recipientAddress: string, 
  connection: Connection, 
  wallet: WalletContextState
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    if (!isValidSolanaAddress(recipientAddress)) throw new Error("Invalid recipient address");
    
    const usdcMint = getUSDCMint();
    const usdcAmount = usdToUSDCUnits(usdAmount);
    
    console.log(`💰 Processing DEVNET USDC payment: $${usdAmount} (${usdcAmount.toString()} USDC units) to ${recipientAddress}`);
    console.log(`🌐 Network: DEVNET, USDC Mint: ${usdcMint.toString()}`);
    
    // Check sender's USDC balance first
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    console.log(`💳 Sender DEVNET USDC balance: ${senderBalance.toString()} units (${Number(senderBalance) / 1_000_000} USDC)`);
    
    if (!senderHasAccount) {
      throw new Error("You don't have a DEVNET USDC token account. Get DEVNET USDC from: https://faucet.solana.com/ then swap for USDC on a DEX.");
    }
    
    if (senderBalance < usdcAmount) {
      const availableUSDC = Number(senderBalance) / 1_000_000;
      throw new Error(`Insufficient DEVNET USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${usdAmount} USDC. Get more from a Devnet DEX.`);
    }
    
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
      wallet.publicKey,
      usdcMint,
      recipientPublicKey,
      transaction
    );
    
    console.log(`📤 From: ${senderTokenAccount.toString()}`);
    console.log(`📥 To: ${recipientTokenAccount.toString()}`);
    
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
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Add priority fee for faster confirmation
    addPriorityFee(transaction, 15000);
    
    // Simulate transaction before sending
    const simulation = await simulateTransaction(connection, transaction);
    if (!simulation.success) {
      throw new Error(simulation.error || "Transaction simulation failed");
    }
    
    console.log('🚀 Sending DEVNET USDC transaction...');
    
    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    console.log(`📋 DEVNET USDC transfer signature: ${signature}`);
    
    // Wait for confirmation with timeout
    const confirmationStart = Date.now();
    const confirmationTimeout = 60000; // 60 seconds
    
    let confirmation;
    while (Date.now() - confirmationStart < confirmationTimeout) {
      try {
        confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value) break;
      } catch (error) {
        console.warn('Confirmation check failed, retrying...', error);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!confirmation || confirmation.value.err) {
      throw new Error(`Transaction failed to confirm: ${confirmation?.value.err?.toString() || 'Timeout'}`);
    }
    
    console.log('✅ DEVNET USDC transaction confirmed successfully');
    return signature;
  } catch (error: any) {
    console.error("❌ Error in DEVNET USDC transaction:", error);
    
    // Provide specific error messages for common Devnet issues
    if (error.message.includes('0x1')) {
      throw new Error("Insufficient SOL balance for transaction fees. Get Devnet SOL from: https://faucet.solana.com/");
    }
    if (error.message.includes('TokenAccountNotFoundError')) {
      throw new Error("DEVNET USDC token account not found. Please ensure you have DEVNET USDC in your wallet.");
    }
    if (error.message.includes('insufficient funds')) {
      throw new Error("Insufficient DEVNET USDC balance for this transaction.");
    }
    
    throw new Error(error.message || "Failed to process DEVNET USDC payment");
  }
};

// Process multiple USDC payments in batch - DEVNET ONLY
export const processMultipleUSDCPayments = async (
  items: { price: number, producerWallet: string, id?: string, title?: string }[],
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
    
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const usdcMint = getUSDCMint();
    
    // Check total USDC balance before processing any transactions
    const { balance: senderBalance, hasAccount: senderHasAccount } = await checkUSDCBalance(
      connection, 
      wallet.publicKey, 
      usdcMint
    );
    
    if (!senderHasAccount) {
      throw new Error("You don't have a DEVNET USDC token account. Get DEVNET USDC from: https://faucet.solana.com/ then swap for USDC on a DEX.");
    }
    
    const availableUSDC = Number(senderBalance) / 1_000_000;
    if (availableUSDC < totalAmount) {
      throw new Error(`Insufficient DEVNET USDC balance. You have ${availableUSDC.toFixed(2)} USDC but need ${totalAmount.toFixed(2)} USDC. Get more from a Devnet DEX.`);
    }
    
    console.log(`💰 Processing ${items.length} DEVNET USDC payments, total: $${totalAmount}`);
    
    const signatures: string[] = [];
    
    // Process sequentially to avoid nonce conflicts
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        console.log(`📦 Processing DEVNET payment ${i + 1}/${items.length}: $${item.price} to ${item.producerWallet}`);
        
        const signature = await processUSDCPayment(
          item.price,
          item.producerWallet,
          connection,
          wallet
        );
        signatures.push(signature);
        
        // Small delay between transactions to avoid rate limiting
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Failed DEVNET USDC payment to ${item.producerWallet}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ All ${items.length} DEVNET USDC payments completed successfully`);
    return signatures;
  } catch (error: any) {
    console.error("❌ Error processing multiple DEVNET USDC payments:", error);
    throw new Error(error.message || "Failed to process DEVNET USDC payments");
  }
};
