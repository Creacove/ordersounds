import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Since RLS is disabled, we don't need to get auth headers,
    // but we'll keep the structure in case RLS is re-enabled later
    let user_id = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );
        
        if (!authError && user) {
          user_id = user.id;
        }
      } catch (e) {
        console.error("Auth error:", e);
        // Continue without authentication since RLS is disabled
      }
    }
    
    let producerIds = [];
    
    // If we have a user_id, try to get followed producers
    if (user_id) {
      const { data: followers, error: followersError } = await supabase
        .from("followers")
        .select("followee_id")
        .eq("follower_id", user_id);
      
      if (!followersError && followers && followers.length > 0) {
        producerIds = followers.map(follow => follow.followee_id);
      }
    }
    
    // If no followed producers, get recently uploaded beats
    let beatsQuery = supabase
      .from("beats")
      .select(`
        id, 
        title, 
        cover_image,
        basic_license_price_local,
        producer_id,
        users!beats_producer_id_fkey (
          stage_name,
          full_name
        )
      `)
      .order("upload_date", { ascending: false })
      .limit(10);
    
    // Filter by followed producers if available
    if (producerIds.length > 0) {
      beatsQuery = beatsQuery.in("producer_id", producerIds);
    }
    
    const { data: beats, error: beatsError } = await beatsQuery;
    
    if (beatsError) {
      console.error("Error fetching beats:", beatsError);
      return new Response(
        JSON.stringify({ error: beatsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return recommended beats
    return new Response(
      JSON.stringify({ beats: beats || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
