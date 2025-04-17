// supabase/functions/paystack-update-subaccount/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../shared/cors.ts";
import type { ProducerBankDetails } from "../shared/types.ts";

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

    // 2. Get producerId and new bankDetails from request body
    const {
      producerId,
      bankDetails,
    }: { producerId: string; bankDetails: ProducerBankDetails } =
      await req.json();
    if (
      !producerId ||
      !bankDetails ||
      !bankDetails.account_number ||
      !bankDetails.bank_code
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing producerId or complete bankDetails (account_number, bank_code)",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Fetch existing subaccount code from Supabase
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("paystack_subaccount_code, full_name, paystack_split_code") // Fetch name for potential update payload
      .eq("id", producerId)
      .single();

    if (userError || !userData) {
      console.error(
        "Error fetching user:",
        userError?.message || "User not found",
        { producerId }
      );
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    let subaccountCode = userData.paystack_subaccount_code;
    if (!subaccountCode) {
      // Subaccount doesn't exist, create it
      console.log(`Subaccount not found for user ${producerId}, creating...`);

      const createPayload = {
        business_name:
          userData.full_name || `Producer ${producerId.substring(0, 8)}`,
        settlement_bank: bankDetails.bank_code,
        account_number: bankDetails.account_number,
        percentage_charge: 10.0,
        description: `Subaccount for producer ${producerId}`,
        primary_contact_email: userData.email,
      };

      const createResponse = await fetch(`${PAYSTACK_API_URL}/subaccount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createPayload),
      });

      const createData = await createResponse.json();
      if (!createResponse.ok || !createData.status) {
        console.error(
          "Failed to create Paystack subaccount:",
          createResponse.status,
          createData
        );
        throw new Error(
          createData.message || "Failed to create Paystack subaccount"
        );
      }

      subaccountCode = createData.data.subaccount_code;

      // Update Supabase with the new subaccount code
      const { error: dbUpdateError } = await supabaseClient
        .from("users")
        .update({ paystack_subaccount_code: subaccountCode })
        .eq("id", producerId);

      if (dbUpdateError) {
        console.error(
          "Error updating subaccount code in Supabase:",
          dbUpdateError
        );
        // Log this, but maybe don't fail the whole request as Paystack was updated.
      }

      console.log(
        `Subaccount created successfully for user ${producerId} with code ${subaccountCode}`
      );
    } else {
      console.log(
        `Subaccount found for user ${producerId} with code ${subaccountCode}, updating...`
      );
    }

    // 4. Update Paystack Subaccount
    // Note: You might need to re-verify the account name with the resolve endpoint first
    // before sending the update to Paystack, depending on your flow.
    const updatePayload = {
      settlement_bank: bankDetails.bank_code,
      account_number: bankDetails.account_number,
      // You might need to include business_name again, check Paystack docs
      // business_name: userData.full_name || `Producer ${producerId.substring(0, 8)}`,
      // active: true // Ensure it remains active if needed
    };

    const updateResponse = await fetch(
      `${PAYSTACK_API_URL}/subaccount/${subaccountCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    const updateData = await updateResponse.json();
    if (!updateResponse.ok || !updateData.status) {
      console.error(
        "Failed to update Paystack subaccount:",
        updateResponse.status,
        updateData
      );
      throw new Error(
        updateData.message || "Failed to update Paystack subaccount"
      );
    }

    // 5. Create Paystack Split if updating
    let splitCode = userData.paystack_split_code;
    if (!splitCode) {
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
      splitCode = splitData.data.split_code;

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
        throw new Error(
          "Failed to save payment configuration to user profile."
        );
      }
    }
    // 7. Optionally: Update user record in Supabase with new bank details if you store them there
    //    Make sure to update `verified_account_name` after resolving the *new* details.
    //    This step depends on whether you store bank details directly on the user table
    //    or rely solely on Paystack. If storing, you MUST resolve the new details first.

    // Example (if storing details and assuming new details were pre-verified client-side or via resolve):
    /*
    const { error: dbUpdateError } = await supabaseClient
        .from('users')
        .update({
            bank_code: bankDetails.bank_code,
            account_number: bankDetails.account_number,
            verified_account_name: bankDetails.account_name // Assumes it was resolved and passed in
        })
        .eq('id', producerId);

    if (dbUpdateError) {
        console.error("Error updating bank details in Supabase after Paystack update:", dbUpdateError);
        // Log this, but maybe don't fail the whole request as Paystack was updated.
    }
    */

    // 8. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Bank details updated successfully.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in update-producer-subaccount function:", error);
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to update bank details.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
