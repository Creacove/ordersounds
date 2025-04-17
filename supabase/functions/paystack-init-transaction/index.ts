// supabase/functions/paystack-init-transaction/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../shared/cors.ts";
import { v4 as uuidv4 } from "https://deno.land/std@0.177.0/uuid/mod.ts"; // For generating reference if needed

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_API_URL = "https://api.paystack.co";

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
    // 1. Get details from request body
    // Ensure amount is in KOBO (smallest currency unit for NGN)
    const { email, amount, splitCode, reference, metadata, callbackUrl } =
      await req.json();

    if (!email || !amount || !splitCode) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, amount (kobo), splitCode",
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    if (typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount provided." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate a unique reference if one isn't provided
    const transactionReference =
      reference || `os_${uuidv4().replace(/-/g, "")}`;

    // 2. Prepare Paystack payload
    const payload: any = {
      email: email,
      amount: Math.round(amount), // Ensure it's an integer (kobo)
      currency: "NGN",
      reference: transactionReference,
      split_code: splitCode,
      metadata: metadata || {}, // Include any custom metadata
    };

    // Add callback_url if provided (URL Paystack redirects to after payment)
    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    // 3. Call Paystack Initialize Transaction API
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error(
        "Failed to initialize Paystack transaction:",
        response.status,
        data
      );
      throw new Error(data.message || "Failed to initialize payment");
    }

    // 4. Return authorization URL, access code, and reference
    const responsePayload = {
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference, // Return the reference used (either provided or generated)
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error initializing Paystack transaction:", error);
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to initialize payment.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
