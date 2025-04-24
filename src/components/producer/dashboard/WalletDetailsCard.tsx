
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isValidSolanaAddress } from "@/utils/payment/solanaTransactions";

interface WalletDetailsCardProps {
  userId: string;
  producerData: any;
  onSuccess: () => void;
}

export function WalletDetailsCard({
  userId,
  producerData,
  onSuccess,
}: WalletDetailsCardProps) {
  const [walletAddress, setWalletAddress] = useState<string>(
    producerData?.wallet_address || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value.trim();
    setWalletAddress(address);
    
    if (address) {
      const valid = isValidSolanaAddress(address);
      setIsAddressValid(valid);
    } else {
      setIsAddressValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAddressValid) {
      toast.error("Please enter a valid Solana wallet address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("users")
        .update({ wallet_address: walletAddress })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast.success("Wallet address saved successfully");
      onSuccess();
    } catch (error) {
      console.error("Error saving wallet address:", error);
      toast.error("Failed to save wallet address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Set Up Payment Wallet</CardTitle>
        <CardDescription>
          Enter your wallet address to receive automatic payments for your beat
          sales. You will receive 90% of each sale directly to your wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Solana Wallet Address</Label>
              <div className="relative">
                <Input
                  id="walletAddress"
                  placeholder="Enter your Solana wallet address"
                  value={walletAddress}
                  onChange={handleAddressChange}
                  className={`pr-10 ${
                    isAddressValid === true
                      ? "border-green-500"
                      : isAddressValid === false
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {isAddressValid === true && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {isAddressValid === false && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                )}
              </div>
              {isAddressValid === false && (
                <p className="text-sm text-red-500 mt-1">
                  Please enter a valid Solana wallet address
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isAddressValid !== true}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Wallet Address"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
