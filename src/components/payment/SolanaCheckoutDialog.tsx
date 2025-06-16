
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
import { Loader2, AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
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
  const { makePayment, isProcessing, isWalletConnected, network } = useSolanaPayment();
  const wallet = useWallet();
  
  // Add debug logs for dialog state
  useEffect(() => {
    console.log("SolanaCheckoutDialog - open state changed:", open);
    console.log("SolanaCheckoutDialog - cartItems count:", cartItems?.length);
    console.log("SolanaCheckoutDialog - wallet connected:", wallet.connected);
    console.log("SolanaCheckoutDialog - network:", network);
  }, [open, cartItems, wallet.connected, network]);
  
  // Re-validate wallet addresses when dialog opens
  useEffect(() => {
    const checkWalletAddresses = async () => {
      if (!open || cartItems.length === 0) return;
      
      setValidationError('');
      setValidationComplete(false);
      console.log("Validating USDC wallet addresses for items:", cartItems);

      try {
        const productIds = cartItems.map(item => item.id);
        
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
        
        const producerIds = beatsData.map(beat => beat.producer_id);
        console.log("Producer IDs to check:", producerIds);
        
        const { data: producersData, error: producersError } = await supabase
          .from('users')
          .select('id, wallet_address, stage_name')
          .in('id', producerIds);
          
        if (producersError) {
          console.error("Error fetching producer data:", producersError);
          throw producersError;
        }
        
        console.log("Producer data from database:", producersData);
        
        const producerWalletMap: Record<string, string | null> = {};
        const producersWithoutWallets: string[] = [];
        
        producersData?.forEach(producer => {
          producerWalletMap[producer.id] = producer.wallet_address;
          if (!producer.wallet_address) {
            producersWithoutWallets.push(producer.stage_name || 'Unknown Producer');
          }
          console.log(`Producer ${producer.stage_name} wallet: ${producer.wallet_address || 'MISSING'}`);
        });
        
        const beatProducerMap: Record<string, string> = {};
        beatsData.forEach(beat => {
          beatProducerMap[beat.id] = beat.producer_id;
        });
        
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
        
        const missingWallets = updatedItems.filter(item => {
          const hasWallet = !!item.producer_wallet;
          console.log(`Item ${item.id} has wallet: ${hasWallet} (${item.producer_wallet || 'null'})`);
          return !hasWallet;
        });
        
        if (missingWallets.length > 0) {
          console.error("Items missing wallet addresses:", missingWallets);
          setValidationError(`Cannot process payment: ${producersWithoutWallets.join(', ')} ${producersWithoutWallets.length === 1 ? 'has' : 'have'} not set up ${producersWithoutWallets.length === 1 ? 'their' : 'their'} Solana wallet address yet.`);
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
        throw new Error("Please log in to complete your purchase");
      }

      console.log(`Processing ${groupedItems.length} USDC payments on ${network} network`);

      // Process USDC payments for each producer first, then create order
      let successfulPayments = 0;
      let transactionSignatures: string[] = [];
      let paymentErrors: string[] = [];
      
      for (const group of groupedItems) {
        try {
          if (!group.producerWallet) {
            const errorMsg = `Missing producer wallet address for ${group.items[0].title}`;
            paymentErrors.push(errorMsg);
            console.error(errorMsg);
            continue;
          }
          
          console.log(`Processing USDC payment of $${group.total} to wallet ${group.producerWallet}`);
          
          const signature = await makePayment(
            group.total,
            group.producerWallet,
            (sig) => {
              successfulPayments++;
              transactionSignatures.push(sig);
              console.log(`USDC payment successful: ${sig}`);
            },
            (err) => {
              const errorMsg = `Payment failed for ${group.items[0].title}: ${err.message || 'Unknown error'}`;
              paymentErrors.push(errorMsg);
              console.error(`USDC payment error for ${group.producerWallet}:`, err);
            }
          );
          
          if (signature) {
            successfulPayments++;
            transactionSignatures.push(signature);
          }
          
        } catch (error: any) {
          const errorMsg = `Error processing payment for ${group.items[0].title}: ${error.message || 'Unknown error'}`;
          paymentErrors.push(errorMsg);
          console.error("Checkout error for producer:", error);
        }
      }
      
      // Only create order if we have successful payments
      if (successfulPayments > 0 && transactionSignatures.length > 0) {
        try {
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              buyer_id: userData.user.id,
              total_price: totalPrice,
              status: 'completed',
              currency_used: 'USDC',
              payment_method: 'solana_usdc',
              transaction_signatures: transactionSignatures
            })
            .select()
            .single();
            
          if (orderError) {
            console.error("Order creation error:", orderError);
            toast.error("Payments completed but failed to create order record");
          } else {
            console.log("Created order:", order);
            
            // Create order items for successful payments only
            const successfulItems = groupedItems
              .filter((_, index) => index < successfulPayments)
              .flatMap(group => group.items);
              
            const orderItems = successfulItems.map(item => ({
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
              toast.warning("Order created but some items may not be recorded properly");
            }
          }
        } catch (dbError) {
          console.error("Database error after successful payments:", dbError);
          toast.warning("Payments completed but failed to update order records");
        }
      }
      
      // Provide user feedback based on results
      if (successfulPayments === groupedItems.length) {
        toast.success("All USDC payments completed successfully!");
        onCheckoutSuccess();
      } else if (successfulPayments > 0) {
        toast.warning(`${successfulPayments} of ${groupedItems.length} payments completed successfully`);
        if (paymentErrors.length > 0) {
          toast.error(`Some payments failed: ${paymentErrors[0]}`);
        }
        onCheckoutSuccess();
      } else {
        const errorMessage = paymentErrors.length > 0 ? paymentErrors[0] : "All payments failed";
        toast.error(errorMessage);
      }
      
    } catch (error: any) {
      console.error("USDC checkout error:", error);
      const errorMessage = error.message || "An error occurred during checkout";
      toast.error(errorMessage);
    } finally {
      setIsCheckingOut(false);
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-purple-200 dark:border-purple-800 shadow-xl backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400">
            Complete USDC Payment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You are about to purchase {cartItems.length} digital item(s) for ${totalPrice.toFixed(2)} USDC on {network} network
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!wallet.connected && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-700/50 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Wallet Connection Required</p>
                  <p>Please connect your Solana wallet to complete this USDC purchase</p>
                </div>
              </div>
              <WalletButton className="w-full flex justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" />
            </div>
          )}
          
          {wallet.connected && (
            <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-700/50 dark:text-blue-300">
              <Wallet className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Connected: {wallet.publicKey?.toString().slice(0, 8)}...{wallet.publicKey?.toString().slice(-8)}</div>
                <div className="text-xs opacity-75 mt-0.5">Network: {network}</div>
              </div>
            </div>
          )}
          
          {validationError ? (
            <div className="flex items-start p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:border-red-700/50 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Validation Error</p>
                <p>{validationError}</p>
              </div>
            </div>
          ) : validationComplete ? (
            <div className="flex items-start p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-700/50 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Validation Complete</p>
                <p>All producer USDC wallet addresses verified</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-700/50 dark:text-blue-300">
              <Loader2 className="h-5 w-5 mr-3 animate-spin flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Verifying wallet addresses...</p>
                <p className="text-xs opacity-75 mt-0.5">Please wait while we validate producer payment information</p>
              </div>
            </div>
          )}
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-800/50">
            <div className="text-sm space-y-2">
              <p className="font-medium text-purple-800 dark:text-purple-300">✨ Instant Download Access</p>
              <p className="text-muted-foreground">Your items will be available for download immediately after USDC payment completion.</p>
              <p className="text-xs text-muted-foreground">This checkout processes individual USDC payments to each producer, with platform fees calculated per item.</p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isCheckingOut}
            className="w-full sm:w-auto transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleCheckout} 
            disabled={isCheckingOut || !wallet.connected || !validationComplete || !!validationError}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing USDC Payment...
              </>
            ) : (
              `Pay ${totalPrice.toFixed(2)} USDC`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
