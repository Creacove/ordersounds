
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { processUSDCPayment, isValidSolanaAddress, processMultipleUSDCPayments } from '@/utils/payment/usdcTransactions';
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
  const [isMounted, setIsMounted] = useState(true);
  
  // Get current network
  const network = process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet';
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const validatePaymentInputs = useCallback((amount: number, producerWalletAddress: string) => {
    // Validate wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error("INVALID_AMOUNT: Payment amount must be positive");
    }
    
    // Validate producer wallet address
    if (!producerWalletAddress) {
      throw new Error("MISSING_ADDRESS: Producer wallet address is required");
    }
    
    if (!isValidSolanaAddress(producerWalletAddress)) {
      throw new Error("INVALID_ADDRESS: Creator wallet address is invalid");
    }
    
    return true;
  }, [wallet]);
  
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

    setIsProcessing(true);
    
    try {
      // Validate inputs
      validatePaymentInputs(amount, producerWalletAddress);

      console.log(`Processing USDC payment: $${amount} to ${producerWalletAddress}`);

      // Process USDC payment instead of SOL
      const signature = await processUSDCPayment(
        amount,
        producerWalletAddress,
        connection,
        wallet,
        network
      );

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (!confirmation.value) {
        throw new Error("TRANSACTION_NOT_CONFIRMED: Transaction failed to confirm");
      }

      if (isMounted) {
        setLastTransactionSignature(signature);
      }
      
      // Handle product purchase record if applicable
      if (productData) {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData?.user?.id) {
          throw new Error("USER_NOT_AUTHENTICATED: Please sign in to complete purchase");
        }

        // Create order record
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: userData.user.id,
            total_price: amount,
            status: 'completed',
            transaction_signatures: [signature],
            payment_method: 'solana_usdc',
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
      
      if (isMounted) {
        toast.success("USDC payment successful!");
      }
      onSuccess?.(signature);
      return signature;
    } catch (error: any) {
      console.error("USDC payment error:", error);
      const message = error.message.includes(':') 
        ? error.message.split(':').pop().trim() 
        : "Payment failed";
      
      if (isMounted) {
        toast.error(message);
      }
      onError?.(error);
      throw error;
    } finally {
      if (isMounted) {
        setIsProcessing(false);
      }
    }
  };

  const makeMultiplePayments = async (
    items: { price: number, producerWallet: string, id?: string, title?: string }[],
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
    const invalidItems = items.filter(item => 
      !item.producerWallet || !isValidSolanaAddress(item.producerWallet)
    );
    
    if (invalidItems.length > 0) {
      const errorMessage = `${invalidItems.length} items have invalid wallet addresses`;
      toast.error(errorMessage);
      onError?.({ message: `INVALID_ADDRESSES: ${errorMessage}` });
      return null;
    }

    setIsProcessing(true);
    
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("WALLET_NOT_CONNECTED: Please connect your wallet first");
      }

      console.log(`Processing ${items.length} USDC payments`);

      // Process multiple USDC payments
      let retries = 0;
      let lastError;
      let signatures: string[] = [];

      while (retries <= maxRetries) {
        try {
          signatures = await processMultipleUSDCPayments(items, connection, wallet, network);
          break;
        } catch (error) {
          lastError = error;
          retries++;
          if (retries <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            if (isMounted) {
              toast.info(`Retrying payments (attempt ${retries} of ${maxRetries})...`);
            }
          }
        }
      }

      if (!signatures.length) {
        throw lastError || new Error("PAYMENT_FAILED: All retries exhausted");
      }

      // Record transaction details in database if user is authenticated
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          // Create order record
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              buyer_id: userData.user.id,
              total_price: items.reduce((total, item) => total + item.price, 0),
              status: 'completed',
              transaction_signatures: signatures,
              payment_method: 'solana_usdc',
              currency_used: 'USDC'
            })
            .select()
            .single();
            
          if (!orderError && orderData) {
            // Create order items
            const orderItems = items.map(item => ({
              order_id: orderData.id,
              product_id: item.id || 'unknown',
              title: item.title || 'Beat purchase',
              price: item.price,
              quantity: 1,
            }));
            
            await supabase.from('order_items').insert(orderItems);
          }
        }
      } catch (dbError) {
        // Don't fail the transaction if database recording fails
        console.error("Failed to record transaction in database:", dbError);
      }

      if (isMounted) {
        setLastTransactionSignature(signatures[signatures.length - 1]);
        toast.success(`${signatures.length} USDC payments processed successfully!`);
      }
      onSuccess?.(signatures);
      return signatures;
    } catch (error: any) {
      console.error("Multiple USDC payments error:", error);
      const message = error.message.includes(':') 
        ? error.message.split(':').pop().trim() 
        : "Payments failed";
        
      if (isMounted) {
        toast.error(message);
      }
      onError?.(error);
      throw error;
    } finally {
      if (isMounted) {
        setIsProcessing(false);
      }
    }
  };

  return {
    makePayment,
    makeMultiplePayments,
    isProcessing,
    lastTransactionSignature,
    isWalletConnected: wallet.connected,
    walletAddress: wallet.publicKey?.toString(),
    network
  };
};
