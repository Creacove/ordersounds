
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { processPurchase, isValidSolanaAddress, processMultiplePayments } from '@/utils/solanaTransactions';
import { supabase } from '@/integrations/supabase/client';

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
    productData?: { id: string, title: string, price: number }
  ) => {
    setIsProcessing(true);
    
    try {
      if (!wallet.connected || !wallet.publicKey) {
        toast.error("Please connect your wallet first");
        throw new Error("Wallet not connected");
      }
      
      if (!isValidSolanaAddress(producerWalletAddress)) {
        toast.error("Creator wallet address is invalid");
        throw new Error("Invalid creator wallet address");
      }
      
      const signature = await processPurchase(
        amount,
        producerWalletAddress,
        connection,
        wallet
      );
      
      setLastTransactionSignature(signature);
      
      // If this is a product purchase (not just a direct payment)
      // save the order to the database
      if (productData) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) {
          throw new Error("User not authenticated");
        }

        // Create an order record with status explicitly set to completed
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userData.user.id,
            total_amount: amount,
            status: 'completed', // Ensure status is always completed for successful purchases
            transaction_signatures: [signature]
          })
          .select()
          .single();
          
        if (orderError) {
          console.error("Error creating order:", orderError);
          throw new Error("Failed to save order");
        }
        
        // Create order item record
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
          console.error("Error creating order item:", itemError);
          throw new Error("Failed to save order item");
        }
      }
      
      toast.success("Payment successful!");
      
      if (onSuccess) {
        onSuccess(signature);
      }
      
      return signature;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Method for processing multiple payments
  const makeMultiplePayments = async (
    items: { price: number, producerWallet: string }[],
    onSuccess?: (signatures: string[]) => void,
    onError?: (error: any) => void
  ) => {
    setIsProcessing(true);
    
    try {
      if (!wallet.connected || !wallet.publicKey) {
        toast.error("Please connect your wallet first");
        throw new Error("Wallet not connected");
      }
      
      const signatures = await processMultiplePayments(
        items,
        connection,
        wallet
      );
      
      if (signatures.length > 0) {
        setLastTransactionSignature(signatures[signatures.length - 1]);
      }
      
      toast.success("All payments processed successfully!");
      
      if (onSuccess) {
        onSuccess(signatures);
      }
      
      return signatures;
    } catch (error: any) {
      console.error("Multiple payments error:", error);
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
      
      if (onError) {
        onError(error);
      }
      
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
