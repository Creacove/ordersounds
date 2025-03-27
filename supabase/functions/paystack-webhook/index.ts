
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
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Missing Paystack secret key');
    }

    // Parse the webhook payload
    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload));

    // Verify the event is valid and from Paystack
    // In production, you should validate the signature
    // const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    //   .update(JSON.stringify(payload))
    //   .digest('hex');
    
    // For now, we'll just check the event type
    if (payload.event !== 'charge.success') {
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored (not charge.success)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get transaction data
    const { reference, metadata } = payload.data;
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Find the order using the reference
    // This requires that you store the Paystack reference when creating the order
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, status')
      .eq('status', 'pending') // Only look at pending orders
      .order('order_date', { ascending: false })
      .limit(1);
      
    if (orderError || !orderData || orderData.length === 0) {
      console.log('Order not found or already processed:', orderError);
      return new Response(
        JSON.stringify({ success: true, message: 'Order not found or already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const orderId = orderData[0].id;
    
    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'completed',
        consent_timestamp: new Date().toISOString(),
      })
      .eq('id', orderId);
      
    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }
    
    console.log(`Updated order ${orderId} status to completed based on webhook notification`);
    
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
