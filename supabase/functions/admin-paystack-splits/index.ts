// supabase/functions/admin-paystack-splits/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";

// IMPORTANT: Use Service Role Key for admin functions
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

// --- Authorization Check (reuse or adapt from admin-paystack-subaccounts) ---
async function isAdmin(
  supabaseAdminClient: SupabaseClient,
  authHeader: string | null
): Promise<boolean> {
  if (!authHeader) return false;
  try {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabaseAdminClient.auth.getUser(token);
    if (error || !user) return false;
    // Implement your role checking logic here (e.g., check 'user_roles' table)
    const { data: roleData, error: roleError } = await supabaseAdminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    return !roleError && !!roleData;
  } catch (e) {
    return false;
  }
}
// --- End Authorization Check ---

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error(
      "Admin function config error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return new Response(
      JSON.stringify({ error: "Internal server configuration error." }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Initialize Supabase client with Service Role Key
  const supabaseAdminClient: SupabaseClient = createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY
  );

  // --- Perform Authorization Check ---
  const authHeader = req.headers.get("Authorization");
  const isUserAdmin = await isAdmin(supabaseAdminClient, authHeader);
  if (!isUserAdmin) {
    console.warn(
      "Admin access denied for token:",
      authHeader?.substring(0, 15) + "..."
    );
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: corsHeaders,
    });
  }
  // --- End Authorization Check ---

  try {
    // Fetch all producers with split codes using the admin client
    const { data: producers, error: dbError } = await supabaseAdminClient
      .from("users")
      .select("id, full_name, stage_name, email, paystack_split_code") // Add share_percentage if stored in DB
      .eq("role", "producer")
      .not("paystack_split_code", "is", null);

    if (dbError) {
      console.error("Admin: Error fetching producers with splits:", dbError);
      throw new Error("Database error while fetching splits.");
    }

    if (!producers || producers.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Map to the desired admin format
    // NOTE: The share_percentage is hardcoded to 90 as in the original client code.
    // For accurate data, you would either:
    // 1. Store the percentage in your DB when creating/updating the split.
    // 2. Fetch each split details from Paystack API here (requires PAYSTACK_SECRET and is less efficient).
    const formattedData = producers.map((producer) => ({
      id: producer.id,
      producer_name: producer.stage_name || producer.full_name || "N/A",
      email: producer.email,
      split_code: producer.paystack_split_code,
      // Fetch this from DB if available, otherwise use default or fetch from Paystack
      share_percentage: 90, // Default producer share as per original logic
    }));

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Admin: Error fetching splits:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch splits." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
