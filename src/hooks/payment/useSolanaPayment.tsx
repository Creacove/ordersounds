
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { processPurchase, isValidSolanaAddress, processMultiplePayments } from '@/utils/payment/solanaTransactions';
import { supabase } from '@/integrations/supabase/client';

interface ProductData {
  id: string;
  title: string;
  price: number;
}

export const useSolanaPayment = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransactionSignature, setLastTransactionSignature] = useState<string | null>(null);

  const makePayment = async (
    amount: number,
    producerWalletAddress: string,
    onSuccess?: (signature: string) => void,
    onError?: (error: any) => void,
    productData?: ProductData
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    if (!amount || amount <= 0) {
      toast.error("Payment amount must be positive");
      return null;
    }

    setIsProcessing(true);
    
    try {
      // Validate inputs
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }
      
      if (!isValidSolanaAddress(producerWalletAddress)) {
        throw new Error("INVALID_ADDRESS: Creator wallet address is invalid");
      }

      // Process payment
      const signature = await processPurchase(
        amount,
        producerWalletAddress,
        connection,
        wallet
      );

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (!confirmation.value) {
        throw new Error("TRANSACTION_NOT_CONFIRMED: Transaction failed to confirm");
      }

      setLastTransactionSignature(signature);
      
      // Handle product purchase record if applicable
      if (productData) {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user?.id) {
          throw new Error("USER_NOT_AUTHENTICATED: Please sign in to complete purchase");
        }

        // Use transaction for data consistency
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: userData.user.id,
            total_price: amount,
            status: 'completed',
            transaction_signatures: [signature],
            payment_method: 'solana',
            currency_used: 'USDC'
          })
          .select()
          .single();

        if (orderError) throw new Error("ORDER_CREATION_FAILED: Failed to save order");

        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: productData.id,
            title: productData.title,
            price: productData.price,
            quantity: 1,
          });

        if (itemError) {
          // Attempt to clean up the order if items fail
          await supabase.from('orders').delete().eq('id', orderData.id);
          throw new Error("ORDER_ITEM_CREATION_FAILED: Failed to save order details");
        }
      }
      
      toast.success("Payment successful!");
      onSuccess?.(signature);
      return signature;
    } catch (error: any) {
      console.error("Payment error:", error);
      const message = error.message.includes(':') 
        ? error.message.split(':').pop().trim() 
        : "Payment failed";
      
      toast.error(message);
      onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const makeMultiplePayments = async (
    items: { price: number, producerWallet: string }[],
    onSuccess?: (signatures: string[]) => void,
    onError?: (error: any) => void,
    maxRetries = 2
  ) => {
    if (isProcessing) {
      toast.warning("Please wait for current transaction to complete");
      return null;
    }

    if (!items || items.length === 0) {
      toast.error("No payment items provided");
      return null;
    }

    // Validate all items have valid wallet addresses
    const invalidItems = items.filter(item => !isValidSolanaAddress(item.producerWallet));
    if (invalidItems.length > 0) {
      toast.error(`${invalidItems.length} items have invalid wallet addresses`);
      onError?.({ message: "INVALID_ADDRESSES: Some items have invalid wallet addresses" });
      return null;
    }

    setIsProcessing(true);
    
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }

      // Add retry logic
      let retries = 0;
      let lastError;
      let signatures: string[] = [];

      while (retries <= maxRetries) {
        try {
          signatures = await processMultiplePayments(items, connection, wallet);
          break;
        } catch (error) {
          lastError = error;
          retries++;
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            toast.info(`Retrying payment (attempt ${retries} of ${maxRetries})...`);
          }
        }
      }

      if (!signatures.length) {
        throw lastError || new Error("PAYMENT_FAILED: All retries exhausted");
      }

      setLastTransactionSignature(signatures[signatures.length - 1]);
      toast.success(`${signatures.length} payments processed successfully!`);
      onSuccess?.(signatures);
      return signatures;
    } catch (error: any) {
      console.error("Multiple payments error:", error);
      const message = error.message.includes(':') 
        ? error.message.split(':').pop().trim() 
        : "Payments failed";
        
      toast.error(message);
      onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    makePayment,
    makeMultiplePayments,
    isProcessing,
    lastTransactionSignature,
    isWalletConnected: wallet.connected,
    walletAddress: wallet.publicKey?.toString()
  };
};
