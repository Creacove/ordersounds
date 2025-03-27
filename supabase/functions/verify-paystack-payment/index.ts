
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      throw new Error('Missing Paystack secret key');
    }

    const { reference, orderId } = await req.json();
    
    if (!reference) {
      throw new Error('Missing payment reference');
    }

    // Verify the payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification response:', JSON.stringify(verifyData));

    if (!verifyResponse.ok) {
      throw new Error(`Paystack verification failed: ${verifyData.message || 'Unknown error'}`);
    }

    // Check if payment was successful
    const isVerified = 
      verifyData.status === true && 
      verifyData.data.status === 'success';

    // If verified, update the database
    if (isVerified && orderId) {
      // Create a Supabase client (this is secure in edge functions)
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
        }
      );

      // Log transaction details for auditing
      console.log(`Payment verified for order ${orderId} with transaction reference ${reference}`);
      
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

// Supabase client creation function for TypeScript (needed in edge functions)
function createClient(supabaseUrl: string, supabaseKey: string, options?: any) {
  return { 
    from: (table: string) => ({
      update: (data: any) => ({
        eq: (column: string, value: any) => 
          fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(data),
          }),
      }),
    }),
  };
}
