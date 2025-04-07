import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Bank {
  name: string;
  code: string;
  active: boolean;
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
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const { user, updateProfile } = useAuth();
  const {
    isLoading,
    accountName,
    isVerifying,
    updateBankDetails,
    verifyBankAccount,
  } = usePaystackSplit();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bank_code: existingBankCode || "",
      account_number: existingAccountNumber || "",
    },
  });

  // Load banks on component mount
  useEffect(() => {
    const loadBanks = async () => {
      setIsLoadingBanks(true);
      try {
        const banksList = await fetchSupportedBanks();
        // Filter only active banks
        const activeBanks = banksList.filter((bank: Bank) => bank.active);
        setBanks(
          activeBanks.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error loading banks:", error);
        toast.error("Failed to load bank list. Please try again later.");
      } finally {
        setIsLoadingBanks(false);
      }
    };

    loadBanks();
  }, []);

  // Verify account number when changed
  const onAccountChange = async (bankCode: string, accountNumber: string) => {
    if (bankCode && accountNumber && accountNumber.length >= 10) {
      await verifyBankAccount(accountNumber, bankCode);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("User session not found");
      return;
    }

    // Verify the account first
    const isVerified = await verifyBankAccount(
      values.account_number,
      values.bank_code
    );

    if (!isVerified) {
      toast.error(
        "Bank account verification failed. Please check your details."
      );
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

      // Then try to create or update Paystack subaccount
      const success = await updateBankDetails(producerId, {
        bank_code: values.bank_code,
        account_number: values.account_number,
      });

      // Update local user context
      if (updateProfile) {
        await updateProfile({
          ...user,
          bank_code: values.bank_code,
          account_number: values.account_number,
          verified_account_name: accountName,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      toast.error("Failed to save bank details. Please try again.");
    }
  };

  // Selected bank name
  const getSelectedBankName = () => {
    const code = form.watch("bank_code");
    if (!code) return "";
    const selected = banks.find((bank) => bank.code === code);
    return selected ? selected.name : "";
  };

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
                  defaultValue={field.value}
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
                        <SelectItem key={bank.name} value={bank.code}>
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
            <Button
              variant="outline"
              type="button"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isVerifying}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Bank Details
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
