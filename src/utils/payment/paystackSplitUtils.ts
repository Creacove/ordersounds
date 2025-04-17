// src/utils/payment/paystackSplitUtils.ts
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ProducerBankDetails,
  SubaccountResponse,
  PaystackBank,
} from "@/types"; // Import shared types

// --- Keep Type Definitions ---
export type { ProducerBankDetails, SubaccountResponse, PaystackBank };

// --- Remove PAYSTACK_SECRET constant ---
// const PAYSTACK_SECRET = "sk_test_... THIS MUST BE REMOVED";

// --- Update functions to call Edge Functions ---

export const fetchSupportedBanks = async (): Promise<PaystackBank[]> => {
  try {
    console.log("Fetching supported banks via Edge Function");
    const { data, error } = await supabase.functions.invoke<PaystackBank[]>(
      "paystack-banks"
    );

    if (error) throw error;
    if (!data) throw new Error("No data returned from paystack-banks function");
    console.log("data", data);
    return data;
  } catch (error: any) {
    console.error("Error fetching banks via Edge Function:", error);
    toast.error(error.message || "Failed to fetch supported banks.");
    return [];
  }
};

export const resolveAccountNumber = async (
  accountNumber: string,
  bankCode: string
): Promise<string | null> => {
  try {
    console.log("Resolving account number via Edge Function:", {
      accountNumber,
      bankCode,
    });
    const { data, error } = await supabase.functions.invoke<
      { account_name: string } | { error: string }
    >("paystack-resolve-account", { body: { accountNumber, bankCode } });

    if (error) throw error; // Network or function invocation error

    // Check for application-level error returned in the data payload
    if (data && "error" in data) {
      console.error("Error resolving account from Edge Function:", data.error);
      toast.error(data.error); // Show specific error from backend
      return null;
    }

    if (data && "account_name" in data) {
      return data.account_name;
    } else {
      throw new Error("Invalid response format from resolve function");
    }
  } catch (error: any) {
    console.error("Error invoking resolve account Edge Function:", error);
    // Avoid double-toasting if already handled above
    if (!(error.message && error.message.includes("Invalid response format"))) {
      // toast.error(error.message || "Failed to verify account number.");
      // Let the function error handler display the toast
    }
    return null;
  }
};

export const createProducerSubaccount = async (
  producerId: string
): Promise<SubaccountResponse | null> => {
  try {
    console.log(
      "Creating producer subaccount via Edge Function for producer:",
      producerId
    );
    toast.info("Setting up payment account..."); // Give user feedback

    const { data, error } = await supabase.functions.invoke<
      SubaccountResponse | { error: string }
    >("paystack-create-subaccount", { body: { producerId } });

    if (error) throw error; // Network/invocation error

    if (data && "error" in data) {
      console.error(
        "Error creating subaccount from Edge Function:",
        data.error
      );
      toast.error(data.error);
      return null;
    }

    if (data && "subaccount_code" in data) {
      console.log("Subaccount created successfully via Edge Function:", data);
      toast.success("Payment account created successfully!");
      return data;
    } else {
      throw new Error(
        "Invalid response format from create subaccount function"
      );
    }
  } catch (error: any) {
    console.error("Error invoking create subaccount Edge Function:", error);
    // Avoid double-toasting
    if (!(error.message && error.message.includes("Invalid response format"))) {
      toast.error(error.message || "Failed to create payment account.");
    }
    return null;
  }
};

