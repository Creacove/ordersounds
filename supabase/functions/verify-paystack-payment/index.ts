
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function to handle edge function requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Paystack secret key from environment
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      console.error('Missing Paystack secret key');
      throw new Error('Missing Paystack secret key');
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { reference, orderId } = body;
    
    if (!reference) {
      console.error('Missing payment reference');
      throw new Error('Missing payment reference');
    }

    console.log(`Processing verification for reference: ${reference}, order: ${orderId}`);

    // Verify the payment with Paystack
    console.log(`Making request to Paystack API: https://api.paystack.co/transaction/verify/${reference}`);
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error(`Paystack API error (${verifyResponse.status}):`, errorText);
      throw new Error(`Paystack API error: ${verifyResponse.status} ${errorText}`);
    }

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification response:', JSON.stringify(verifyData));

    // Check if payment was successful
    const isVerified = 
      verifyData.status === true && 
      verifyData.data.status === 'success';

    console.log(`Payment verification result: ${isVerified ? 'VERIFIED' : 'FAILED'}`);

    // If verified, update the database
    if (isVerified && orderId) {
      // Create a Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials');
        throw new Error('Server configuration error');
      }
      
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      console.log(`Updating order ${orderId} to completed status`);
      
      // Update order status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'completed',
          consent_timestamp: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Get cart items associated with this order
      const { data: lineItems, error: lineItemsError } = await supabaseClient
        .from('line_items')
        .select('beat_id, price_charged, currency_code')
        .eq('order_id', orderId);

      if (lineItemsError) {
        console.error('Failed to fetch line items:', lineItemsError);
        throw new Error(`Failed to fetch order items: ${lineItemsError.message}`);
      }

      // Get buyer ID from order
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .select('buyer_id')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('Failed to fetch order details:', orderError);
        throw new Error(`Failed to fetch order details: ${orderError?.message || 'Order not found'}`);
      }

      // Add purchased beats to user's collection
      const purchasedItems = lineItems.map(item => ({
        user_id: orderData.buyer_id,
        beat_id: item.beat_id,
        license_type: 'basic', // Default to basic, can be customized based on your needs
        currency_code: item.currency_code,
        order_id: orderId,
      }));
      
      if (purchasedItems.length > 0) {
        console.log(`Adding ${purchasedItems.length} purchased beats to user collection`);
        const { error: purchaseError } = await supabaseClient
          .from('user_purchased_beats')
          .insert(purchasedItems);
        
        if (purchaseError) {
          console.error('Failed to record purchases:', purchaseError);
          throw new Error(`Recording purchases failed: ${purchaseError.message}`);
        }
      }

      // Log transaction details for auditing
      console.log(`Payment verification completed successfully for order ${orderId} with transaction reference ${reference}`);
      
      // Return successful verification to client
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          message: 'Payment successfully verified',
          data: {
            reference: reference,
            amount: verifyData.data.amount / 100, // Convert from kobo back to naira
            orderId: orderId,
          },
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      // Payment verification failed
      console.log(`Payment verification failed for reference ${reference}`);
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Payment verification failed',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Still return 200 to handle this gracefully on client
        }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to verify payment',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
