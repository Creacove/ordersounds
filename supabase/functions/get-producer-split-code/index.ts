// supabase/functions/get-producer-split-code/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    // Expecting producerId in body
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Initialize Supabase Client (using user's auth token)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Get producerId from request body
    const { producerId } = await req.json();
    if (!producerId) {
      return new Response(JSON.stringify({ error: "Missing producerId" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Fetch split code (RLS should ensure user can only fetch their own)
    const { data, error } = await supabaseClient
      .from("users")
      .select("paystack_split_code")
      .eq("id", producerId)
      .single();

    if (error) {
      // Log the specific error server-side, but return a generic message
      console.error(
        `Error fetching split code for ${producerId}:`,
        error.message
      );
      // Distinguish between "not found" (404) and other errors (500)
      const status = error.message.toLowerCase().includes("no rows")
        ? 404
        : 500;
      const clientMessage =
        status === 404 ? "Split code not found." : "Error fetching split code.";
      return new Response(JSON.stringify({ error: clientMessage }), {
        status,
        headers: corsHeaders,
      });
    }

    if (!data || !data.paystack_split_code) {
      return new Response(JSON.stringify({ error: "Split code not found." }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // 4. Return the split code
    return new Response(
      JSON.stringify({ split_code: data.paystack_split_code }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-producer-split-code function:", error);
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