export const updateProducerBankDetails = async (
  producerId: string,
  bankDetails: ProducerBankDetails // Make sure account_name is included if needed by update function
): Promise<boolean> => {
  try {
    console.log("Updating producer bank details via Edge Function:", {
      producerId,
      bankDetails,
    });
    toast.info("Updating bank details...");

    // You might need to resolve the account name *before* calling the update function
    // if the Edge Function doesn't do it internally.
    const resolvedName = await resolveAccountNumber(
      bankDetails.account_number,
      bankDetails.bank_code
    );
    if (!resolvedName) {
      // Error already shown by resolveAccountNumber
      return false;
    }
    // Add resolved name if your update function expects it
    // const detailsToSend = { ...bankDetails, account_name: resolvedName };

    const { data, error } = await supabase.functions.invoke<
      { success?: boolean; message?: string } | { error: string }
    >(
      "paystack-update-subaccount", // Ensure this function exists and is deployed
      { method: "PUT", body: { producerId, bankDetails /* : detailsToSend */ } }
    );

    if (error) throw error;

    if (data && "error" in data) {
      console.error(
        "Error updating bank details from Edge Function:",
        data.error
      );
      toast.error(data.error);
      return false;
    }

    if (data && "success" in data && data.success !== undefined) {
      console.log("Bank details updated successfully via Edge Function", data);
      toast.success(data.message || "Bank details updated successfully.");
      return true;
    } else {
      throw new Error(
        "Update failed or invalid response format from update function"
      );
    }
  } catch (error: any) {
    console.error("Error invoking update bank details Edge Function:", error);
    if (!(error.message && error.message.includes("Update failed"))) {
      toast.error(error.message || "Failed to update bank details.");
    }
    return false;
  }
};

export const updateProducerSplitPercentage = async (
  producerId: string,
  sharePercentage: number
): Promise<boolean> => {
  try {
    if (sharePercentage < 0 || sharePercentage > 100) {
      toast.error("Share percentage must be between 0 and 100");
      return false;
    }
    console.log("Updating split percentage via Edge Function:", {
      producerId,
      sharePercentage,
    });
    toast.info("Updating split percentage...");

    const { data, error } = await supabase.functions.invoke<
      { success?: boolean; message?: string } | { error: string }
    >(
      "paystack-update-split", // Ensure this function exists and is deployed
      { body: { producerId, sharePercentage } }
    );

    if (error) throw error;

    if (data && "error" in data) {
      console.error(
        "Error updating split percentage from Edge Function:",
        data.error
      );
      toast.error(data.error);
      return false;
    }

    if (data && "success" in data && data.success !== undefined) {
      console.log("Split percentage updated successfully via Edge Function");
      toast.success(data.message || "Split percentage updated successfully.");
      return true;
    } else {
      throw new Error(
        "Update failed or invalid response format from split update function"
      );
    }
  } catch (error: any) {
    console.error(
      "Error invoking update split percentage Edge Function:",
      error
    );
    if (!(error.message && error.message.includes("Update failed"))) {
      toast.error(error.message || "Failed to update split percentage.");
    }
    return false;
  }
};

export const getProducerSplitCode = async (
  producerId: string
): Promise<string | null> => {
  try {
    console.log("Fetching producer split code via Edge Function:", producerId);
    const { data, error } = await supabase.functions.invoke<
      { split_code: string } | { error: string }
    >(
      "get-producer-split-code", // Ensure this function exists and is deployed
      { body: { producerId } }
    );

    if (error) throw error;

    if (data && "error" in data) {
      // Don't toast for "not found" errors usually, just return null
      if (!data.error.toLowerCase().includes("not found")) {
        console.error(
          "Error fetching split code from Edge Function:",
          data.error
        );
        toast.error(data.error);
      } else {
        console.log("Split code not found for producer:", producerId);
      }
      return null;
    }

    if (data && "split_code" in data) {
      return data.split_code;
    } else {
      throw new Error("Invalid response format from get split code function");
    }
  } catch (error: any) {
    console.error("Error invoking get split code Edge Function:", error);
    if (!(error.message && error.message.includes("Invalid response format"))) {
      toast.error(error.message || "Failed to fetch producer configuration.");
    }
    return null;
  }
};

