
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1'
import { Stripe } from 'https://esm.sh/stripe@12.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing session ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Verify session is paid
    if (session.payment_status === 'paid') {
      // Get the order ID from metadata
      const orderId = session.metadata?.order_id || session.client_reference_id;
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'Order ID not found in session metadata' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Check if the order exists and is not already processed
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('Error retrieving order:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // If order isn't already completed (webhook might not have processed yet),
      // update it now
      if (orderData.status !== 'completed') {
        // Get the user and items from metadata
        const userId = session.metadata?.user_id;
        const itemsJson = session.metadata?.items_json;
        
        if (!userId || !itemsJson) {
          console.error('Missing user or items metadata');
          return new Response(
            JSON.stringify({ error: 'Missing required metadata' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        try {
          const items = JSON.parse(itemsJson);
          
          // Update the order status
          await supabaseAdmin
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', orderId);
          
          // Create payment record if not exists
          const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('transaction_reference', session.id)
            .maybeSingle();
            
          if (!existingPayment) {
            await supabaseAdmin
              .from('payments')
              .insert({
                order_id: orderId,
                amount: session.amount_total / 100, // Convert from cents
                payment_method: 'Stripe',
                status: 'successful',
                transaction_reference: session.id,
                payment_details: session,
                producer_share: (session.amount_total / 100) * 0.9,
                platform_share: (session.amount_total / 100) * 0.1
              });
          }
          
          // Create user purchased beats records if not already created
          for (const item of items) {
            // Check if purchase record already exists
            const { data: existingPurchase } = await supabaseAdmin
              .from('user_purchased_beats')
              .select('id')
              .eq('user_id', userId)
              .eq('beat_id', item.beat_id)
              .eq('order_id', orderId)
              .maybeSingle();
              
            if (!existingPurchase) {
              await supabaseAdmin
                .from('user_purchased_beats')
                .insert({
                  user_id: userId,
                  beat_id: item.beat_id,
                  license_type: item.license || 'basic',
                  order_id: orderId,
                  currency_code: 'USD'
                });
            }
          }
        } catch (error) {
          console.error('Error processing session data:', error);
          return new Response(
            JSON.stringify({ error: 'Error processing session data' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
      
      // Return success response
      return new Response(
        JSON.stringify({ 
          verified: true, 
          orderId, 
          paymentStatus: session.payment_status,
          orderStatus: 'completed'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      // Session not paid
      return new Response(
        JSON.stringify({ 
          verified: false, 
          paymentStatus: session.payment_status
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
})
