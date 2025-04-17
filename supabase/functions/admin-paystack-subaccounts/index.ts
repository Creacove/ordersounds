// supabase/functions/admin-paystack-subaccounts/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";
import type { PaystackBank } from "../shared/types.ts";

// IMPORTANT: Use Service Role Key for admin functions
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY"); // Needed for bank names
const PAYSTACK_API_URL = "https://api.paystack.co";

// Helper function to get banks
async function getBanksInternal(): Promise<PaystackBank[]> {
  if (!PAYSTACK_SECRET) return []; // Cannot fetch without secret
  try {
    const res = await fetch(
      `${PAYSTACK_API_URL}/bank?country=nigeria&perPage=500`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data as PaystackBank[];
  } catch (e) {
    console.error("Admin: Failed to fetch banks internally", e.message);
    return [];
  }
}

// --- Authorization Check ---
// This is a basic example. Implement robust role checking based on your user roles setup.
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

    if (error || !user) {
      console.warn(
        "Admin check: Invalid token or user not found",
        error?.message
      );
      return false;
    }

    // Check for a specific role (e.g., 'admin') in your user metadata or a separate roles table
    // Example: Check a 'user_roles' table
    const { data: roleData, error: roleError } = await supabaseAdminClient
      .from("user_roles") // Assuming you have a table linking users to roles
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin") // Check for the 'admin' role
      .maybeSingle(); // Use maybeSingle if a user might not have the role

    if (roleError) {
      console.error("Admin check: Error fetching user role", roleError);
      return false;
    }

    return !!roleData; // True if an 'admin' role record was found for the user

    // --- OR ---
    // Example: Check app_metadata (less flexible, harder to manage roles)
    // return user.app_metadata?.roles?.includes('admin');
  } catch (e) {
    console.error("Admin check: Exception during auth check", e);
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
    // Fetch all producers with subaccount codes using the admin client
    const { data: producers, error: dbError } = await supabaseAdminClient
      .from("users")
      .select(
        "id, full_name, stage_name, email, paystack_subaccount_code, bank_code, account_number, verified_account_name"
      )
      .eq("role", "producer") // Ensure you only get producers
      .not("paystack_subaccount_code", "is", null); // Only those with subaccounts

    if (dbError) {
      console.error(
        "Admin: Error fetching producers with subaccounts:",
        dbError
      );
      throw new Error("Database error while fetching subaccounts.");
    }

    if (!producers || producers.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Fetch bank names to enrich the data
    const banks = await getBanksInternal();
    const bankMap = new Map(banks.map((b) => [b.code, b.name]));

    // Map to the desired admin format
    const formattedData = producers.map((producer) => ({
      id: producer.id,
      producer_name: producer.stage_name || producer.full_name || "N/A",
      email: producer.email,
      subaccount_code: producer.paystack_subaccount_code,
      bank_details: {
        bank_name:
          bankMap.get(producer.bank_code) || producer.bank_code || "Unknown", // Show code if name not found
        account_number: producer.account_number,
        account_name: producer.verified_account_name || "N/A",
      },
    }));

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Admin: Error fetching subaccounts:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch subaccounts.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