export const initializePaystackSplitTransaction = async (
  email: string,
  amount: number, // Expect amount in MAJOR unit (Naira) here, convert before sending if needed
  splitCode: string,
  reference?: string, // Optional reference from client
  metadata?: any, // Optional metadata
  callbackUrl?: string // Optional callback URL
): Promise<{
  authorization_url: string;
  reference: string;
  access_code: string;
} | null> => {
  try {
    console.log("Initializing transaction via Edge Function:", {
      email,
      amount,
      splitCode,
      reference,
    });
    toast.info("Initializing payment...");

    // Convert amount to Kobo for the backend
    const amountInKobo = Math.round(amount * 100);
    if (amountInKobo <= 0) {
      toast.error("Invalid payment amount.");
      return null;
    }

    const body: any = {
      email,
      amount: amountInKobo,
      splitCode,
      metadata,
      callbackUrl,
    };
    if (reference) {
      body.reference = reference;
    }

    const { data, error } = await supabase.functions.invoke<
      | { authorization_url: string; reference: string; access_code: string }
      | { error: string }
    >("paystack-init-transaction", { body });

    if (error) throw error;

    if (data && "error" in data) {
      console.error(
        "Error initializing transaction from Edge Function:",
        data.error
      );
      toast.error(data.error);
      return null;
    }

    if (data && "authorization_url" in data) {
      console.log("Transaction initialized successfully:", data);
      // No toast here, usually redirect happens next
      return data;
    } else {
      throw new Error("Invalid response format from init transaction function");
    }
  } catch (error: any) {
    console.error("Error invoking init transaction Edge Function:", error);
    if (!(error.message && error.message.includes("Invalid response format"))) {
      toast.error(error.message || "Failed to initialize payment.");
    }
    return null;
  }
};

// --- Admin Functions ---

export const adminFetchAllSubaccounts = async (): Promise<any[]> => {
  try {
    console.log("Fetching all subaccounts via Admin Edge Function");
    // Assumes the admin user is logged in and the token will be sent automatically
    const { data, error } = await supabase.functions.invoke<
      any[] | { error: string }
    >("admin-paystack-subaccounts");

    if (error) throw error; // Network or invocation error (like 401/403 if auth fails)

    if (data && Array.isArray(data)) {
      return data;
    } else if (data && "error" in data) {
      console.error(
        "Error fetching admin subaccounts from Edge Function:",
        data.error
      );
      toast.error(data.error); // e.g., "Forbidden"
      return [];
    } else {
      throw new Error(
        "Invalid response format from admin subaccounts function"
      );
    }
  } catch (error: any) {
    console.error("Error invoking admin subaccounts Edge Function:", error);
    // Handle specific HTTP errors if needed (e.g., 403 Forbidden)
    const message =
      error.context?.httpStatus === 403
        ? "Access Denied"
        : error.message || "Failed to fetch subaccounts.";
    toast.error(message);
    return [];
  }
};

export const adminFetchAllSplits = async (): Promise<any[]> => {
  try {
    console.log("Fetching all splits via Admin Edge Function");
    const { data, error } = await supabase.functions.invoke<
      any[] | { error: string }
    >("admin-paystack-splits");

    if (error) throw error;

    if (data && Array.isArray(data)) {
      return data;
    } else if (data && "error" in data) {
      console.error(
        "Error fetching admin splits from Edge Function:",
        data.error
      );
      toast.error(data.error);
      return [];
    } else {
      throw new Error("Invalid response format from admin splits function");
    }
  } catch (error: any) {
    console.error("Error invoking admin splits Edge Function:", error);
    const message =
      error.context?.httpStatus === 403
        ? "Access Denied"
        : error.message || "Failed to fetch splits.";
    toast.error(message);
    return [];
  }
};

// --- Functions that might remain client-side (or also become Edge Functions) ---

/**
 * Get producer payment analytics (Example - likely needs DB access -> Edge Function)
 */
export const getProducerPaymentAnalytics = async (
  producerId: string
): Promise<any> => {
  // TODO: Implement this, likely by calling another Edge Function
  // that queries your orders/transactions table securely.
  console.warn(
    "getProducerPaymentAnalytics needs to be implemented, likely via an Edge Function."
  );
  toast.info("Loading payment analytics...");
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
  // Return mock data for now
  return {
    total_earnings: 0,
    pending_balance: 0,
    successful_payments: 0,
    pending_payments: 0,
    failed_payments: 0,
    recent_transactions: [],
    monthly_earnings: [],
    // Add mock data structure here if needed for UI development
  };
};
