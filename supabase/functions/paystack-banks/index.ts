// supabase/functions/paystack-banks/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../shared/cors.ts";
import type { PaystackBank } from "../shared/types.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const PAYSTACK_API_URL = "https://api.paystack.co";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
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
    const res = await fetch(
      `${PAYSTACK_API_URL}/bank?country=nigeria&perPage=500`,
      {
        // Fetch more banks if needed
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        "Failed to fetch banks from Paystack:",
        res.status,
        errorText
      );
      throw new Error(`Paystack API error: ${res.status}`);
    }

    const data = await res.json();

    if (!data.status || !Array.isArray(data.data)) {
      console.error("Invalid response format from Paystack /bank:", data);
      throw new Error("Unexpected response format from Paystack.");
    }

    // Ensure correct typing if using shared types
    const banks: PaystackBank[] = data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
      id: bank.id,
    }));

    return new Response(JSON.stringify(banks), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in paystack-banks function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch banks." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
