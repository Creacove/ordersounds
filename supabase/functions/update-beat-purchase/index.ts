
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get request body
    const { beatId, userId } = await req.json();

    if (!beatId) {
      return new Response(
        JSON.stringify({ error: "Beat ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Increment the purchase count for the beat
    const { data, error } = await supabase.rpc("increment_counter", {
      p_table_name: "beats",
      p_column_name: "purchase_count",
      p_id: beatId
    });

    if (error) {
      console.error("Error incrementing purchase count:", error);
      throw error;
    }

    // If user is provided, create a notification
    if (userId) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: userId,
          title: "Beat Purchase Complete",
          body: "Your beat purchase is complete. You can now download the full track from your library.",
          is_read: false,
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, new_count: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in update-beat-purchase function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
