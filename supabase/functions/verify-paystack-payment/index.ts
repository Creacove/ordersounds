
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
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || 'sk_test_ec208ff2f8e96d80e9adca93adbb259e3796a801';
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

    const { reference, orderId, orderItems } = body;
    
    if (!reference) {
      console.error('Missing payment reference');
      throw new Error('Missing payment reference');
    }

    if (!orderId) {
      console.error('Missing order ID');
      throw new Error('Missing order ID');
    }

    console.log(`Processing verification for reference: ${reference}, order: ${orderId}`);
    console.log('Order items received:', orderItems);

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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || "https://uoezlwkxhbzajdivrlby.supabase.co";
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXpsd2t4aGJ6YWpkaXZybGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mzg5MzAsImV4cCI6MjA1ODMxNDkzMH0.TwIkGiLNiuxTdzbAxv6zBgbK1zIeNkhZ6qeX6OmhWOk";
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials');
        throw new Error('Server configuration error');
      }
      
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

      console.log(`Updating order ${orderId} to completed status`);
      
      // First check if order has already been processed
      const { data: orderData, error: orderCheckError } = await supabaseClient
        .from('orders')
        .select('status, buyer_id')
        .eq('id', orderId)
        .maybeSingle();
        
      if (orderCheckError) {
        console.error('Failed to check order status:', orderCheckError);
        throw new Error(`Failed to check order: ${orderCheckError.message}`);
      }
      
      if (!orderData) {
        console.error('Order not found:', orderId);
        throw new Error('Order not found');
      }
      
      // Only proceed if order is still pending
      if (orderData.status !== 'completed') {
        // Update order status
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            status: 'completed',
            consent_timestamp: new Date().toISOString(),
            payment_reference: reference
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

        // Check if purchased items are already recorded
        const { data: existingPurchases, error: checkPurchasesError } = await supabaseClient
          .from('user_purchased_beats')
          .select('id')
          .eq('order_id', orderId);
          
        if (checkPurchasesError) {
          console.error('Failed to check existing purchases:', checkPurchasesError);
        }
        
        // Only add purchases if they don't exist yet
        if (!existingPurchases || existingPurchases.length === 0) {
          // Create a map of beat licenses from the order items
          const beatLicenses: Record<string, string> = {};
          
          if (orderItems && Array.isArray(orderItems)) {
            orderItems.forEach((item: any) => {
              if (item.beat_id && item.license) {
                beatLicenses[item.beat_id] = item.license;
              }
            });
          }
          
          console.log('License information map:', beatLicenses);
        
          // Add purchased beats to user's collection
          if (lineItems && lineItems.length > 0) {
            const purchasedItems = lineItems.map(item => ({
              user_id: orderData.buyer_id,
              beat_id: item.beat_id,
              license_type: beatLicenses[item.beat_id] || 'basic',
              currency_code: item.currency_code,
              order_id: orderId,
            }));
            
            console.log(`Adding ${purchasedItems.length} purchased beats to user collection`);
            const { error: purchaseError } = await supabaseClient
              .from('user_purchased_beats')
              .insert(purchasedItems);
            
            if (purchaseError) {
              console.error('Failed to record purchases:', purchaseError);
              throw new Error(`Recording purchases failed: ${purchaseError.message}`);
            }
          }
        } else {
          console.log(`Purchases already recorded for order ${orderId}`);
        }

        // Get beat details to identify producers
        if (lineItems && lineItems.length > 0) {
          const beatIds = lineItems.map(item => item.beat_id);
          const { data: beats, error: beatsError } = await supabaseClient
            .from('beats')
            .select('id, title, producer_id')
            .in('id', beatIds);
            
          if (beatsError) {
            console.error('Failed to fetch beat details:', beatsError);
            // Continue processing, but without producer notifications
          }
          
          // Create map of beats by ID for easy lookup
          const beatsById: Record<string, any> = {};
          if (beats) {
            beats.forEach(beat => {
              beatsById[beat.id] = beat;
            });
          }

          // Create notification for buyer
          const { error: buyerNotificationError } = await supabaseClient
            .from('notifications')
            .insert({
              recipient_id: orderData.buyer_id,
              title: 'Purchase Completed Successfully',
              body: `Your order has been processed. ${lineItems.length} beat${lineItems.length === 1 ? '' : 's'} added to your library.`,
              is_read: false
            });
            
          if (buyerNotificationError) {
            console.error('Failed to create buyer notification:', buyerNotificationError);
            // Continue processing even if notification fails
          }
          
          // Create notifications for producers
          if (beats) {
            // Group beats by producer
            const beatsByProducer: Record<string, any[]> = {};
            beats.forEach(beat => {
              if (!beat.producer_id) return;
              
              if (!beatsByProducer[beat.producer_id]) {
                beatsByProducer[beat.producer_id] = [];
              }
              
              beatsByProducer[beat.producer_id].push({
                id: beat.id,
                title: beat.title
              });
            });
            
            // Create notifications for each producer
            for (const producerId in beatsByProducer) {
              const producerBeats = beatsByProducer[producerId];
              
              // Don't notify producer if they are the buyer (self-purchase)
              if (producerId === orderData.buyer_id) continue;
              
              const { error: producerNotificationError } = await supabaseClient
                .from('notifications')
                .insert({
                  recipient_id: producerId,
                  title: 'New Beat Sale!',
                  body: producerBeats.length === 1
                    ? `Congratulations! Your beat "${producerBeats[0].title}" was just purchased.`
                    : `Congratulations! ${producerBeats.length} of your beats were just purchased.`,
                  is_read: false
                });
                
              if (producerNotificationError) {
                console.error(`Failed to create notification for producer ${producerId}:`, producerNotificationError);
                // Continue processing even if notification fails
              }
            }
          }

          // Update purchase count for each beat
          for (const item of lineItems) {
            try {
              // Update purchase count directly
              const { error: updateCountError } = await supabaseClient
                .from('beats')
                .update({ purchase_count: supabaseClient.rpc('increment', { column_name: 'purchase_count' }) })
                .eq('id', item.beat_id);
              
              if (updateCountError) {
                console.error(`Failed to update purchase count for beat ${item.beat_id}:`, updateCountError);
                // Continue with other beats even if one fails
              } else {
                console.log(`Updated purchase count for beat ${item.beat_id}`);
              }
            } catch (err) {
              console.error(`Error updating purchase count for beat ${item.beat_id}:`, err);
              // Continue with other beats even if one fails
            }
          }
        }
      } else {
        console.log(`Order ${orderId} already completed, skipping updates`);
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
