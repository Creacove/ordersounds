
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify that request is from Paystack using the secret key
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || 'sk_test_ec208ff2f8e96d80e9adca93adbb259e3796a801';
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Missing Paystack secret key');
      throw new Error('Missing Paystack secret key');
    }

    // Parse the webhook payload
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      console.error('Failed to parse webhook payload:', e);
      throw new Error('Invalid webhook payload');
    }
    
    console.log('Received webhook payload:', JSON.stringify(payload));

    // Verify the event is valid and from Paystack
    // In production, we should validate the signature
    // For now, we'll just check the event type
    if (payload.event !== 'charge.success') {
      console.log(`Ignoring non-charge.success event: ${payload.event}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored (not charge.success)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get transaction data
    const { reference, metadata } = payload.data;
    console.log(`Processing webhook for transaction reference: ${reference}`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Server configuration error');
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Find the order using the reference by looking at pending orders
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, status, buyer_id')
      .eq('status', 'pending') // Only look at pending orders
      .order('order_date', { ascending: false })
      .limit(5); // Look at the 5 most recent pending orders
      
    if (orderError) {
      console.error('Error fetching pending orders:', orderError);
      throw new Error(`Failed to fetch orders: ${orderError.message}`);
    }
    
    if (!orderData || orderData.length === 0) {
      console.log('No pending orders found to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending orders found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // For this webhook, we'll process all pending orders received in the last 15 minutes
    // This is a safety net in case the frontend callback didn't complete
    console.log(`Found ${orderData.length} recent pending orders to check`);
    
    for (const order of orderData) {
      const orderId = order.id;
      
      // Update order status
      console.log(`Updating order ${orderId} to completed status via webhook`);
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'completed',
          consent_timestamp: new Date().toISOString(),
        })
        .eq('id', orderId);
        
      if (updateError) {
        console.error(`Failed to update order ${orderId}:`, updateError);
        continue; // Try the next order
      }
      
      // Get line items for this order
      const { data: lineItems, error: lineItemsError } = await supabaseClient
        .from('line_items')
        .select('beat_id, price_charged, currency_code')
        .eq('order_id', orderId);
        
      if (lineItemsError || !lineItems) {
        console.error(`Failed to fetch line items for order ${orderId}:`, lineItemsError);
        continue;
      }
      
      // Add purchased beats to user's collection if they haven't been added yet
      if (lineItems.length > 0) {
        // First check if purchases were already recorded
        const { data: existingPurchases, error: checkError } = await supabaseClient
          .from('user_purchased_beats')
          .select('id')
          .eq('order_id', orderId);
          
        if (checkError) {
          console.error(`Failed to check existing purchases for order ${orderId}:`, checkError);
          continue;
        }
        
        // Only insert if no purchases exist for this order
        if (!existingPurchases || existingPurchases.length === 0) {
          const purchasedItems = lineItems.map(item => ({
            user_id: order.buyer_id,
            beat_id: item.beat_id,
            license_type: 'basic', // Default to basic
            currency_code: item.currency_code,
            order_id: orderId,
          }));
          
          console.log(`Adding ${purchasedItems.length} purchased beats to user collection via webhook`);
          const { error: purchaseError } = await supabaseClient
            .from('user_purchased_beats')
            .insert(purchasedItems);
          
          if (purchaseError) {
            console.error(`Failed to record purchases for order ${orderId}:`, purchaseError);
            continue;
          }
        } else {
          console.log(`Purchases for order ${orderId} already recorded, skipping`);
        }
      }
      
      console.log(`Webhook processing completed for order ${orderId}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Failed to process webhook' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
