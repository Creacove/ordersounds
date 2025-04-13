
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request to get producerId from the JSON body
    const { producerId } = await req.json();

    if (!producerId) {
      return new Response(
        JSON.stringify({ error: "Producer ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Reset any existing producer of the week
    const { error: resetError } = await supabase
      .from('users')
      .update({ is_producer_of_week: false })
      .eq('is_producer_of_week', true);

    if (resetError) {
      console.error("Error resetting producer of the week:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to reset producer of the week" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Set the new producer of the week
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_producer_of_week: true })
      .eq('id', producerId);

    if (updateError) {
      console.error("Error setting producer of the week:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to set producer of the week" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Producer of the week updated successfully" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
