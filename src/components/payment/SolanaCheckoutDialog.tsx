
import { useState, useEffect } from "react";
import { useSolanaPayment } from "@/hooks/payment/useSolanaPayment";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from '@solana/wallet-adapter-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import WalletButton from "../wallet/WalletButton";

interface CartItem {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string;
  quantity: number;
  producer_wallet?: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onCheckoutSuccess: () => void;
}

export const SolanaCheckoutDialog = ({
  open,
  onOpenChange,
  cartItems,
  onCheckoutSuccess
}: CheckoutDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [validatedItems, setValidatedItems] = useState<CartItem[]>([]);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { makePayment, isProcessing, isWalletConnected } = useSolanaPayment();
  const wallet = useWallet();
  
  // Add debug logs for dialog state
  useEffect(() => {
    console.log("SolanaCheckoutDialog - open state changed:", open);
    console.log("SolanaCheckoutDialog - cartItems count:", cartItems?.length);
    console.log("SolanaCheckoutDialog - wallet connected:", wallet.connected);
  }, [open, cartItems, wallet.connected]);
  
  // Re-validate wallet addresses when dialog opens
  useEffect(() => {
    const checkWalletAddresses = async () => {
      if (!open || cartItems.length === 0) return;
      
      setValidationError('');
      setValidationComplete(false);
      console.log("Validating wallet addresses for items:", cartItems);

      try {
        // Extract product IDs for database verification
        const productIds = cartItems.map(item => item.id);
        
        // Get the producer IDs for these beats
        const { data: beatsData, error: beatsError } = await supabase
          .from('beats')
          .select('id, producer_id')
          .in('id', productIds);
          
        if (beatsError) {
          console.error("Error fetching beats data:", beatsError);
          throw beatsError;
        }
        
        if (!beatsData || beatsData.length === 0) {
          console.error("No beats data returned");
          setValidationError("Could not verify beat information");
          return;
        }
        
        // Extract producer IDs
        const producerIds = beatsData.map(beat => beat.producer_id);
        
        console.log("Producer IDs to check:", producerIds);
        
        // Get the wallet addresses for these producers
        const { data: producersData, error: producersError } = await supabase
          .from('users')
          .select('id, wallet_address')
          .in('id', producerIds);
          
        if (producersError) {
          console.error("Error fetching producer data:", producersError);
          throw producersError;
        }
        
        console.log("Producer data from database:", producersData);
        
        // Create producer wallet map
        const producerWalletMap: Record<string, string | null> = {};
        producersData?.forEach(producer => {
          producerWalletMap[producer.id] = producer.wallet_address;
          console.log(`Producer ${producer.id} wallet: ${producer.wallet_address || 'MISSING'}`);
        });
        
        // Create beat-to-producer map
        const beatProducerMap: Record<string, string> = {};
        beatsData.forEach(beat => {
          beatProducerMap[beat.id] = beat.producer_id;
        });
        
        // Update cart items with verified wallet addresses
        const updatedItems = cartItems.map(item => {
          const producerId = beatProducerMap[item.id];
          const verifiedWalletAddress = producerId ? producerWalletMap[producerId] : null;
          
          console.log(`Item ${item.id} - producer ${producerId} - wallet: ${verifiedWalletAddress || 'MISSING'}`);
          
          return {
            ...item,
            producer_wallet: verifiedWalletAddress || item.producer_wallet
          };
        });
        
        console.log("Updated items with verified wallet addresses:", updatedItems);
        
        // Check if any item is missing a wallet address
        const missingWallets = updatedItems.filter(item => {
          const hasWallet = !!item.producer_wallet;
          console.log(`Item ${item.id} has wallet: ${hasWallet} (${item.producer_wallet || 'null'})`);
          return !hasWallet;
        });
        
        if (missingWallets.length > 0) {
          console.error("Items missing wallet addresses:", missingWallets);
          setValidationError(`${missingWallets.length} item(s) cannot be purchased due to missing wallet address`);
          return;
        }
        
        setValidatedItems(updatedItems);
        setValidationComplete(true);
      } catch (error: any) {
        console.error('Error validating wallet addresses:', error);
        setValidationError('Error validating producer payment information: ' + (error.message || 'Unknown error'));
      }
    };
    
    if (open) {
      checkWalletAddresses();
    }
  }, [open, cartItems]);
  
  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Group items by producer for payment processing
  const getItemsByProducer = () => {
    const itemsToUse = validatedItems.length > 0 ? validatedItems : cartItems;
    const groupedItems: Record<string, { items: CartItem[], total: number }> = {};
    
    itemsToUse.forEach(item => {
      const producerWallet = item.producer_wallet || '';
      if (!producerWallet) {
        console.error(`Missing wallet address for item: ${item.title}`);
        return;
      }
      
      if (!groupedItems[producerWallet]) {
        groupedItems[producerWallet] = { items: [], total: 0 };
      }
      
      groupedItems[producerWallet].items.push(item);
      groupedItems[producerWallet].total += item.price * item.quantity;
    });
    
    return Object.entries(groupedItems).map(([wallet, data]) => ({
      producerWallet: wallet,
      items: data.items,
      total: data.total
    }));
  };
  
  const handleCheckout = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!validationComplete) {
      toast.error("Please wait for wallet validation to complete");
      return;
    }
    
    setIsCheckingOut(true);
    const groupedItems = getItemsByProducer();
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Create order header - immediately set as completed since we're going to validate it
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: userData.user.id,
          total_price: totalPrice,
          status: 'completed', // Initialize as completed, we'll delete if payments fail
          currency_used: 'USDC',
          payment_method: 'solana'
        })
        .select()
        .single();
        
      if (orderError) {
        console.error("Order creation error:", orderError);
        toast.error("Could not process your order");
        return;
      }
      
      console.log("Created order:", order);
      
      // Process payments for each producer
      let successfulPayments = 0;
      let transactionSignatures: string[] = [];
      
      for (const group of groupedItems) {
        try {
          if (!group.producerWallet) {
            toast.error(`Missing producer wallet address for ${group.items[0].title}`);
            continue;
          }
          
          console.log(`Processing payment of ${group.total} to wallet ${group.producerWallet}`);
          
          // Process payment for this producer's items
          const signature = await makePayment(
            group.total,
            group.producerWallet,
            (sig) => {
              successfulPayments++;
              transactionSignatures.push(sig);
            },
            (err) => console.error(`Payment error for ${group.producerWallet}:`, err)
          );
          
          // Create order items for this producer's items
          const orderItems = group.items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            title: item.title
          }));
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
          if (itemsError) {
            console.error("Order items error:", itemsError);
            toast.error("Could not register all items in your order");
          }
          
        } catch (error) {
          console.error("Checkout error for producer:", error);
          toast.error(`Error processing payment to producer`);
        }
      }
      
      // Update order status based on payment results
      if (successfulPayments === groupedItems.length) {
        // All payments successful - status already set to completed
        if (transactionSignatures.length > 0) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              transaction_signatures: transactionSignatures
            })
            .eq('id', order.id);
            
          if (updateError) {
            console.error("Error updating transaction signatures:", updateError);
          }
        }
          
        toast.success("Purchase completed successfully!");
        onCheckoutSuccess();
      } else if (successfulPayments > 0) {
        // Some payments successful but not all - keep it as completed since some items were purchased
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            transaction_signatures: transactionSignatures
          })
          .eq('id', order.id);
          
        if (updateError) {
          console.error("Error updating transaction signatures:", updateError);
        }
          
        toast.warning("Some items were purchased successfully, but others failed");
        onCheckoutSuccess();
      } else {
        // No payments successful - delete the order entirely since nothing was purchased
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
          
        toast.error("Payment failed for all items");
      }
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setIsCheckingOut(false);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-purple-100 dark:border-purple-900/40 shadow-lg backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300">Complete your purchase</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You are about to purchase {cartItems.length} digital item(s) for ${totalPrice.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!wallet.connected && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-sm">Please connect your Solana wallet to complete this purchase</p>
              </div>
              <WalletButton className="w-full flex justify-center" />
            </div>
          )}
          
          {validationError ? (
            <div className="flex items-center p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">{validationError}</p>
            </div>
          ) : validationComplete ? (
            <div className="flex items-center p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">All producer wallet addresses verified</p>
            </div>
          ) : (
            <div className="flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300">
              <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
              <p className="text-sm">Verifying producer wallet addresses...</p>
            </div>
          )}
          
          <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
            <p className="mb-2">Your items will be available for download immediately after purchase.</p>
            <p className="text-sm text-muted-foreground">
              This checkout will process individual payments to each producer, with platform fees calculated per item.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isCheckingOut}
            className="w-full sm:w-auto transition-all hover:bg-background/80 border-gray-300 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-none transition-all hover:shadow-md" 
            onClick={handleCheckout} 
            disabled={isCheckingOut || !wallet.connected || !validationComplete || !!validationError}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Purchase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
