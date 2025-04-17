import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { usePaystackSplit } from "@/hooks/payment/usePaystackSplit";
import { fetchSupportedBanks } from "@/utils/payment/paystackSplitUtils";
import { useAuth } from "@/context/AuthContext";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Bank {
  name: string;
  code: string;

  id: number;
}

interface ProducerBankDetailsFormProps {
  producerId: string;
  existingBankCode?: string;
  existingAccountNumber?: string;
  existingAccountName?: string;
  onSuccess?: () => void;
}

const formSchema = z.object({
  bank_code: z.string().min(1, "Bank selection is required"),
  account_number: z
    .string()
    .min(10, "Account number must be at least 10 digits"),
});

export function ProducerBankDetailsForm({
  producerId,
  existingBankCode,
  existingAccountNumber,
  existingAccountName,
  onSuccess,
}: ProducerBankDetailsFormProps) {
  // Always default to read-only mode if bank details exist
  const hasCompleteDetails = !!(
    existingBankCode &&
    existingAccountNumber &&
    existingAccountName
  );

  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!hasCompleteDetails);
  const { user, updateProfile, updateUserInfo } = useAuth();
  const {
    isLoading,
    accountName,
    isVerifying,
    updateBankDetails,
    verifyBankAccount,
  } = usePaystackSplit();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank_code: existingBankCode || "",
      account_number: existingAccountNumber || "",
    },
  });

  // Load banks only when in edit mode
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const banksList = await fetchSupportedBanks();
        // Filter only active banks

        setBanks(
          banksList.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error loading banks:", error);
        toast({
          title: "Error",
          description: "Failed to load bank list. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };

    if (isEditMode) {
      loadBanks();
    }
  }, [toast, isEditMode]);

  // Verify account number when changed
  const onAccountChange = async (bankCode: string, accountNumber: string) => {
    if (bankCode && accountNumber && accountNumber.length >= 10) {
      await verifyBankAccount(accountNumber, bankCode);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User session not found",
        variant: "destructive",
      });
      return;
    }

    // Verify the account first
    const isVerified = await verifyBankAccount(
      values.account_number,
      values.bank_code
    );

    if (!isVerified) {
      toast({
        title: "Error",
        description:
          "Bank account verification failed. Please check your details.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, update the database directly
      const { error } = await supabase
        .from("users")
        .update({
          bank_code: values.bank_code,
          account_number: values.account_number,
          verified_account_name: accountName,
        })
        .eq("id", producerId);

      if (error) {
        console.error("Error updating bank details in database:", error);
        throw new Error("Failed to update bank details in database");
      }

      // Create updated user object immutably
      const updatedUser = {
        ...user,
        bank_code: values.bank_code,
        account_number: values.account_number,
        verified_account_name: accountName,
      };

      // Update local user context
      if (updateUserInfo) {
        // This directly updates the user context without an API call
        updateUserInfo(updatedUser);
      } else if (updateProfile) {
        // Fallback to updateProfile if updateUserInfo is not available
        await updateProfile(updatedUser);
      }

      // Only try to create/update Paystack subaccount if specifically needed
      try {
        await updateBankDetails(producerId, {
          bank_code: values.bank_code,
          account_number: values.account_number,
        });
      } catch (splitError) {
        console.error("Error updating Paystack split account:", splitError);
        // Continue even if Paystack update fails - we've updated the database
      }

      setIsEditMode(false);

      toast({
        title: "Success",
        description: "Bank details saved successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast({
        title: "Error",
        description: "Failed to save bank details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Find bank name from bank code
  const getBankNameFromCode = (code: string | undefined): string => {
    if (!code) return "Your Bank";
    const bank = banks.find((b) => b.code === code);
    return bank ? bank.name : "Bank Account";
  };

  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber: string | undefined): string => {
    if (!accountNumber) return "";
    return accountNumber.slice(-4).padStart(accountNumber.length, "*");
  };

  // Always check for complete bank details first - this is our absolute priority
  if (hasCompleteDetails && !isEditMode) {
    // Show read-only view of bank details with edit button
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bank Account Connected
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {getBankNameFromCode(existingBankCode)} Account{" "}
                {existingAccountName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Account Number: {formatAccountNumber(existingAccountNumber)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-1"
            >
              <PenLine className="h-3 w-3" />
              <span>Edit Bank Details</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show form for editing/adding bank details
  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="bank_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <Select
                  disabled={isLoadingBanks || isLoading}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const accountNumber = form.getValues("account_number");
                    if (accountNumber) {
                      onAccountChange(value, accountNumber);
                    }
                  }}
                  value={field.value} // Use value instead of defaultValue
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80">
                    {isLoadingBanks ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading banks...</span>
                      </div>
                    ) : (
                      banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 10-digit account number"
                    {...field}
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      const bankCode = form.getValues("bank_code");
                      if (bankCode && e.target.value.length >= 10) {
                        onAccountChange(bankCode, e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Account name verification result */}
          {(isVerifying || accountName || existingAccountName) && (
            <div
              className={`p-3 rounded-md ${
                isVerifying
                  ? "bg-blue-50 border border-blue-200"
                  : accountName
                  ? "bg-green-50 border border-green-200"
                  : "bg-amber-50 border border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-blue-600">
                      Verifying account details...
                    </span>
                  </>
                ) : accountName ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Account Name: {accountName}
                    </span>
                  </>
                ) : existingAccountName ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">
                      Account Name: {existingAccountName}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      Account verification failed
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <FormDescription className="text-xs">
            Your bank details are securely encrypted and only used for payment
            processing. Please ensure your account details are correct to avoid
            payment issues.
          </FormDescription>

          <div className="flex justify-end space-x-2">
            {hasCompleteDetails && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || isVerifying}
              className="relative"
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <span className={isLoading ? "opacity-0" : ""}>
                {existingBankCode ? "Save Changes" : "Save Bank Details"}
              </span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
