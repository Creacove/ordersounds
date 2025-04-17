
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
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the producers this user follows
    const { data: followers, error: followersError } = await supabase
      .from("followers")
      .select("followee_id")
      .eq("follower_id", user.id);
    
    if (followersError) {
      return new Response(
        JSON.stringify({ error: followersError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If user doesn't follow anyone, return empty array
    if (!followers || followers.length === 0) {
      return new Response(
        JSON.stringify({ beats: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get the producer IDs
    const producerIds = followers.map(follow => follow.followee_id);
    
    try {
      // Use a simpler query with fewer joins and columns to reduce timeout risk
      const { data: beats, error: beatsError } = await supabase
        .from("beats")
        .select(`
          id, 
          title, 
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          producer_id,
          genre,
          bpm,
          status,
          tags,
          track_type,
          upload_date,
          plays,
          favorites_count,
          purchase_count
        `)
        .in("producer_id", producerIds)
        .eq("status", "published")
        .order("upload_date", { ascending: false })
        .limit(10);
      
      if (beatsError) {
        console.error("Error fetching beats:", beatsError);
        return new Response(
          JSON.stringify({ error: beatsError.message, beats: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get producer names in a separate query to avoid complex joins
      if (beats && beats.length > 0) {
        const producersData = {};
        
        // Get unique producer IDs from the beats
        const uniqueProducerIds = [...new Set(beats.map(beat => beat.producer_id))];
        
        // Fetch producer data
        const { data: producers, error: producersError } = await supabase
          .from("users")
          .select("id, full_name, stage_name")
          .in("id", uniqueProducerIds);
          
        if (!producersError && producers) {
          // Create lookup object
          producers.forEach(producer => {
            producersData[producer.id] = {
              full_name: producer.full_name,
              stage_name: producer.stage_name
            };
          });
          
          // Add producer data to each beat
          beats.forEach(beat => {
            if (producersData[beat.producer_id]) {
              beat.producer = producersData[beat.producer_id];
            }
          });
        }
      }
      
      // Return recommended beats
      return new Response(
        JSON.stringify({ beats: beats || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (queryError) {
      console.error("Query processing error:", queryError);
      // Return empty beats array instead of error to prevent frontend crashes
      return new Response(
        JSON.stringify({ error: "Database query timed out", beats: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Server error:", error);
    // Return empty beats array to prevent frontend crashes
    return new Response(
      JSON.stringify({ error: error.message, beats: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
