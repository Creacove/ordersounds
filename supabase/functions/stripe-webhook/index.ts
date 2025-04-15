
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.33.1'
import { Stripe } from 'https://esm.sh/stripe@12.4.0'

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }
    
    const body = await req.text();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Handle successful payments
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract metadata
      const orderId = session.metadata.order_id || session.client_reference_id;
      const userId = session.metadata.user_id;
      const items = JSON.parse(session.metadata.items_json || '[]');
      
      if (!orderId || !userId || items.length === 0) {
        console.error('Missing required payment metadata:', { orderId, userId, itemsCount: items.length });
        return new Response('Missing required payment metadata', { status: 400 });
      }
      
      console.log('Processing successful payment:', { 
        orderId, 
        userId, 
        itemsCount: items.length 
      });
      
      try {
        // Update order status
        await supabaseAdmin
          .from('orders')
          .update({ 
            status: 'completed',
            payment_reference: session.id
          })
          .eq('id', orderId);
        
        // Record payment details
        await supabaseAdmin
          .from('payments')
          .insert({
            order_id: orderId,
            amount: session.amount_total / 100, // Convert from cents
            payment_method: 'Stripe',
            status: 'successful',
            transaction_reference: session.id,
            payment_details: session,
            producer_share: (session.amount_total / 100) * 0.9, // 90% to producer
            platform_share: (session.amount_total / 100) * 0.1, // 10% to platform
          });
        
        // Record purchased beats for the user
        for (const item of items) {
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
        
        console.log('Successfully processed payment and created purchase records.');
        return new Response(JSON.stringify({ success: true }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing payment records:', error);
        return new Response(`Error processing payment records: ${error.message}`, { status: 500 });
      }
    }
    
    // Handle other events
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
})
