// supabase/functions/paystack-update-split/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_API_URL = "https://api.paystack.co";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "PUT") {
    // Use PUT for updates
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!PAYSTACK_SECRET) {
    console.error("PAYSTACK_SECRET_KEY environment variable not set.");
    return new Response(
      JSON.stringify({ error: "Internal server configuration error." }),
      { status: 500, headers: corsHeaders }
    );
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

    // 2. Get producerId and new sharePercentage from request body
    const {
      producerId,
      sharePercentage,
    }: { producerId: string; sharePercentage: number } = await req.json();

    if (!producerId || typeof sharePercentage !== "number") {
      return new Response(
        JSON.stringify({ error: "Missing producerId or sharePercentage" }),
        { status: 400, headers: corsHeaders }
      );
    }
    if (sharePercentage < 0 || sharePercentage > 100) {
      return new Response(
        JSON.stringify({ error: "Share percentage must be between 0 and 100" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Fetch existing split and subaccount codes from Supabase
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("paystack_split_code, paystack_subaccount_code, full_name")
      .eq("id", producerId)
      .single();

    if (
      userError ||
      !userData ||
      !userData.paystack_split_code ||
      !userData.paystack_subaccount_code
    ) {
      console.error(
        "Error fetching user or split/subaccount codes:",
        userError?.message || "User or codes not found",
        { producerId }
      );
      return new Response(
        JSON.stringify({
          error: "Split configuration not found for this user.",
        }),
        { status: 404, headers: corsHeaders }
      );
    }
    const splitCode = userData.paystack_split_code;
    const subaccountCode = userData.paystack_subaccount_code;
    const producerName = userData.full_name || "Producer";

    // 4. Update Paystack Split
    // IMPORTANT: Ensure the total share adds up correctly. Here, producer gets `sharePercentage`,
    // platform gets `100 - sharePercentage` implicitly (handled by `percentage_charge` on subaccount).
    // If you had multiple subaccounts in the split, you'd need to list them all.
    const splitUpdatePayload = {
      name: `${producerName} Split`, // Keep name consistent or update if needed
      active: true, // Keep it active
      // Paystack's split update often requires the full subaccount list again
      subaccounts: [
        {
          subaccount: subaccountCode,
          share: sharePercentage, // The new share for the producer
        },
      ],
      // Ensure bearer settings are correct if they need to be specified on update
      // bearer_type: 'subaccount',
      // bearer_subaccount: subaccountCode,
    };

    const splitUpdateResponse = await fetch(
      `${PAYSTACK_API_URL}/split/${splitCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(splitUpdatePayload),
      }
    );

    const splitUpdateData = await splitUpdateResponse.json();
    if (!splitUpdateResponse.ok || !splitUpdateData.status) {
      console.error(
        "Failed to update Paystack split:",
        splitUpdateResponse.status,
        splitUpdateData
      );
      throw new Error(
        splitUpdateData.message || "Failed to update Paystack split percentage"
      );
    }

    // 5. Optionally: Update the share percentage in your own database if you store it
    /*
    const { error: dbUpdateError } = await supabaseClient
        .from('producer_settings') // Or wherever you store this
        .update({ share_percentage: sharePercentage })
        .eq('user_id', producerId);

    if (dbUpdateError) {
        console.warn("Failed to update share percentage in local DB:", dbUpdateError);
    }
    */

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Split percentage updated successfully.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in update-producer-split function:", error);
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to update split percentage.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
