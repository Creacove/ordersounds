// supabase/functions/paystack-resolve-account/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../shared/cors.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_API_URL = "https://api.paystack.co";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PAYSTACK_SECRET) {
    console.error("PAYSTACK_SECRET_KEY environment variable not set.");
    return new Response(
      JSON.stringify({ error: "Internal server configuration error." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return new Response(
        JSON.stringify({ error: "Missing accountNumber or bankCode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      `${PAYSTACK_API_URL}/bank/resolve?account_number=${encodeURIComponent(
        accountNumber
      )}&bank_code=${encodeURIComponent(bankCode)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const respData = await response.json();

    if (!response.ok || !respData.status) {
      console.error("Failed to resolve account:", response.status, respData);
      const errorMessage =
        respData.message ||
        `Failed to resolve account number (${response.status})`;
      // Distinguish between client error (e.g., invalid account) and server error
      const status =
        response.status === 404 || response.status === 422 ? 400 : 500;
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (respData.data && respData.data.account_name) {
      return new Response(
        JSON.stringify({ account_name: respData.data.account_name }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.error(
        "Invalid response format from Paystack /bank/resolve:",
        respData
      );
      return new Response(
        JSON.stringify({
          error: "Failed to resolve account: Invalid response format",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error resolving account number:", error);
    // Check if the error is due to invalid JSON body
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
