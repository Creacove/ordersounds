
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  beat_id: string;
  title: string;
  price: number;
  license: string;
}

export const validateCartItems = async (user: any, cartItems: any[]) => {
  try {
    if (!user) {
      throw new Error('You must be logged in to complete this purchase.');
    }
    
    if (cartItems.length === 0) {
      throw new Error('Your cart is empty. Add items before checkout.');
    }
    
    const beatIds = cartItems.map(item => item.beat.id);
    
    const { data: beatsExist, error: beatCheckError } = await supabase
      .from('beats')
      .select('id, producer_id')
      .in('id', beatIds);
    
    if (beatCheckError) {
      console.error('Error checking beats existence:', beatCheckError);
      throw new Error(`Failed to validate beats: ${beatCheckError.message}`);
    }
    
    if (!beatsExist || beatsExist.length !== beatIds.length) {
      const existingIds = beatsExist?.map(b => b.id) || [];
      const missingIds = beatIds.filter(id => !existingIds.includes(id));
      
      console.error('Some beats in cart no longer exist:', missingIds);
      throw new Error('Some items in your cart are no longer available. Please refresh your cart.');
    }
    
    return true;
  } catch (error) {
    console.error('Cart validation error:', error);
    return { error: error.message };
  }
};

export const createOrder = async (user: any, totalAmount: number, orderItemsData: any[]) => {
  try {
    console.log('Creating order with items:', orderItemsData);
    
    // Create an order record first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_price: totalAmount,
        payment_method: 'Paystack',
        status: 'pending',
        currency_used: 'NGN'
      })
      .select('id')
      .single();
    
    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(`Order creation failed: ${orderError.message}`);
    }
    
    if (!orderData || !orderData.id) {
      throw new Error('Failed to create order: No order ID returned');
    }
    
    console.log('Order created with ID:', orderData.id);
    
    // Create line items for each beat in the cart
    const lineItems = orderItemsData.map(item => ({
      order_id: orderData.id,
      beat_id: item.beat_id,
      price_charged: item.price,
      currency_code: 'NGN',
    }));
    
    const { error: lineItemError } = await supabase
      .from('line_items')
      .insert(lineItems);
    
    if (lineItemError) {
      console.error('Line items error:', lineItemError);
      throw new Error(`Line items creation failed: ${lineItemError.message}`);
    }
    
    console.log('Line items created successfully');
    
    return { orderId: orderData.id };
  } catch (error) {
    console.error('Order creation error:', error);
    return { error: error.message };
  }
};

export const verifyPaystackPayment = async (paymentReference: string, orderId: string, orderItems: OrderItem[]) => {
  try {
    console.log('Payment success, verifying with backend...', paymentReference, orderId);
    
    // Show loading toast
    toast.loading('Verifying your payment...', { id: 'payment-verification' });
    
    // Call the verification edge function with explicit order items data
    const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
      body: { 
        reference: paymentReference, 
        orderId,
        orderItems
      },
    });
    
    // Always dismiss the loading toast
    toast.dismiss('payment-verification');
    
    if (error) {
      console.error('Verification error from edge function:', error);
      toast.error(`Payment verification failed: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
    
    console.log('Verification response:', data);
    
    if (data && data.verified) {
      return { success: true };
    } else {
      const errorMsg = data?.message || 'Payment verification failed';
      toast.error('Payment verification failed. Please try again or contact support with your reference: ' + paymentReference);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('Payment verification exception:', error);
    toast.dismiss('payment-verification');
    toast.error('There was an issue with your purchase. Please contact support with reference: ' + paymentReference);
    return { success: false, error: error.message };
  }
};
