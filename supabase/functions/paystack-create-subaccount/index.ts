// supabase/functions/paystack-create-subaccount/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";
import type { SubaccountResponse, PaystackBank } from "../shared/types.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_API_URL = "https://api.paystack.co";

// Helper function to get banks (could also invoke the paystack-banks function)
async function getBanksInternal(): Promise<PaystackBank[]> {
  const res = await fetch(
    `${PAYSTACK_API_URL}/bank?country=nigeria&perPage=500`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch banks internally");
  const data = await res.json();
  return data.data as PaystackBank[];
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
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
    // Ensure the user is authenticated by checking the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }
    // Create client with the user's token to enforce RLS
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, // Use anon key, auth is handled by header
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

    // 3. Fetch user bank details from Supabase (using the authenticated client)
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("bank_code, account_number, verified_account_name, full_name") // Ensure 'verified_account_name' is populated after resolve step
      .eq("id", producerId)
      .single();

    if (
      userError ||
      !userData ||
      !userData.bank_code ||
      !userData.account_number ||
      !userData.verified_account_name
    ) {
      console.error(
        "Error retrieving user bank details or details incomplete:",
        userError?.message || "Missing/incomplete bank details",
        { producerId, hasData: !!userData }
      );
      const clientMessage = userError?.message.includes("multiple rows")
        ? "Internal configuration error." // Avoid exposing too much detail
        : "Missing or unverified bank details. Please update and verify your bank information first.";
      return new Response(JSON.stringify({ error: clientMessage }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 4. Create Paystack Subaccount
    const subaccountPayload = {
      business_name:
        userData.full_name || `Producer ${producerId.substring(0, 8)}`, // Use a fallback name
      settlement_bank: userData.bank_code,
      account_number: userData.account_number,
      // Paystack uses the verified name during creation/update, no need to send it here usually
      percentage_charge: 10.0, // Platform's share (e.g., 10%) - Paystack calculates this FROM the total
    };

    const subaccountResponse = await fetch(`${PAYSTACK_API_URL}/subaccount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subaccountPayload),
    });

    const subaccountData = await subaccountResponse.json();
    if (!subaccountResponse.ok || !subaccountData.status) {
      console.error(
        "Failed to create Paystack subaccount:",
        subaccountResponse.status,
        subaccountData
      );
      throw new Error(
        subaccountData.message || "Failed to create Paystack subaccount"
      );
    }
    const subaccountCode = subaccountData.data.subaccount_code;
    const paystackAccountName = subaccountData.data.account_name; // Use the name Paystack confirmed

    // 5. Create Paystack Split
    const splitPayload = {
      name: `${userData.full_name || "Producer"} Split`,
      type: "percentage",
      currency: "NGN",
      subaccounts: [
        {
          subaccount: subaccountCode,
          share: 90, // Producer's share (90%)
        },
        // The remaining 10% (defined in subaccount percentage_charge) goes to the main account
      ],
      bearer_type: "subaccount", // The subaccount bears the Paystack transaction charge from their share
      bearer_subaccount: subaccountCode,
    };

    const splitResponse = await fetch(`${PAYSTACK_API_URL}/split`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(splitPayload),
    });

    const splitData = await splitResponse.json();
    if (!splitResponse.ok || !splitData.status) {
      console.error(
        "Failed to create Paystack split:",
        splitResponse.status,
        splitData
      );
      // Consider attempting to delete the created subaccount here for cleanup
      throw new Error(splitData.message || "Failed to create Paystack split");
    }
    const splitCode = splitData.data.split_code;

    // 6. Update user record in Supabase (still using user's auth context)
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({
        paystack_subaccount_code: subaccountCode,
        paystack_split_code: splitCode,
        // Optionally update verified_account_name again if Paystack provided a slightly different one
        // verified_account_name: paystackAccountName
      })
      .eq("id", producerId);

    if (updateError) {
      console.error(
        "Error updating user record with Paystack codes:",
        updateError
      );
      // Critical: Subaccount/Split created but not saved. Manual intervention might be needed.
      // Consider logging this prominently or sending an alert.
      throw new Error("Failed to save payment configuration to user profile.");
    }

    // 7. Get Bank Name for response
    let bankName = "Unknown Bank";
    try {
      const banks = await getBanksInternal();
      bankName =
        banks.find((bank) => bank.code === userData.bank_code)?.name ||
        "Unknown Bank";
    } catch (bankError) {
      console.warn(
        "Could not fetch bank name for response:",
        bankError.message
      );
    }

    // 8. Prepare and return success response
    const responsePayload: SubaccountResponse = {
      subaccount_code: subaccountCode,
      split_code: splitCode,
      account_name: paystackAccountName, // Use the name confirmed by Paystack
      bank_name: bankName,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-producer-subaccount function:", error);
    // Check if the error is due to invalid JSON body
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create payment account.",
      }),
      {
        status: 500, // Or 400 if it's a known client-side issue caught earlier
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
